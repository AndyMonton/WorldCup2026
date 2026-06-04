import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { RankingView } from "@/components/ranking-view";
import { cookies } from "next/headers";


export default async function RankingPage() {
  const session = await auth();
  
  let members: any[] = [];
  let currentUserId: string | undefined = undefined;
  let isDemo = false;

  try {
    const userId = session?.user?.id;
    if (!userId) {
      throw new Error("No session");
    }
    currentUserId = userId;

    // 1. Obtener la membresía del usuario según liga activa (cookies)
    const cookieStore = await cookies();
    const activeLeagueId = cookieStore.get("active_league_id")?.value;

    let userMembership = null;
    if (activeLeagueId) {
      userMembership = await prisma.leagueMembership.findUnique({
        where: {
          userId_leagueId: {
            userId,
            leagueId: activeLeagueId,
          },
        },
      });
    }

    if (!userMembership) {
      userMembership = await prisma.leagueMembership.findFirst({
        where: { userId },
      });
    }

    if (!userMembership) {
      throw new Error("No league membership");
    }

    // 2. Obtener todas las membresías de esa liga (excluyendo administradores globales)
    const dbMemberships = await prisma.leagueMembership.findMany({
      where: {
        leagueId: userMembership.leagueId,
        user: { role: { not: "ADMIN" } }
      },
      include: {
        user: true,
        league: true,
      },
    });

    const activeLeague = dbMemberships[0]?.league || null;
    const transferAmount = activeLeague?.transferAmount || null;

    members = dbMemberships.map((m) => ({
      id: m.userId,
      name: m.user.name || m.user.email,
      image: m.user.image,
      department: m.department,
      internalGroup: m.internalGroup,
      points: m.points,
      pointsPhase1: m.pointsPhase1,
      pointsPhase2: m.pointsPhase2,
      pointsPhase3: m.pointsPhase3,
      exactCount: m.exactCount,
      differenceCount: m.differenceCount,
      tendencyCount: m.tendencyCount,
      consolationCount: m.consolationCount,
      activePhase1: m.activePhase1,
      activePhase2: m.activePhase2,
      activePhase3: m.activePhase3,
    }));

    // 3. Determinar fase activa del torneo
    const matches = await prisma.match.findMany({
      select: { stage: true, status: true, homeScore: true },
    });

    const phase1Matches = matches.filter(m => m.stage === "GROUPS");
    const phase1Finished = phase1Matches.length > 0 && phase1Matches.every(m => m.status === "FINISHED" || m.homeScore !== null);

    const phase2Matches = matches.filter(m => m.stage === "ROUND_32" || m.stage === "ROUND_16");
    const phase2Finished = phase2Matches.length > 0 && phase2Matches.every(m => m.status === "FINISHED" || m.homeScore !== null);

    let currentTournamentPhase: 1 | 2 | 3 = 1;
    if (phase1Finished) {
      currentTournamentPhase = phase2Finished ? 3 : 2;
    }

    return (
      <RankingView
        members={members}
        currentUserId={currentUserId}
        isDemo={false}
        transferAmount={transferAmount}
        currentTournamentPhase={currentTournamentPhase}
      />
    );

  } catch (error) {
    console.error("Fallo al obtener datos del ranking de la DB:", error);
  }

  return (
    <RankingView
      members={members}
      currentUserId={currentUserId}
      isDemo={isDemo}
      transferAmount={null}
      currentTournamentPhase={1}
    />
  );
}
