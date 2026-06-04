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
  const activeLeagueId = cookieStore.get("active_league_id")?.value;

  if (!activeLeagueId) {
    redirect("/dashboard");
  }

  // Verificar si es administrador global o si es colaborador de la liga activa
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

  const isCollaborator = membership?.role === "COLLABORATOR";

  if (!isGlobalAdmin && !isCollaborator) {
    // Si no es admin global ni es colaborador de esta liga, no tiene permisos
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

  const leagueName = membership?.league.name || "Mi Liga";

  return (
    <CollaboratorView
      leagueId={activeLeagueId}
      leagueName={leagueName}
      initialMembers={memberships}
    />
  );
}
