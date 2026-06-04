import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { AppLayout } from "@/components/layout/app-layout";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session || !session.user) {
    redirect("/login");
  }

  const userId = session.user.id;

  // Obtener liga activa desde cookies
  const cookieStore = await cookies();
  const activeLeagueId = cookieStore.get("active_league_id")?.value;

  // Buscar todas las membresías del usuario
  const memberships = await prisma.leagueMembership.findMany({
    where: { userId },
    include: { league: true },
  });

  if (memberships.length === 0) {
    // Si el usuario no tiene membresía (ej. admin puro), lo dejamos pasar con lista vacía
    return <AppLayout memberships={[]}>{children}</AppLayout>;
  }

  // Encontrar la membresía de la liga activa en la sesión
  let activeMembership = memberships.find((m) => m.leagueId === activeLeagueId);
  if (!activeMembership) {
    activeMembership = memberships[0];
  }

  // Si tiene membresía pero el sector está pendiente, le obligamos a seleccionarlo primero
  if (activeMembership && activeMembership.department === "PENDIENTE") {
    redirect("/select-sector");
  }

  // Formatear ligas para pasarlas al layout
  const formattedMemberships = memberships.map((m) => ({
    leagueId: m.leagueId,
    leagueName: m.league.name,
    isActive: m.leagueId === activeMembership.leagueId,
    department: m.department,
    role: m.role,
  }));

  return <AppLayout memberships={formattedMemberships}>{children}</AppLayout>;
}
