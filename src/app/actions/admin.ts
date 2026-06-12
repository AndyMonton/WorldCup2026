"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { MatchStatus, MatchStage, Role, LeagueRole } from "@prisma/client";
import { calculateScore } from "@/lib/scoring";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

/**
 * Recalcula los puntos y estadísticas de las membresías de liga de un usuario,
 * respetando si está habilitado o no en cada fase.
 */
export async function recalculateUserLeagueMemberships(tx: any, userId: string) {
  // Obtener todas las predicciones puntuadas de este usuario
  const allUserPredictions = await tx.prediction.findMany({
    where: { userId, points: { not: null } },
    include: { match: true },
  });

  let pointsPhase1 = 0; // Grupos
  let pointsPhase2 = 0; // 16vos y 8vos
  let pointsPhase3 = 0; // 4tos, semis, 3er puesto, final

  for (const p of allUserPredictions) {
    const pts = p.points || 0;
    // Separar por fases
    if (p.match.stage === MatchStage.GROUPS) {
      pointsPhase1 += pts;
    } else if (p.match.stage === MatchStage.ROUND_32 || p.match.stage === MatchStage.ROUND_16) {
      pointsPhase2 += pts;
    } else {
      pointsPhase3 += pts;
    }
  }

  // Sumar también puntos de predicciones a largo plazo (si ya fueron evaluadas)
  const bonusPrediction = await tx.tournamentBonusPrediction.findUnique({
    where: { userId },
  });

  const bpPoints = bonusPrediction
    ? (bonusPrediction.championPoints || 0) +
      (bonusPrediction.runnerUpPoints || 0) +
      (bonusPrediction.topScorerPoints || 0)
    : 0;

  // Obtener todas las membresías del usuario
  const memberships = await tx.leagueMembership.findMany({
    where: { userId },
    include: { league: true },
  });

  for (const membership of memberships) {
    const isPaymentRequired = membership.league.requiresPayment;
    const finalPhase1 = (!isPaymentRequired || membership.activePhase1) ? pointsPhase1 : 0;
    const finalPhase2 = (!isPaymentRequired || membership.activePhase2) ? pointsPhase2 : 0;
    const finalPhase3 = (!isPaymentRequired || membership.activePhase3) ? pointsPhase3 : 0;
    const finalPoints = finalPhase1 + finalPhase2 + finalPhase3 + bpPoints;

    // Calcular estadísticas (exactCount, etc.) solo de fases activas
    let exactCount = 0;
    let differenceCount = 0;
    let tendencyCount = 0;
    let consolationCount = 0;
    let bonusCount = 0;

    for (const p of allUserPredictions) {
      let isPhaseActive = false;
      if (p.match.stage === MatchStage.GROUPS) {
        isPhaseActive = !isPaymentRequired || membership.activePhase1;
      } else if (p.match.stage === MatchStage.ROUND_32 || p.match.stage === MatchStage.ROUND_16) {
        isPhaseActive = !isPaymentRequired || membership.activePhase2;
      } else {
        isPhaseActive = !isPaymentRequired || membership.activePhase3;
      }

      if (isPhaseActive) {
        if (p.exactMatch) exactCount++;
        if (p.goalDifferenceMatch) differenceCount++;
        if (p.tendencyMatch) tendencyCount++;
        if (p.consolationMatch) consolationCount++;
        if (p.bonusMatch) bonusCount++;
      }
    }

    await tx.leagueMembership.update({
      where: { id: membership.id },
      data: {
        points: finalPoints,
        pointsPhase1: finalPhase1,
        pointsPhase2: finalPhase2,
        pointsPhase3: finalPhase3,
        exactCount,
        differenceCount,
        tendencyCount,
        consolationCount,
        bonusCount,
      },
    });
  }
}

/**
 * Registra o actualiza el marcador real de un partido y recalcula los puntos
 * de todos los usuarios para ese partido, actualizando los rankings.
 */
