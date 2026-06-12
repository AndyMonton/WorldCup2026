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

  // Verificar si es administrador global o si es colaborador/admin/owner de la liga activa
  const isGlobalAdmin = session.user.role === "ADMIN";

  if (!activeLeagueId) {
    if (isGlobalAdmin) {
      const firstLeague = await prisma.league.findFirst();
      activeLeagueId = firstLeague?.id;
    } else {
      // Buscar la primera membresía del usuario como fallback
      const fallbackMembership = await prisma.leagueMembership.findFirst({
        where: { userId },
      });
      activeLeagueId = fallbackMembership?.leagueId;
    }
  }

  if (!activeLeagueId) {
    redirect("/dashboard");
  }

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

  // Si tiene permisos, obtener todos los miembros de la liga activa (excluyendo administradores globales)
  const memberships = await prisma.leagueMembership.findMany({
    where: {
      leagueId: activeLeagueId,
      user: {
        role: {
          not: "ADMIN",
        },
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
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

  let leagueName = "Mi Liga";
  let requiresPayment = true;
  if (membership) {
    leagueName = membership.league.name;
    requiresPayment = membership.league.requiresPayment;
  } else if (isGlobalAdmin) {
    const league = await prisma.league.findUnique({
      where: { id: activeLeagueId },
    });
    leagueName = league?.name || "Mi Liga";
    requiresPayment = league?.requiresPayment ?? true;
  }

  // Formatear miembros para evitar problemas de serialización de Date
  const formattedMembers = memberships.map((m) => ({
    id: m.id,
    userId: m.userId,
    department: m.department,
    hasPaid: m.hasPaid,
    role: m.role,
    activePhase1: m.activePhase1,
    activePhase2: m.activePhase2,
    activePhase3: m.activePhase3,
    user: {
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
      image: m.user.image,
    },
  }));

  return (
    <CollaboratorView
      leagueId={activeLeagueId}
      leagueName={leagueName}
      initialMembers={formattedMembers as any}
      phase1Finished={phase1Finished}
      phase2Finished={phase2Finished}
      requiresPayment={requiresPayment}
    />
  );
}
