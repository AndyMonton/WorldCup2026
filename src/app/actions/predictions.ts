"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

/**
 * Guarda o actualiza la predicción de un usuario para un partido específico.
 */
export async function savePrediction(
  matchId: string,
  homeScore: number,
  awayScore: number,
  predictedWinnerId?: string | null
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: "Usuario no autenticado." };
    }

    // 1. Buscar el partido y verificar plazos de bloqueo
    const match = await prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      return { success: false, error: "El partido no existe." };
    }

    if (match.status === "FINISHED" || match.status === "PLAYING") {
      return { success: false, error: "El partido ya comenzó o finalizó." };
    }

    // El límite es 15 minutos antes del inicio del partido
    const deadline = new Date(match.date.getTime() - 15 * 60 * 1000);
    if (new Date() > deadline) {
      return {
        success: false,
        error: "Los pronósticos para este partido están cerrados (límite de 15 minutos antes del partido).",
      };
    }

    // Verificar si el usuario está habilitado para la fase de este partido en la liga activa
    const cookieStore = await cookies();
    const activeLeagueId = cookieStore.get("active_league_id")?.value;

    let membership = null;
    if (activeLeagueId) {
      membership = await prisma.leagueMembership.findUnique({
        where: {
          userId_leagueId: {
            userId,
            leagueId: activeLeagueId,
          },
        },
      });
    }

    if (!membership) {
      membership = await prisma.leagueMembership.findFirst({
        where: { userId },
      });
    }

    if (membership) {
      let isPhaseActive = true;
      if (match.stage === "GROUPS") {
        isPhaseActive = membership.activePhase1;
      } else if (match.stage === "ROUND_32" || match.stage === "ROUND_16") {
        isPhaseActive = membership.activePhase2;
      } else {
        isPhaseActive = membership.activePhase3;
      }

      if (!isPhaseActive) {
        return {
          success: false,
          error: "No estás habilitado para pronosticar partidos de esta fase en tu liga.",
        };
      }
    }

    // Validar que en fases eliminatorias, si hay empate en goles, se seleccione clasificado
    const isPlayoff = match.stage !== "GROUPS";
    if (isPlayoff && homeScore === awayScore && !predictedWinnerId) {
      return {
        success: false,
        error: "Debés seleccionar al equipo que clasifica en caso de empate.",
      };
    }

    // 2. Upsert de la predicción
    await prisma.prediction.upsert({
      where: {
        userId_matchId: {
          userId,
          matchId,
        },
      },
      update: {
        homeScore,
        awayScore,
        predictedWinnerId: homeScore === awayScore ? predictedWinnerId : null, // Solo guarda clasificado si empatan en goles (regular)
      },
      create: {
        userId,
        matchId,
        homeScore,
        awayScore,
        predictedWinnerId: homeScore === awayScore ? predictedWinnerId : null,
      },
    });

    revalidatePath("/predictions");
    revalidatePath("/dashboard");

    return { success: true, error: null };
  } catch (error: any) {
    console.error("Error al guardar predicción:", error);
    return { success: false, error: "Ocurrió un error inesperado al guardar." };
  }
}

/**
 * Guarda o actualiza las predicciones especiales de largo plazo del usuario (Campeón, Subcampeón, Goleador).
 */
export async function saveBonusPredictions(
  championId: string,
  runnerUpId: string,
  topScorerName: string
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: "Usuario no autenticado." };
    }

    // Bloqueo antes del inicio del primer partido (11 de Junio, 2026 12:00 UTC)
    const firstMatchStart = new Date("2026-06-11T12:00:00Z");
    if (new Date() > firstMatchStart) {
      return {
        success: false,
        error: "Los pronósticos especiales ya están cerrados porque el torneo ha comenzado.",
      };
    }

    if (championId === runnerUpId) {
      return {
        success: false,
        error: "El Campeón y el Subcampeón no pueden ser el mismo equipo.",
      };
    }

    // Upsert
    await prisma.tournamentBonusPrediction.upsert({
      where: { userId },
      update: {
        championId,
        runnerUpId,
        topScorerName: topScorerName.trim(),
      },
      create: {
        userId,
        championId,
        runnerUpId,
        topScorerName: topScorerName.trim(),
      },
    });

    revalidatePath("/predictions");
    revalidatePath("/dashboard");

    return { success: true, error: null };
  } catch (error: any) {
    console.error("Error al guardar predicciones especiales:", error);
    return { success: false, error: "Ocurrió un error al guardar los pronósticos del torneo." };
  }
}