export async function saveMatchResult(
  matchId: string,
  homeScore: number,
  awayScore: number,
  homeScoreExtra: number | null = null,
  awayScoreExtra: number | null = null,
  homeScorePenalties: number | null = null,
  awayScorePenalties: number | null = null,
  winnerId: string | null = null,
  status: MatchStatus = MatchStatus.FINISHED,
  homeScorers: string | null = null,
  awayScorers: string | null = null
) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return { success: false, error: "Acceso denegado. Se requieren permisos de administrador." };
    }

    // 1. Buscar el partido
    const match = await prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      return { success: false, error: "El partido no existe." };
    }

    // 2. Ejecutar la actualización del partido y recalcular puntos en una transacción de base de datos
    await prisma.$transaction(async (tx) => {
      // a. Actualizar el partido
      const updatedMatch = await tx.match.update({
        where: { id: matchId },
        data: {
          homeScore,
          awayScore,
          homeScoreExtra,
          awayScoreExtra,
          homeScorePenalties,
          awayScorePenalties,
          winnerId,
          status,
          homeScorers,
          awayScorers,
        },
      });

      // b. Obtener todas las predicciones para este partido
      const predictions = await tx.prediction.findMany({
        where: { matchId },
      });

      // c. Recalcular y actualizar cada predicción en paralelo
      await Promise.all(predictions.map((pred) => {
        const scoreBreakdown = calculateScore(
          {
            homeScore: pred.homeScore,
            awayScore: pred.awayScore,
            predictedWinnerId: pred.predictedWinnerId,
          },
          {
            homeScore,
            awayScore,
            winnerId,
            stage: updatedMatch.stage,
          }
        );

        return tx.prediction.update({
          where: { id: pred.id },
          data: {
            points: scoreBreakdown.points,
            detail: scoreBreakdown.detail,
            exactMatch: scoreBreakdown.exactMatch,
            goalDifferenceMatch: scoreBreakdown.goalDifferenceMatch,
            tendencyMatch: scoreBreakdown.tendencyMatch,
            consolationMatch: scoreBreakdown.consolationMatch,
            bonusMatch: scoreBreakdown.bonusMatch,
          },
        });
      }));

      // d. Actualizar la caché de puntajes en LeagueMembership para todos los usuarios afectados (en paralelo)
      const userIds = Array.from(new Set(predictions.map((p) => p.userId)));
      await Promise.all(userIds.map((uId) => recalculateUserLeagueMemberships(tx, uId)));

      // e. Recalcular goleadores
      await recalculateGoalscorers(tx);

      // Guardar log de auditoría
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "SAVE_MATCH_RESULT",
          details: `Marcador guardado para partido ID ${matchId}: ${homeScore}-${awayScore}. Goleadores y puntos recalculados.`,
        },
      });
    }, {
      timeout: 45000 // 45 segundos
    });

    revalidatePath("/predictions");
    revalidatePath("/dashboard");
    revalidatePath("/ranking");

    return { success: true, error: null };
  } catch (error: any) {
    console.error("Error al registrar marcador del partido:", error);
    return { success: false, error: "Ocurrió un error inesperado al guardar el resultado." };
  }
}

/**
 * Permite cambiar el rol de un usuario o habilitarlo/bloquearlo.
 */
export async function updateUserRole(targetUserId: string, newRole: Role) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return { success: false, error: "Acceso denegado." };
    }

    if (session.user.id === targetUserId) {
      return { success: false, error: "No podés cambiar tu propio rol." };
    }

    await prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE_USER_ROLE",
        details: `Rol del usuario ID ${targetUserId} actualizado a ${newRole}.`,
      },
    });

    revalidatePath("/admin");
    return { success: true, error: null };
  } catch (error: any) {
    console.error("Error al actualizar rol de usuario:", error);
    return { success: false, error: "Error al actualizar rol." };
  }
}

/**
 * Crea una nueva liga privada desde el panel.
 */
