import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { CollaboratorView } from "@/components/collaborator-view";

export default async function CollaboratorPage() {
  const session = await auth();
  if (!session || !session.user) {
    redirect("/login");
  }

  const userId = session.user.id;

  // Obtener liga activa desde cookies
  const cookieStore = await cookies();
  let activeLeagueId = cookieStore.get("active_league_id")?.value;

  if (!activeLeagueId) {
    // Buscar la primera membresía del usuario como fallback
    const fallbackMembership = await prisma.leagueMembership.findFirst({
      where: { userId },
    });
    activeLeagueId = fallbackMembership?.leagueId;
  }

  if (!activeLeagueId) {
    redirect("/dashboard");
  }

  // Verificar si es administrador global o si es colaborador/admin/owner de la liga activa
  const isGlobalAdmin = session.user.role === "ADMIN";

  const membership = await prisma.leagueMembership.findUnique({
    where: {
      userId_leagueId: {
        userId,
        leagueId: activeLeagueId,
      },
    },
    include: {
      league: true,
    },
  });

  const isCollaborator =
    membership?.role === "COLLABORATOR" ||
    membership?.role === "ADMIN" ||
    membership?.role === "OWNER";

  if (!isGlobalAdmin && !isCollaborator) {
    // Si no es admin global ni tiene rol de gestión de esta liga, no tiene permisos
    redirect("/dashboard");
  }

  // Si tiene permisos, obtener todos los miembros de la liga activa
  const memberships = await prisma.leagueMembership.findMany({
    where: {
      leagueId: activeLeagueId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      user: {
        name: "asc",
      },
    },
  });

  // Obtener partidos para calcular finalización de fases
  const matches = await prisma.match.findMany({
    select: { stage: true, status: true, homeScore: true },
  });

  const phase1Finished = matches.filter(m => m.stage === "GROUPS").length > 0 && 
    matches.filter(m => m.stage === "GROUPS").every(m => m.status === "FINISHED" || m.homeScore !== null);

  const phase2Finished = matches.filter(m => m.stage === "ROUND_32" || m.stage === "ROUND_16").length > 0 && 
    matches.filter(m => m.stage === "ROUND_32" || m.stage === "ROUND_16").every(m => m.status === "FINISHED" || m.homeScore !== null);

  const leagueName = membership?.league.name || "Mi Liga";

  return (
    <CollaboratorView
      leagueId={activeLeagueId}
      leagueName={leagueName}
      initialMembers={memberships}
      phase1Finished={phase1Finished}
      phase2Finished={phase2Finished}
    />
  );
}
