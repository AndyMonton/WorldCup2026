import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { PredictionsView } from "@/components/predictions-view";
import { MatchStage } from "@prisma/client";
import { cookies } from "next/headers";

// Mock data en caso de que falle la base de datos (Modo Demostración)
const mockTeams = [
  { id: "t1", name: "México", code: "MEX", flagUrl: null, group: "A", createdAt: new Date(), updatedAt: new Date() },
  { id: "t2", name: "Sudáfrica", code: "RSA", flagUrl: null, group: "A", createdAt: new Date(), updatedAt: new Date() },
  { id: "t3", name: "Corea del Sur", code: "KOR", flagUrl: null, group: "A", createdAt: new Date(), updatedAt: new Date() },
  { id: "t4", name: "República Checa", code: "CZE", flagUrl: null, group: "A", createdAt: new Date(), updatedAt: new Date() },
  { id: "t5", name: "Canadá", code: "CAN", flagUrl: null, group: "B", createdAt: new Date(), updatedAt: new Date() },
  { id: "t6", name: "Bosnia y Herzegovina", code: "BIH", flagUrl: null, group: "B", createdAt: new Date(), updatedAt: new Date() },
  { id: "t7", name: "Catar", code: "QAT", flagUrl: null, group: "B", createdAt: new Date(), updatedAt: new Date() },
  { id: "t8", name: "Suiza", code: "SUI", flagUrl: null, group: "B", createdAt: new Date(), updatedAt: new Date() },
  { id: "t9", name: "Brasil", code: "BRA", flagUrl: null, group: "C", createdAt: new Date(), updatedAt: new Date() },
  { id: "t10", name: "Marruecos", code: "MAR", flagUrl: null, group: "C", createdAt: new Date(), updatedAt: new Date() },
  { id: "t11", name: "Haití", code: "HAI", flagUrl: null, group: "C", createdAt: new Date(), updatedAt: new Date() },
  { id: "t12", name: "Escocia", code: "SCO", flagUrl: null, group: "C", createdAt: new Date(), updatedAt: new Date() },
  { id: "t13", name: "Estados Unidos", code: "USA", flagUrl: null, group: "D", createdAt: new Date(), updatedAt: new Date() },
  { id: "t14", name: "Paraguay", code: "PAR", flagUrl: null, group: "D", createdAt: new Date(), updatedAt: new Date() },
  { id: "t15", name: "Australia", code: "AUS", flagUrl: null, group: "D", createdAt: new Date(), updatedAt: new Date() },
  { id: "t16", name: "Turquía", code: "TUR", flagUrl: null, group: "D", createdAt: new Date(), updatedAt: new Date() },
];

const mockMatches = [
  // Fase de grupos - Finalizados (para ver explicaciones de puntaje)
  {
    id: "m-group-1",
    homeTeamId: "t1",
    awayTeamId: "t4",
    homeTeamPlaceholder: null,
    awayTeamPlaceholder: null,
    homeScore: 2, // Goles reales
    awayScore: 1, // Goles reales
    date: new Date("2026-06-11T13:00:00Z"),
    stage: MatchStage.GROUPS,
    group: "A",
    stadium: { name: "Estadio Azteca", city: "Ciudad de México" },
    homeTeam: mockTeams[0],
    awayTeam: mockTeams[3],
    userPrediction: { homeScore: 2, awayScore: 1, predictedWinnerId: null, points: 10, detail: "¡Marcador exacto! (10 pts)" },
  },
  {
    id: "m-group-2",
    homeTeamId: "t2",
    awayTeamId: "t3",
    homeTeamPlaceholder: null,
    awayTeamPlaceholder: null,
    homeScore: 1, // Goles reales
    awayScore: 0, // Goles reales
    date: new Date("2026-06-11T16:00:00Z"),
    stage: MatchStage.GROUPS,
    group: "A",
    stadium: { name: "Mercedes-Benz Stadium", city: "Atlanta" },
    homeTeam: mockTeams[1],
    awayTeam: mockTeams[2],
    userPrediction: { homeScore: 2, awayScore: 0, predictedWinnerId: null, points: 5, detail: "Acierto de tendencia de ganador (5 pts)" },
  },
  // Fase de grupos - Programados (abiertos a pronóstico)
  {
    id: "m-group-3",
    homeTeamId: "t5",
    awayTeamId: "t8",
    homeTeamPlaceholder: null,
    awayTeamPlaceholder: null,
    homeScore: null,
    awayScore: null,
    date: new Date("2026-06-11T19:00:00Z"),
    stage: MatchStage.GROUPS,
    group: "B",
    stadium: { name: "BMO Field", city: "Toronto" },
    homeTeam: mockTeams[4],
    awayTeam: mockTeams[7],
    userPrediction: { homeScore: 1, awayScore: 1, predictedWinnerId: null, points: null, detail: null },
  },
  {
    id: "m-group-4",
    homeTeamId: "t9",
    awayTeamId: "t10",
    homeTeamPlaceholder: null,
    awayTeamPlaceholder: null,
    homeScore: null,
    awayScore: null,
    date: new Date("2026-06-12T13:00:00Z"),
    stage: MatchStage.GROUPS,
    group: "C",
    stadium: { name: "Estadio BBVA", city: "Monterrey" },
    homeTeam: mockTeams[8],
    awayTeam: mockTeams[9],
    userPrediction: null,
  },
  // 16avos (Fase eliminatoria 1)
  {
    id: "m-r32-1",
    homeTeamId: null,
    awayTeamId: null,
    homeTeamPlaceholder: "1° Grupo A",
    awayTeamPlaceholder: "3° Grupo C/D/E/F",
    homeScore: null,
    awayScore: null,
    date: new Date("2026-06-28T14:00:00Z"),
    stage: MatchStage.ROUND_32,
    group: null,
    stadium: { name: "MetLife Stadium", city: "Nueva York" },
    homeTeam: null,
    awayTeam: null,
    userPrediction: { homeScore: 1, awayScore: 1, predictedWinnerId: "t1", points: null, detail: null },
  },
  {
    id: "m-r16-1",
    homeTeamId: null,
    awayTeamId: null,
    homeTeamPlaceholder: "Ganador 16avos #1",
    awayTeamPlaceholder: "Ganador 16avos #2",
    homeScore: null,
    awayScore: null,
    date: new Date("2026-07-02T15:00:00Z"),
    stage: MatchStage.ROUND_16,
    group: null,
    stadium: { name: "SoFi Stadium", city: "Los Angeles" },
    homeTeam: null,
    awayTeam: null,
    userPrediction: null,
  },
  // Fase Final
  {
    id: "m-final-1",
    homeTeamId: null,
    awayTeamId: null,
    homeTeamPlaceholder: "Ganador Semifinal #1",
    awayTeamPlaceholder: "Ganador Semifinal #2",
    homeScore: null,
    awayScore: null,
    date: new Date("2026-07-19T15:00:00Z"),
    stage: MatchStage.FINAL,
    group: null,
    stadium: { name: "MetLife Stadium", city: "Nueva York" },
    homeTeam: null,
    awayTeam: null,
    userPrediction: null,
  },
];