export async function createNewLeague(name: string, inviteCode: string) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return { success: false, error: "Acceso denegado." };
    }

    const code = inviteCode.trim().toUpperCase();
    if (code.length < 3) {
      return { success: false, error: "El código debe tener al menos 3 caracteres." };
    }

    const existingLeague = await prisma.league.findUnique({
      where: { inviteCode: code },
    });

    if (existingLeague) {
      return { success: false, error: "Este código de invitación ya está en uso." };
    }

    const newLeague = await prisma.league.create({
      data: {
        name: name.trim(),
        inviteCode: code,
      },
    });

    await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "CREATE_LEAGUE",
          details: `Liga creada: ${newLeague.name} con código ${newLeague.inviteCode}.`,
        },
      });
  
      revalidatePath("/admin");
      return { success: true, error: null };
    } catch (error: any) {
      console.error("Error al crear liga:", error);
      return { success: false, error: "Ocurrió un error inesperado al crear la liga." };
    }
  }
  
  /**
   * Elimina un usuario de la base de datos de forma permanente (y cascada todas sus membresías y predicciones).
   */
  export async function deleteUser(targetUserId: string) {
    try {
      const session = await auth();
      if (!session || session.user?.role !== "ADMIN") {
        return { success: false, error: "Acceso denegado. Se requieren permisos de administrador." };
      }
  
      if (session.user.id === targetUserId) {
        return { success: false, error: "No podés eliminarte a vos mismo." };
      }
  
      await prisma.user.delete({
        where: { id: targetUserId },
      });
  
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "DELETE_USER",
          details: `Usuario ID ${targetUserId} eliminado permanentemente de la base de datos.`,
        },
      });
  
      revalidatePath("/admin");
      return { success: true, error: null };
    } catch (error: any) {
      console.error("Error al eliminar usuario:", error);
      return { success: false, error: "Error al eliminar el usuario de la base de datos." };
    }
  }
  
  /**
   * Cambia o elimina (establece como PENDIENTE) el sector de un usuario.
   */
  export async function updateUserDepartment(targetUserId: string, newDepartment: string) {
    try {
      const session = await auth();
      if (!session || session.user?.role !== "ADMIN") {
        return { success: false, error: "Acceso denegado. Se requieren permisos de administrador." };
      }
  
      const membership = await prisma.leagueMembership.findFirst({
        where: { userId: targetUserId },
      });
  
      if (!membership) {
        return { success: false, error: "El usuario no tiene una membresía de liga." };
      }
  
      const deptValue = newDepartment.trim() || "PENDIENTE";
  
      await prisma.leagueMembership.update({
        where: { id: membership.id },
        data: { department: deptValue },
      });
  
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "UPDATE_USER_DEPARTMENT",
          details: `Sector del usuario ID ${targetUserId} actualizado a ${deptValue}.`,
        },
      });
  
      revalidatePath("/admin");
      return { success: true, error: null };
    } catch (error: any) {
      console.error("Error al actualizar sector del usuario:", error);
      return { success: false, error: "Error al actualizar el sector." };
    }
  }

/**
 * Agrega un sector/departamento a una liga específica.
 */
export async function addLeagueSector(leagueId: string, sectorName: string) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return { success: false, error: "Acceso denegado. Se requieren permisos de administrador." };
    }

    const name = sectorName.trim();
    if (!name) {
      return { success: false, error: "El nombre del sector no puede estar vacío." };
    }

    const league = await prisma.league.findUnique({
      where: { id: leagueId },
    });

    if (!league) {
      return { success: false, error: "La liga especificada no existe." };
    }

    // Cargar los sectores actuales (de la DB o por defecto)
    let currentSectors: string[] = [];
    if (league.departments) {
      try {
        currentSectors = JSON.parse(league.departments);
      } catch (e) {
        const { getSectorsForLeague } = require("@/lib/sectors");
        currentSectors = getSectorsForLeague(league.inviteCode);
      }
    } else {
      const { getSectorsForLeague } = require("@/lib/sectors");
      currentSectors = getSectorsForLeague(league.inviteCode);
    }

    if (currentSectors.some(s => s.toLowerCase() === name.toLowerCase())) {
      return { success: false, error: "Este sector ya existe en la liga." };
    }

    const updatedSectors = [...currentSectors, name];

    await prisma.league.update({
      where: { id: leagueId },
      data: {
        departments: JSON.stringify(updatedSectors),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "ADD_LEAGUE_SECTOR",
        details: `Sector "${name}" agregado a la liga "${league.name}".`,
      },
    });

    revalidatePath("/admin");
    return { success: true, error: null, sectors: updatedSectors };
  } catch (error: any) {
    console.error("Error al agregar sector a la liga:", error);
    return { success: false, error: "Ocurrió un error al agregar el sector." };
  }
}

