"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function joinNewLeague(inviteCode: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Debés iniciar sesión." };
    }

    const code = inviteCode.toUpperCase().trim();
    if (!code) {
      return { success: false, error: "El código es requerido." };
    }

    // 1. Buscar la liga
    const league = await prisma.league.findUnique({
      where: { inviteCode: code },
    });

    if (!league) {
      return { success: false, error: "El código de invitación no corresponde a ninguna liga activa." };
    }

    // 2. Verificar si ya es miembro
    const existingMembership = await prisma.leagueMembership.findUnique({
      where: {
        userId_leagueId: {
          userId,
          leagueId: league.id,
        },
      },
    });

    if (existingMembership) {
      return { success: false, error: "Ya pertenecés a esta liga." };
    }

    // 3. Crear membresía (con department PENDIENTE para que elija su sector en esta nueva liga)
    await prisma.leagueMembership.create({
      data: {
        userId,
        leagueId: league.id,
        department: "PENDIENTE",
        role: "MEMBER",
      },
    });

    // 4. Cambiar la liga activa en la cookie
    const cookieStore = await cookies();
    cookieStore.set("active_league_id", league.id, { path: "/" });

    revalidatePath("/dashboard");
    revalidatePath("/ranking");

    return { success: true, error: null };
  } catch (error) {
    console.error("Error al unirse a liga:", error);
    return { success: false, error: "Ocurrió un error inesperado al unirse a la liga." };
  }
}

export async function setActiveLeague(leagueId: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Debés iniciar sesión." };
    }

    const isAdmin = session?.user?.role === "ADMIN";

    if (!isAdmin) {
      // Verificar que pertenezca a la liga
      const membership = await prisma.leagueMembership.findUnique({
        where: {
          userId_leagueId: {
            userId,
            leagueId,
          },
        },
      });

      if (!membership) {
        return { success: false, error: "No pertenecés a esta liga." };
      }
    }

    const cookieStore = await cookies();
    cookieStore.set("active_league_id", leagueId, { path: "/" });

    revalidatePath("/dashboard");
    revalidatePath("/ranking");

    return { success: true, error: null };
  } catch (error) {
    console.error("Error al cambiar liga activa:", error);
    return { success: false, error: "Ocurrió un error inesperado." };
  }
}
