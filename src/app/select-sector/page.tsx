import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getSectorsForLeague } from "@/lib/sectors";
import { SelectSectorForm } from "@/components/auth/select-sector-form";
import { redirect } from "next/navigation";

export default async function SelectSectorPage() {
  const session = await auth();
  if (!session || !session.user) {
    redirect("/login");
  }

  const userId = session.user.id;
  const membership = await prisma.leagueMembership.findFirst({
    where: { userId },
    include: { league: true },
  });

  if (!membership) {
    redirect("/login");
  }

  // Si ya tiene un sector configurado, no hace falta que esté acá
  if (membership.department !== "PENDIENTE") {
    redirect("/dashboard");
  }

  let sectors: string[] = [];
  if (membership.league.departments) {
    try {
      sectors = JSON.parse(membership.league.departments);
    } catch (e) {
      sectors = getSectorsForLeague(membership.league.inviteCode);
    }
  } else {
    sectors = getSectorsForLeague(membership.league.inviteCode);
  }

  return (
    <SelectSectorForm
      sectors={sectors}
      leagueName={membership.league.name}
    />
  );
}