/**
 * Elimina un sector/departamento de una liga específica.
 * Cambia el sector de todos los usuarios en ese sector a "PENDIENTE" en esa liga.
 */
export async function deleteLeagueSector(leagueId: string, sectorName: string) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return { success: false, error: "Acceso denegado. Se requieren permisos de administrador." };
    }

    const league = await prisma.league.findUnique({
      where: { id: leagueId },
    });

    if (!league) {
      return { success: false, error: "La liga especificada no existe." };
    }

    // Cargar los sectores actuales (de la DB o por defecto)
    let currentSectors: string[] = [];
    if (league.departments) {
      try {
        currentSectors = JSON.parse(league.departments);
      } catch (e) {
        const { getSectorsForLeague } = require("@/lib/sectors");
        currentSectors = getSectorsForLeague(league.inviteCode);
      }
    } else {
      const { getSectorsForLeague } = require("@/lib/sectors");
      currentSectors = getSectorsForLeague(league.inviteCode);
    }

    const updatedSectors = currentSectors.filter(
      (s) => s.toLowerCase() !== sectorName.toLowerCase()
    );

    // Actualizar liga
    await prisma.league.update({
      where: { id: leagueId },
      data: {
        departments: JSON.stringify(updatedSectors),
      },
    });

    // Resetear usuarios de ese sector a PENDIENTE
    const updateResult = await prisma.leagueMembership.updateMany({
      where: {
        leagueId,
        department: sectorName,
      },
      data: {
        department: "PENDIENTE",
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "DELETE_LEAGUE_SECTOR",
        details: `Sector "${sectorName}" eliminado de la liga "${league.name}". ${updateResult.count} usuario(s) reseteados a PENDIENTE.`,
      },
    });

    revalidatePath("/admin");
    return { success: true, error: null, sectors: updatedSectors };
  } catch (error: any) {
    console.error("Error al eliminar sector de la liga:", error);
    return { success: false, error: "Ocurrió un error al eliminar el sector." };
  }
}

/**
 * Habilita o deshabilita la participación de múltiples usuarios en una fase específica de una liga.
 */
export async function updateUsersPhaseStatus(
  userIds: string[],
  leagueId: string,
  phase: 1 | 2 | 3,
  active: boolean
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return { success: false, error: "Acceso denegado. Se requiere iniciar sesión." };
    }

    // Permitir si es ADMIN global
    let isAllowed = session.user?.role === "ADMIN";

    // Si no es ADMIN global, verificar si es COLLABORATOR, ADMIN o OWNER de la liga
    if (!isAllowed) {
      const callerMembership = await prisma.leagueMembership.findUnique({
        where: {
          userId_leagueId: {
            userId: session.user.id,
            leagueId,
          },
        },
      });
      if (
        callerMembership &&
        (callerMembership.role === "COLLABORATOR" ||
          callerMembership.role === "ADMIN" ||
          callerMembership.role === "OWNER")
      ) {
        isAllowed = true;
      }
    }

    if (!isAllowed) {
      return { success: false, error: "Acceso denegado. Se requieren permisos de administrador o colaborador para esta liga." };
    }

    if (userIds.length === 0) {
      return { success: false, error: "No se seleccionó ningún usuario." };
    }

    if (!leagueId) {
      return { success: false, error: "Debe seleccionar una liga." };
    }

    await prisma.$transaction(async (tx) => {
      // 1. Obtener y actualizar los LeagueMembership de los usuarios para la liga especificada
      const memberships = await tx.leagueMembership.findMany({
        where: {
          userId: { in: userIds },
          leagueId,
        },
      });

      // Actualizar y recalcular en paralelo
      await Promise.all(memberships.map(async (m) => {
        const updateData: any = {};
        if (phase === 1) updateData.activePhase1 = active;
        else if (phase === 2) updateData.activePhase2 = active;
        else if (phase === 3) updateData.activePhase3 = active;

        await tx.leagueMembership.update({
          where: { id: m.id },
          data: updateData,
        });

        // 2. Recalcular los puntos del usuario en base a los nuevos flags
        await recalculateUserLeagueMemberships(tx, m.userId);
      }));

      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "UPDATE_USERS_PHASE_STATUS",
          details: `Habilitación de Fase ${phase} actualizada a ${active ? "ACTIVA" : "INACTIVA"} para ${userIds.length} usuario(s) en la liga ID ${leagueId}.`,
        },
      });
    }, {
      timeout: 45000 // 45 segundos
    });

    revalidatePath("/admin");
    revalidatePath("/predictions");
    revalidatePath("/dashboard");
    revalidatePath("/ranking");

    return { success: true, error: null };
  } catch (error: any) {
    console.error("Error al actualizar habilitación de fase de usuarios:", error);
    return { success: false, error: "Ocurrió un error al actualizar la habilitación de fase." };
  }
}