const mockBonus = {
  championId: "t9", // Brasil
  runnerUpId: "t13", // Estados Unidos
  topScorerName: "Lionel Messi",
};

export default async function PredictionsPage() {
  const session = await auth();
  
  let teams: any[] = [];
  let matches: any[] = [];
  let bonusPrediction: any = null;
  let isDemo = false;
  let activePhase1 = true;
  let activePhase2 = false;
  let activePhase3 = false;

  let userStats = {
    name: session?.user?.name || "Alex Smith",
    image: session?.user?.image || null,
    rank: 1240,
    points: 2450,
  };

  try {
    const userId = session?.user?.id;
    if (!userId) {
      throw new Error("No session");
    }

    // Obtener membresía de liga activa (según cookie o primera disponible)
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
        include: { league: true, user: true },
      });
    }

    if (!membership) {
      membership = await prisma.leagueMembership.findFirst({
        where: { userId },
        include: { league: true, user: true },
      });
    }

    if (membership) {
      const isPaymentRequired = membership.league.requiresPayment;
      activePhase1 = !isPaymentRequired || membership.activePhase1;
      activePhase2 = !isPaymentRequired || membership.activePhase2;
      activePhase3 = !isPaymentRequired || membership.activePhase3;

      // Calcular ranking
      const betterPlayers = await prisma.leagueMembership.count({
        where: {
          leagueId: membership.leagueId,
          OR: [
            { points: { gt: membership.points } },
            { points: membership.points, exactCount: { gt: membership.exactCount } },
          ],
        },
      });

      userStats = {
        name: membership.user.name || session?.user?.name || "Alex Smith",
        image: membership.user.image || session?.user?.image || null,
        rank: betterPlayers + 1,
        points: membership.points,
      };
    }

    // 1. Obtener todos los equipos para los selects especiales
    teams = await prisma.team.findMany({
      orderBy: { name: "asc" },
    });

    if (teams.length === 0) {
      throw new Error("No database teams");
    }

    // 2. Obtener partidos con info de estadios y selecciones
    const dbMatches = await prisma.match.findMany({
      include: {
        homeTeam: true,
        awayTeam: true,
        stadium: true,
      },
      orderBy: { date: "asc" },
    });

    // 3. Obtener predicciones del usuario
    const dbPredictions = await prisma.prediction.findMany({
      where: { userId },
    });

    const predMap = new Map(dbPredictions.map((p) => [p.matchId, p]));

    matches = dbMatches.map((m) => {
      const pred = predMap.get(m.id);
      return {
        id: m.id,
        homeTeamId: m.homeTeamId,
        awayTeamId: m.awayTeamId,
        homeTeamPlaceholder: m.homeTeamPlaceholder,
        awayTeamPlaceholder: m.awayTeamPlaceholder,
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        date: m.date,
        stage: m.stage,
        group: m.group,
        stadium: m.stadium,
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        userPrediction: pred
          ? {
              homeScore: pred.homeScore,
              awayScore: pred.awayScore,
              predictedWinnerId: pred.predictedWinnerId,
              points: pred.points,
              detail: pred.detail,
            }
          : null,
      };
    });

    // 4. Obtener predicciones especiales de largo plazo
    bonusPrediction = await prisma.tournamentBonusPrediction.findUnique({
      where: { userId },
    });

  } catch (error) {
    console.warn("Fallo al obtener datos de predicciones de la DB, usando mock data. Error:", error);
    teams = mockTeams;
    matches = mockMatches;
    bonusPrediction = mockBonus;
    isDemo = true;
  }

  return (
    <PredictionsView
      teams={teams}
      matches={matches}
      bonusPrediction={bonusPrediction}
      isDemo={isDemo}
      userStats={userStats}
      activePhase1={activePhase1}
      activePhase2={activePhase2}
      activePhase3={activePhase3}
    />
  );
}
