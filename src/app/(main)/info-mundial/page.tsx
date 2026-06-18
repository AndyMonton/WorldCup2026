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

  // 1. Obtener todos los partidos en orden cronológico, incluyendo la predicción del usuario actual
  const matches = await prisma.match.findMany({
    include: {
      homeTeam: true,
      awayTeam: true,
      predictions: {
        where: {
          userId: session.user.id,
        },
      },
    },
    orderBy: {
      date: "asc",
    },
  });

  // 2. Obtener lista de todos los equipos ordenados alfabéticamente
  const teams = await prisma.team.findMany({
    orderBy: {
      name: "asc",
    },
  });

  // 3. Obtener lista de goleadores ordenada por goles desc, luego alfabéticamente asc
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
  const serializedMatches = matches.map((m) => {
    const pred = m.predictions?.[0] || null;
    return {
      ...m,
      date: m.date.toISOString(),
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
      userPrediction: pred
        ? {
            ...pred,
            createdAt: pred.createdAt.toISOString(),
            updatedAt: pred.updatedAt.toISOString(),
          }
        : null,
      predictions: undefined, // Remover array de predicciones crudo
    };
  });

  return <InfoMundialView matches={serializedMatches} teams={teams} scorers={scorers} />;
}