export async function updateLeagueTransferInfo(
  leagueId: string,
  transferAlias: string,
  transferAmount: number | null,
  transferAccountName: string | null,
  transferPhone: string | null,
  requiresPayment: boolean = true
) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return { success: false, error: "Acceso denegado. Se requieren permisos de administrador." };
    }

    const accountName = transferAccountName ? transferAccountName.trim().substring(0, 200) : null;
    const phone = transferPhone ? transferPhone.trim().substring(0, 25) : null;

    await prisma.$transaction(async (tx) => {
      // 1. Obtener la liga actual para ver si cambió requiresPayment
      const currentLeague = await tx.league.findUnique({
        where: { id: leagueId },
      });

      // 2. Actualizar liga
      await tx.league.update({
        where: { id: leagueId },
        data: {
          transferAlias: transferAlias.trim() || null,
          transferAmount: transferAmount !== null && !isNaN(transferAmount) ? transferAmount : null,
          transferAccountName: accountName,
          transferPhone: phone,
          requiresPayment,
        },
      });

      // 3. Si cambió requiresPayment, recalculamos todos los miembros en paralelo
      if (currentLeague && currentLeague.requiresPayment !== requiresPayment) {
        const memberships = await tx.leagueMembership.findMany({
          where: { leagueId },
        });
        await Promise.all(memberships.map((m) => recalculateUserLeagueMemberships(tx, m.userId)));
      }

      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "UPDATE_LEAGUE_TRANSFER_INFO",
          details: `Información de transferencia de liga ID ${leagueId} actualizada. Alias: ${transferAlias.trim() || 'Ninguno'}. Importe: ${transferAmount || 'Ninguno'}. Titular: ${accountName || 'Ninguno'}. Tel: ${phone || 'Ninguno'}. Requiere pago: ${requiresPayment ? "SI" : "NO"}.`,
        },
      });
    }, {
      timeout: 45000 // 45 segundos
    });

    revalidatePath("/admin");
    revalidatePath("/rules");
    revalidatePath("/dashboard");
    revalidatePath("/ranking");
    revalidatePath("/predictions");
    revalidatePath("/collaborator");
    return { success: true, error: null };
  } catch (error: any) {
    console.error("Error al actualizar info de transferencia de liga:", error);
    return { success: false, error: "Ocurrió un error inesperado al actualizar la información." };
  }
}

