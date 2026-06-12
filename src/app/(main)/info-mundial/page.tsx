import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { InfoMundialView } from "@/components/info-mundial-view";
import { prisma } from "@/lib/db";
import { MatchStatus } from "@prisma/client";

export default async function InfoMundialPage() {
  const session = await auth();
  if (!session || !session.user) {
    redirect("/login");
  }

  // 1. Obtener partidos jugados (finalizados) en orden cronológico
  const finishedMatches = await prisma.match.findMany({
    where: {
      status: MatchStatus.FINISHED,
    },
    include: {
      homeTeam: true,
      awayTeam: true,
    },
    orderBy: {
      date: "asc",
    },
  });

  // 2. Obtener lista de goleadores ordenada por goles desc, luego alfabéticamente asc
  const scorers = await prisma.scorer.findMany({
    include: {
      team: true,
    },
    orderBy: [
      { goals: "desc" },
      { name: "asc" },
    ],
  });

  // Serializar campos Date a string para prevenir advertencias de hidratación en Next.js
  const serializedMatches = finishedMatches.map((m) => ({
    ...m,
    date: m.date.toISOString(),
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
  }));

  return <InfoMundialView finishedMatches={serializedMatches} scorers={scorers} />;
}