export async function updateUserPaymentStatus(
  userId: string,
  leagueId: string,
  hasPaid: boolean
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return { success: false, error: "Acceso denegado. Se requiere iniciar sesión." };
    }

    // Permitir si es ADMIN global
    let isAllowed = session.user?.role === "ADMIN";

    // Si no es ADMIN global, verificar si es COLLABORATOR, ADMIN o OWNER de la liga
    if (!isAllowed) {
      const callerMembership = await prisma.leagueMembership.findUnique({
        where: {
          userId_leagueId: {
            userId: session.user.id,
            leagueId,
          },
        },
      });
      if (
        callerMembership &&
        (callerMembership.role === "COLLABORATOR" ||
          callerMembership.role === "ADMIN" ||
          callerMembership.role === "OWNER")
      ) {
        isAllowed = true;
      }
    }

    if (!isAllowed) {
      return { success: false, error: "Acceso denegado. Se requieren permisos de administrador o colaborador para esta liga." };
    }

    const membership = await prisma.leagueMembership.findUnique({
      where: {
        userId_leagueId: {
          userId,
          leagueId,
        },
      },
    });

    if (!membership) {
      return { success: false, error: "No se encontró la membresía de la liga." };
    }

    await prisma.leagueMembership.update({
      where: { id: membership.id },
      data: { hasPaid },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE_USER_PAYMENT_STATUS",
        details: `Estado de pago del usuario ID ${userId} en liga ID ${leagueId} actualizado a: ${hasPaid ? 'PAGADO' : 'PENDIENTE'} por usuario ID ${session.user.id}.`,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/ranking");
    revalidatePath("/collaborator");
    return { success: true, error: null };
  } catch (error: any) {
    console.error("Error al actualizar estado de pago:", error);
    return { success: false, error: "Ocurrió un error inesperado al actualizar el estado de pago." };
  }
}

export async function updateUserLeagueRole(
  targetUserId: string,
  leagueId: string,
  newRole: LeagueRole
) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return { success: false, error: "Acceso denegado. Se requieren permisos de administrador." };
    }

    const membership = await prisma.leagueMembership.findUnique({
      where: {
        userId_leagueId: {
          userId: targetUserId,
          leagueId,
        },
      },
    });

    if (!membership) {
      return { success: false, error: "No se encontró la membresía del usuario en la liga." };
    }

    await prisma.leagueMembership.update({
      where: { id: membership.id },
      data: { role: newRole },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE_USER_LEAGUE_ROLE",
        details: `Rol de liga de usuario ID ${targetUserId} en liga ID ${leagueId} actualizado a: ${newRole}.`,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/collaborator");
    return { success: true, error: null };
  } catch (error: any) {
    console.error("Error al actualizar rol de liga:", error);
    return { success: false, error: "Ocurrió un error inesperado al actualizar el rol de la liga." };
  }
}

export async function adminResetUserPassword(targetUserId: string, newPassword: string) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return { success: false, error: "Acceso denegado. Se requieren permisos de administrador." };
    }

    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: "La contraseña debe tener al menos 6 caracteres." };
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      return { success: false, error: "Usuario no encontrado." };
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: targetUserId },
      data: { passwordHash: newHash },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "ADMIN_RESET_USER_PASSWORD",
        details: `Contraseña del usuario ${targetUser.email} restablecida por el administrador.`,
      },
    });

    return { success: true, error: null };
  } catch (error: any) {
    console.error("Error al restablecer contraseña por el admin:", error);
    return { success: false, error: "Ocurrió un error inesperado al restablecer la contraseña." };
  }
}

/**
 * Actualiza el nombre de una liga específica.
 */
export async function updateLeagueName(leagueId: string, newName: string) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return { success: false, error: "Acceso denegado. Se requieren permisos de administrador." };
    }

    const name = newName.trim();
    if (!name) {
      return { success: false, error: "El nombre de la liga no puede estar vacío." };
    }

    await prisma.league.update({
      where: { id: leagueId },
      data: { name },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE_LEAGUE_NAME",
        details: `Nombre de la liga ID ${leagueId} actualizado a: ${name}.`,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/dashboard");
    revalidatePath("/ranking");

    return { success: true, error: null };
  } catch (error: any) {
    console.error("Error al actualizar nombre de la liga:", error);
    return { success: false, error: "Ocurrió un error inesperado al actualizar el nombre." };
  }
}

export async function updateLeaguePaymentRequirement(leagueId: string, requiresPayment: boolean) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return { success: false, error: "Acceso denegado. Se requieren permisos de administrador." };
    }

    await prisma.$transaction(async (tx) => {
      // 1. Actualizar liga
      await tx.league.update({
        where: { id: leagueId },
        data: { requiresPayment },
      });

      // 2. Obtener miembros
      const memberships = await tx.leagueMembership.findMany({
        where: { leagueId },
      });

      // 3. Recalcular en paralelo
      await Promise.all(memberships.map((m) => recalculateUserLeagueMemberships(tx, m.userId)));

      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "UPDATE_LEAGUE_PAYMENT_REQUIREMENT",
          details: `Requisito de pago para liga ID ${leagueId} actualizado a: ${requiresPayment ? "SI" : "NO"}.`,
        },
      });
    }, {
      timeout: 45000 // 45 segundos
    });

    revalidatePath("/admin");
    revalidatePath("/dashboard");
    revalidatePath("/ranking");
    revalidatePath("/rules");
    revalidatePath("/predictions");
    revalidatePath("/collaborator");

    return { success: true, error: null };
  } catch (error: any) {
    console.error("Error al actualizar requisito de pago de la liga:", error);
    return { success: false, error: "Ocurrió un error inesperado al actualizar el requisito de pago." };
  }
}

/**
 * Parsea la cadena de texto de goleadores devuelta por la API (ej: "{“J. Quiñones 9'”,”R. Jiménez 67'”}")
 * y devuelve un array con los nombres y cantidad de goles de cada jugador.
 */
function parseScorersString(scorersStr: string | null): { name: string; goals: number }[] {
  if (!scorersStr || scorersStr === "null" || scorersStr.trim() === "") {
    return [];
  }

  let clean = scorersStr.replace(/[{}]/g, "");
  clean = clean.replace(/[“”"']/g, "");

  const parts = clean.split(",");
  const scorersMap: Record<string, number> = {};

  let lastPlayerName = "";

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const hasLetters = /[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(trimmed);

    if (hasLetters) {
      const match = trimmed.match(/^([^0-9]+)/);
      if (match) {
        const name = match[1].trim();
        const digitMatches = trimmed.match(/\d+/g);
        const goalsCount = digitMatches ? digitMatches.length : 1;

        scorersMap[name] = (scorersMap[name] || 0) + goalsCount;
        lastPlayerName = name;
      }
    } else {
      if (lastPlayerName) {
        const digitMatches = trimmed.match(/\d+/g);
        const goalsCount = digitMatches ? digitMatches.length : 1;
        scorersMap[lastPlayerName] = (scorersMap[lastPlayerName] || 0) + goalsCount;
      }
    }
  }

  return Object.entries(scorersMap).map(([name, goals]) => ({ name, goals }));
}

/**
 * Limpia y recalcula por completo la tabla de goleadores (Scorer) a partir de los
 * partidos finalizados y sus campos de goleadores.
 */
export async function recalculateGoalscorers(tx: any) {
  // 1. Limpiar todos los goleadores actuales
  await tx.scorer.deleteMany();

  // 2. Obtener todos los partidos finalizados
  const finishedMatches = await tx.match.findMany({
    where: { status: MatchStatus.FINISHED },
  });

  const scorersMap: Record<string, { teamId: string; goals: number }> = {};

  for (const match of finishedMatches) {
    if (match.homeTeamId && match.homeScorers) {
      const parsedHome = parseScorersString(match.homeScorers);
      for (const p of parsedHome) {
        const key = `${p.name}_${match.homeTeamId}`;
        if (!scorersMap[key]) {
          scorersMap[key] = { teamId: match.homeTeamId, goals: 0 };
        }
        scorersMap[key].goals += p.goals;
      }
    }
    if (match.awayTeamId && match.awayScorers) {
      const parsedAway = parseScorersString(match.awayScorers);
      for (const p of parsedAway) {
        const key = `${p.name}_${match.awayTeamId}`;
        if (!scorersMap[key]) {
          scorersMap[key] = { teamId: match.awayTeamId, goals: 0 };
        }
        scorersMap[key].goals += p.goals;
      }
    }
  }

  // 3. Crear los registros en la tabla Scorer
  for (const [key, val] of Object.entries(scorersMap)) {
    const name = key.substring(0, key.lastIndexOf("_"));
    await tx.scorer.create({
      data: {
        name,
        teamId: val.teamId,
        goals: val.goals,
      },
    });
  }
}


