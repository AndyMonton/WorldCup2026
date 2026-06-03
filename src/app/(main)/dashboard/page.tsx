import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { MatchStage, MatchStatus } from "@prisma/client";
import { Trophy, CalendarDays, Award, Timer, Sparkles, Building2, User2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { cookies } from "next/headers";

// Datos de demostración en caso de error de base de datos o sin conexión
const mockDashboardData = {
  isDemo: true,
  user: {
    name: "Sergio Fernandez",
    email: "sergio.fernandez@ejemplo.com",
    company: "Macena SA",
    department: "Programación",
  },
  league: {
    name: "Macena SA",
    inviteCode: "MACENA2026",
  },
  stats: {
    points: 20,
    pointsPhase1: 11,
    pointsPhase2: 9,
    pointsPhase3: 0,
    exactCount: 2,
    differenceCount: 1,
    tendencyCount: 1,
    consolationCount: 2,
    position: 4,
    totalPlayers: 48,
    deptPosition: 2,
    deptTotalPlayers: 12,
    department: "Programación",
    internalGroup: "Amigos del Gym",
    groupPosition: 1,
    groupTotalPlayers: 5,
  },
  podium: [
    { name: "Sofía Rodríguez", points: 37, exactCount: 3, position: 1 },
    { name: "Martín Gómez", points: 32, exactCount: 2, position: 2 },
    { name: "Ana Clara Silva", points: 25, exactCount: 2, position: 3 },
  ],
  upcomingMatches: [
    {
      id: "demo-1",
      homeTeam: { name: "México", code: "MEX", flagUrl: null },
      awayTeam: { name: "República Checa", code: "CZE", flagUrl: null },
      date: new Date("2026-06-11T13:00:00Z"),
      stage: MatchStage.GROUPS,
      stadium: { name: "Estadio Azteca", city: "Ciudad de México" },
      prediction: { homeScore: 2, awayScore: 1 },
    },
    {
      id: "demo-2",
      homeTeam: { name: "Canadá", code: "CAN", flagUrl: null },
      awayTeam: { name: "Suiza", code: "SUI", flagUrl: null },
      date: new Date("2026-06-11T16:00:00Z"),
      stage: MatchStage.GROUPS,
      stadium: { name: "BMO Field", city: "Toronto" },
      prediction: { homeScore: 1, awayScore: 1 },
    },
    {
      id: "demo-3",
      homeTeam: { name: "Brasil", code: "BRA", flagUrl: null },
      awayTeam: { name: "Marruecos", code: "MAR", flagUrl: null },
      date: new Date("2026-06-12T13:00:00Z"),
      stage: MatchStage.GROUPS,
      stadium: { name: "Estadio BBVA", city: "Monterrey" },
      prediction: null,
    },
    {
      id: "demo-4",
      homeTeam: { name: "Estados Unidos", code: "USA", flagUrl: null },
      awayTeam: { name: "Australia", code: "AUS", flagUrl: null },
      date: new Date("2026-06-12T16:00:00Z"),
      stage: MatchStage.GROUPS,
      stadium: { name: "AT&T Stadium", city: "Dallas" },
      prediction: null,
    },
  ],
  bonusPredictions: {
    champion: "Argentina",
    runnerUp: "Francia",
    topScorerName: "Kylian Mbappé",
    isCompleted: true,
  },
};

export default async function DashboardPage() {
  const session = await auth();
  
  let data = {
    isDemo: false,
    user: {
      name: session?.user?.name || "Usuario",
      email: session?.user?.email || "",
    },
    league: { name: "", inviteCode: "" },
    stats: {
      points: 0,
      pointsPhase1: 0,
      pointsPhase2: 0,
      pointsPhase3: 0,
      exactCount: 0,
      differenceCount: 0,
      tendencyCount: 0,
      consolationCount: 0,
      position: 1,
      totalPlayers: 1,
      deptPosition: 1,
      deptTotalPlayers: 1,
      department: "",
      internalGroup: null as string | null,
      groupPosition: 1,
      groupTotalPlayers: 1,
    },
    podium: [] as any[],
    upcomingMatches: [] as any[],
    bonusPredictions: {
      champion: null as string | null,
      runnerUp: null as string | null,
      topScorerName: null as string | null,
      isCompleted: false,
    },
  };

  try {
    const userId = session?.user?.id;
    if (!userId) {
      throw new Error("No session");
    }

    // 1. Obtener membresía de liga activa (según cookie)
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

    if (!membership) {
      // Si el usuario no tiene liga (ej. admin recién logueado), usamos demo o vacío
      throw new Error("No league membership");
    }

    data.league = {
      name: membership.league.name,
      inviteCode: membership.league.inviteCode,
    };

    data.stats.department = membership.department;
    data.stats.internalGroup = membership.internalGroup;
    data.stats.points = membership.points;
    data.stats.pointsPhase1 = membership.pointsPhase1;
    data.stats.pointsPhase2 = membership.pointsPhase2;
    data.stats.pointsPhase3 = membership.pointsPhase3;
    data.stats.exactCount = membership.exactCount;
    data.stats.differenceCount = membership.differenceCount;
    data.stats.tendencyCount = membership.tendencyCount;
    data.stats.consolationCount = membership.consolationCount;

    // 2. Cantidad de jugadores que pagaron (rankeados) en la liga (excluyendo administradores)
    const totalPlayers = await prisma.leagueMembership.count({
      where: { 
        leagueId: membership.leagueId,
        hasPaid: true,
        user: { role: { not: "ADMIN" } }
      },
    });
    data.stats.totalPlayers = totalPlayers;

    // 3. Posición general del usuario (solo si ha pagado, excluyendo administradores)
    if (membership.hasPaid) {
      const betterPlayers = await prisma.leagueMembership.count({
        where: {
          leagueId: membership.leagueId,
          hasPaid: true,
          user: { role: { not: "ADMIN" } },
          OR: [
            { points: { gt: membership.points } },
            { points: membership.points, exactCount: { gt: membership.exactCount } },
          ],
        },
      });
      data.stats.position = betterPlayers + 1;
    } else {
      data.stats.position = 0; // Usaremos 0 como indicador de "Sin rankear"
    }

    // 4. Posición sectorial (excluyendo administradores y no pagados)
    const deptTotal = await prisma.leagueMembership.count({
      where: { 
        leagueId: membership.leagueId, 
        department: membership.department,
        hasPaid: true,
        user: { role: { not: "ADMIN" } }
      },
    });
    data.stats.deptTotalPlayers = deptTotal;

    if (membership.hasPaid) {
      const betterDeptPlayers = await prisma.leagueMembership.count({
        where: {
          leagueId: membership.leagueId,
          department: membership.department,
          hasPaid: true,
          user: { role: { not: "ADMIN" } },
          OR: [
            { points: { gt: membership.points } },
            { points: membership.points, exactCount: { gt: membership.exactCount } },
          ],
        },
      });
      data.stats.deptPosition = betterDeptPlayers + 1;
    } else {
      data.stats.deptPosition = 0;
    }

    // 5. Posición grupo interno (si aplica, excluyendo no pagados)
    if (membership.internalGroup) {
      const groupTotal = await prisma.leagueMembership.count({
        where: { 
          leagueId: membership.leagueId, 
          internalGroup: membership.internalGroup,
          hasPaid: true,
          user: { role: { not: "ADMIN" } }
        },
      });
      data.stats.groupTotalPlayers = groupTotal;

      if (membership.hasPaid) {
        const betterGroupPlayers = await prisma.leagueMembership.count({
          where: {
            leagueId: membership.leagueId,
            internalGroup: membership.internalGroup,
            hasPaid: true,
            user: { role: { not: "ADMIN" } },
            OR: [
              { points: { gt: membership.points } },
              { points: membership.points, exactCount: { gt: membership.exactCount } },
            ],
          },
        });
        data.stats.groupPosition = betterGroupPlayers + 1;
      } else {
        data.stats.groupPosition = 0;
      }
    }

    // 6. Obtener el podio de la liga (top 3 que han pagado, excluyendo administradores)
    const podiumMembers = await prisma.leagueMembership.findMany({
      where: { 
        leagueId: membership.leagueId,
        hasPaid: true,
        user: { role: { not: "ADMIN" } }
      },
      orderBy: [
        { points: "desc" },
        { exactCount: "desc" },
      ],
      take: 3,
      include: { user: true },
    });
    
    data.podium = podiumMembers.map((m, index) => ({
      name: m.user.name || m.user.email,
      points: m.points,
      exactCount: m.exactCount,
      position: index + 1,
    }));

    // 7. Próximos partidos (4 partidos)
    const upcomingMatches = await prisma.match.findMany({
      where: { status: MatchStatus.SCHEDULED },
      orderBy: { date: "asc" },
      take: 4,
      include: { homeTeam: true, awayTeam: true, stadium: true },
    });

    // Predicciones del usuario para estos partidos
    const matchIds = upcomingMatches.map((m) => m.id);
    const userPredictions = await prisma.prediction.findMany({
      where: { userId, matchId: { in: matchIds } },
    });

    const predMap = new Map(userPredictions.map((p) => [p.matchId, p]));

    data.upcomingMatches = upcomingMatches.map((m) => {
      const pred = predMap.get(m.id);
      return {
        id: m.id,
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        date: m.date,
        stage: m.stage,
        stadium: m.stadium,
        prediction: pred ? { homeScore: pred.homeScore, awayScore: pred.awayScore } : null,
      };
    });

    // 8. Predicciones bonus del torneo
    const bonus = await prisma.tournamentBonusPrediction.findUnique({
      where: { userId },
      include: { champion: true, runnerUp: true },
    });

    if (bonus) {
      data.bonusPredictions = {
        champion: bonus.champion?.name || null,
        runnerUp: bonus.runnerUp?.name || null,
        topScorerName: bonus.topScorerName,
        isCompleted: !!(bonus.championId && bonus.runnerUpId && bonus.topScorerName),
      };
    }

  } catch (error) {
    // Si falla (por falta de tablas, conexión, etc.), cargamos datos demo para wow factor
    console.warn("Fallo al obtener datos reales del dashboard, usando datos mock. Error:", error);
    data = { ...mockDashboardData, isDemo: true };
    if (session?.user) {
      data.user.name = session.user.name || session.user.email || "Usuario";
    }
  }

  // Verificar si el primer partido ya comenzó para bloquear predicciones del torneo
  // 11 de Junio, 2026 12:00 UTC (o según el fixture real)
  const firstMatchStart = new Date("2026-06-11T12:00:00Z");
  const tournamentStarted = new Date() > firstMatchStart;

  // Obtener partido destacado (primer partido programado, o un mock si no hay)
  const nextMatch = data.upcomingMatches[0] || {
    id: "featured-mock",
    homeTeam: { name: "Argentina", code: "ARG" },
    awayTeam: { name: "Alemania", code: "GER" },
    date: new Date("2026-06-11T12:00:00Z"),
    stadium: { name: "Estadio Azteca" },
  };

  const formattedMatchTime = nextMatch.date.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC"
  }) + " hs";

  const getFlagUrl = (code: string | null | undefined) => {
    if (!code) return "/images/placeholder-flag.png";
    const manualMapping: Record<string, string> = {
      MEX: "mx", RSA: "za", KOR: "kr", CZE: "cz",
      CAN: "ca", BIH: "ba", QAT: "qa", SUI: "ch",
      USA: "us", AUS: "au", BRA: "br", MAR: "ma",
      ARG: "ar", GER: "de", ESP: "es", FRA: "fr",
    };
    const lowerCode = manualMapping[code.toUpperCase()];
    if (lowerCode) {
      return `https://flagcdn.com/w160/${lowerCode}.png`;
    }
    return `https://flagcdn.com/w160/${code.toLowerCase().substring(0, 2)}.png`;
  };

  // Calcular porcentaje de standing del usuario
  const totalPlayersCount = Math.max(1, data.stats.totalPlayers);
  const positionIndex = data.stats.position;
  const hasPaid = positionIndex > 0;

  // porcentaje para la barra de progreso (cuanto menor sea la posición/puesto, mayor es la barra)
  const scorePercent = hasPaid 
    ? Math.max(5, Math.min(95, 100 - ((positionIndex - 1) / totalPlayersCount) * 100))
    : 0;
  const topPercent = hasPaid 
    ? Math.max(1, Math.round((positionIndex / totalPlayersCount) * 100))
    : 0;

  return (
    <div className="space-y-8">
      {/* Banner de Modo Demostración */}
      {data.isDemo && (
        <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <span className="font-bold">Modo Demostración Activo:</span> La base de datos no está conectada o no tiene las tablas inicializadas. Se están mostrando datos simulados para evaluar la interfaz.
          </div>
        </div>
      )}

      {/* --- BANNER DE BIENVENIDA (ESTADIO) --- */}
      <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-border/40 min-h-[340px] flex items-center p-8 md:p-12 lg:p-16 bg-slate-950">
        {/* Imagen de fondo */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/stadium_banner.png"
            alt="Stadium Banner"
            className="w-full h-full object-cover object-center opacity-60"
          />
          {/* Degradado oscuro para integrar el fondo */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/50 to-transparent"></div>
        </div>

        {/* Contenido sobre el banner */}
        <div className="relative z-10 max-w-2xl space-y-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-bold uppercase tracking-widest">
            Mundial 2026
          </span>
          
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-100 leading-tight">
            Bienvenido al Prode Mundial <span className="text-gradient">2026</span>
          </h1>
          
          <p className="text-sm md:text-base text-slate-300 font-medium leading-relaxed">
            Siente la emoción de cada gol. Compite con amigos y fans de todo el mundo en el simulador de predicciones más prestigioso del torneo.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <Link
              href="/predictions"
              className="px-6 py-3 btn-premium flex items-center gap-2"
            >
              <CalendarDays className="w-4 h-4" />
              Hacer Pronósticos
            </Link>
            <Link
              href="/ranking"
              className="px-6 py-3 btn-premium-secondary flex items-center gap-2"
            >
              <Trophy className="w-4 h-4 text-gold" />
              Ver Posiciones
            </Link>
          </div>
        </div>
      </div>

      {/* --- SECCIÓN 2: ESTADÍSTICAS Y PARTIDO DESTACADO --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Tu Puntuación */}
        <div className="glass-panel p-6 rounded-2xl border border-border shadow-lg flex flex-col justify-between relative overflow-hidden bg-slate-900/10">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tu Puntuación</p>
              <h3 className="text-4xl font-extrabold mt-2 text-primary">{data.stats.points.toLocaleString("es-ES")} pts</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold shadow-inner border border-gold/20">
              <Trophy className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-6 border-t border-border/20 pt-4 space-y-4">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">Rango Global</span>
              <span className="font-bold text-foreground">
                {hasPaid ? (
                  `#${positionIndex.toLocaleString("es-ES")} de ${totalPlayersCount.toLocaleString("es-ES")}`
                ) : (
                  <span className="text-amber-500 font-semibold text-[11px]">Sin rankear (pago pendiente)</span>
                )}
              </span>
            </div>

            {/* Barra de progreso */}
            <div className="space-y-1.5">
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-border/10">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${scorePercent}%` }}
                ></div>
              </div>
              <p className="text-[10px] text-slate-400 font-bold leading-normal">
                {hasPaid ? (
                  topPercent <= 5 ? "¡Estás en el top 5%! Sigue así." : `Estás en el top ${topPercent}% de la liga.`
                ) : (
                  "Aboná tu inscripción para figurar en la tabla de posiciones y ranking."
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Partido Destacado */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-border shadow-lg flex flex-col justify-between relative bg-slate-900/10">
          {/* Badge superior derecho */}
          <span className="absolute top-4 right-4 text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase border bg-gold/10 text-gold border-gold/25 tracking-wider">
            Partido Destacado
          </span>

          <div className="flex-1 grid grid-cols-7 gap-2 items-center py-2 mt-2">
            {/* Local */}
            <div className="col-span-2 text-center flex flex-col items-center gap-2 min-w-0">
              <img
                src={getFlagUrl(nextMatch.homeTeam?.code)}
                alt=""
                className="w-16 h-10 md:w-20 md:h-12 object-cover rounded-lg shadow-md border border-border"
              />
              <span className="text-sm font-extrabold truncate max-w-full text-foreground uppercase tracking-wide">
                {nextMatch.homeTeam?.name || "Local"}
              </span>
            </div>

            {/* Centro Info */}
            <div className="col-span-3 text-center flex flex-col items-center justify-center">
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mb-1.5">vs</div>
              <span className="text-xl md:text-2xl font-black px-4 py-2 bg-slate-950 border border-border rounded-xl text-foreground tracking-wider leading-none shadow-md">
                {formattedMatchTime}
              </span>
              <span className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase mt-2 max-w-[160px] truncate" title={nextMatch.stadium.name}>
                {nextMatch.stadium.name.toUpperCase()}
              </span>
            </div>

            {/* Visitante */}
            <div className="col-span-2 text-center flex flex-col items-center gap-2 min-w-0">
              <img
                src={getFlagUrl(nextMatch.awayTeam?.code)}
                alt=""
                className="w-16 h-10 md:w-20 md:h-12 object-cover rounded-lg shadow-md border border-border"
              />
              <span className="text-sm font-extrabold truncate max-w-full text-foreground uppercase tracking-wide">
                {nextMatch.awayTeam?.name || "Visitante"}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border/20 flex justify-center">
            <Link
              href="/predictions"
              className="px-6 py-3 btn-premium flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Pronosticar Ahora
            </Link>
          </div>
        </div>
      </div>

      {/* --- SECCIÓN 3: NOTICIAS, ACTIVIDAD Y PODIO --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Lado Izquierdo: Noticias y Podio */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Últimas Noticias */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black tracking-tight text-slate-100 uppercase flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Últimas Noticias
              </h3>
              <a href="#" className="text-xs font-bold text-slate-400 hover:text-foreground flex items-center gap-1">
                Ver todo <span className="text-primary">→</span>
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Noticia 1 */}
              <div className="glass-panel rounded-2xl overflow-hidden border border-border shadow-md hover:border-slate-800 transition-all flex flex-col justify-between bg-slate-900/5">
                <div>
                  <img
                    src="/images/news_trophy.png"
                    alt=""
                    className="w-full h-40 object-cover border-b border-border/25"
                  />
                  <div className="p-4 space-y-2">
                    <span className="text-[9px] font-black text-primary uppercase tracking-widest">
                      Torneo
                    </span>
                    <h4 className="font-extrabold text-sm text-slate-200 line-clamp-2 leading-snug">
                      Sorteo de grupos definido para la fase final
                    </h4>
                    <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                      Los equipos ya conocen sus caminos hacia la final en un sorteo histórico con cruces apasionantes.
                    </p>
                  </div>
                </div>
                <div className="p-4 pt-0 text-[10px] text-slate-500 font-semibold">
                  Hace 2 horas
                </div>
              </div>

              {/* Noticia 2 */}
              <div className="glass-panel rounded-2xl overflow-hidden border border-border shadow-md hover:border-slate-800 transition-all flex flex-col justify-between bg-slate-900/5">
                <div>
                  <img
                    src="/images/news_ball.png"
                    alt=""
                    className="w-full h-40 object-cover border-b border-border/25"
                  />
                  <div className="p-4 space-y-2">
                    <span className="text-[9px] font-black text-primary uppercase tracking-widest">
                      Jugadores
                    </span>
                    <h4 className="font-extrabold text-sm text-slate-200 line-clamp-2 leading-snug">
                      Las figuras que podrían perderse la gran cita
                    </h4>
                    <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                      Repasamos la lista de lesionados y dudas para el partido inaugural que mantiene en vilo a las selecciones.
                    </p>
                  </div>
                </div>
                <div className="p-4 pt-0 text-[10px] text-slate-500 font-semibold">
                  Hace 4 horas
                </div>
              </div>
            </div>
          </div>

          {/* Podio de la Liga */}
          <div className="glass-panel rounded-2xl p-6 border border-border shadow-lg bg-slate-900/10">
            <div className="flex items-center gap-2 mb-6">
              <Trophy className="w-5 h-5 text-gold" />
              <h4 className="font-bold text-lg">Podio de la Liga</h4>
            </div>

            {/* Visual Podio */}
            <div className="space-y-4">
              {data.podium.map((player) => (
                <div
                  key={player.position}
                  className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${
                    player.position === 1
                      ? "bg-gold/5 border-gold/20"
                      : player.position === 2
                      ? "bg-slate-500/5 border-slate-500/20"
                      : "bg-amber-700/5 border-amber-700/20"
                  }`}
                >
                  {/* Posición Medalla */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-md ${
                      player.position === 1
                        ? "bg-gold text-slate-900"
                        : player.position === 2
                        ? "bg-slate-400 text-slate-900"
                        : "bg-amber-700 text-white"
                    }`}
                  >
                    {player.position}
                  </div>

                  {/* Nombre y Puntos */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{player.name}</p>
                    <p className="text-xs text-slate-400">{player.exactCount} exactos</p>
                  </div>
                  
                  <div className="text-right">
                    <span className="font-extrabold text-base text-foreground">{player.points}</span>
                    <span className="text-xs text-slate-400 ml-1">pts</span>
                  </div>
                </div>
              ))}

              {data.podium.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-sm">
                  Ningún jugador registrado en esta liga aún.
                </div>
              )}
            </div>

            <div className="mt-6 border-t border-border pt-4 text-center">
              <Link href="/ranking" className="text-sm font-bold text-primary hover:underline">
                Ver Clasificación Completa
              </Link>
            </div>
          </div>
        </div>

        {/* Lado Derecho: Actividad y Especiales */}
        <div className="lg:col-span-1 space-y-8">
          
          {/* Actividad */}
          <div className="glass-panel rounded-2xl p-6 border border-border shadow-lg flex flex-col bg-slate-900/10">
            <h4 className="font-bold text-lg mb-6 uppercase tracking-wider text-slate-200 border-b border-border/20 pb-2">
              Actividad
            </h4>

            <div className="space-y-4">
              {/* Item 1 */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950 border border-border/40 hover:border-slate-800 transition-all">
                <div className="w-8 h-8 rounded-full bg-slate-850 border border-border flex items-center justify-center text-xs font-bold text-slate-300">
                  M
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-300 leading-normal">
                    <span className="font-bold text-foreground">Mateo</span> acertó el resultado exacto de <span className="font-bold text-primary">BRA vs ESP</span>
                  </p>
                  <p className="text-[10px] text-slate-500 font-semibold mt-1">
                    +100 pts &bull; Hace 5 min
                  </p>
                </div>
              </div>

              {/* Item 2 */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950 border border-border/40 hover:border-slate-800 transition-all">
                <div className="w-8 h-8 rounded-full bg-slate-850 border border-border flex items-center justify-center text-xs font-bold text-slate-300">
                  L
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-300 leading-normal">
                    <span className="font-bold text-foreground">Lucía</span> subió 45 puestos en el ranking global
                  </p>
                  <p className="text-[10px] text-slate-500 font-semibold mt-1">
                    Hace 12 min
                  </p>
                </div>
              </div>

              {/* Item 3 */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950 border border-border/40 hover:border-slate-800 transition-all">
                <div className="w-8 h-8 rounded-full bg-slate-850 border border-border flex items-center justify-center text-xs font-bold text-slate-300">
                  ⚽
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-300 leading-normal">
                    Nueva liga privada creada: <span className="font-bold text-gold">"Amigos del Fútbol"</span>
                  </p>
                  <p className="text-[10px] text-slate-500 font-semibold mt-1">
                    Hace 25 min
                  </p>
                </div>
              </div>

              {/* Item 4 */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950 border border-border/40 hover:border-slate-800 transition-all">
                <div className="w-8 h-8 rounded-full bg-slate-850 border border-border flex items-center justify-center text-xs font-bold text-slate-300">
                  S
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-300 leading-normal">
                    <span className="font-bold text-foreground">Sergio</span> actualizó su pronóstico para el partido inaugural
                  </p>
                  <p className="text-[10px] text-slate-500 font-semibold mt-1">
                    Hace 40 min
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Pronósticos Especiales */}
          <div className="glass-panel rounded-2xl p-6 border border-border shadow-lg relative overflow-hidden bg-slate-900/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-gold" />
                <h4 className="font-bold text-base">Pronósticos Especiales</h4>
              </div>
              
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                data.bonusPredictions.isCompleted
                  ? "bg-primary/10 text-primary"
                  : "bg-red-500/10 text-red-400 animate-pulse"
              }`}>
                {data.bonusPredictions.isCompleted ? "Completo" : "Pendiente"}
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Pronosticá el Campeón, Subcampeón y Goleador del torneo antes del silbatazo inicial (11 Jun 2026). ¡Suman hasta 50 puntos extra!
            </p>

            <div className="space-y-3 bg-slate-900/40 p-4 rounded-xl border border-border/40 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-slate-400">Campeón:</span>
                <span className="font-semibold text-foreground">{data.bonusPredictions.champion || "Sin definir"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Subcampeón:</span>
                <span className="font-semibold text-foreground">{data.bonusPredictions.runnerUp || "Sin definir"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Goleador:</span>
                <span className="font-semibold text-foreground">{data.bonusPredictions.topScorerName || "Sin definir"}</span>
              </div>
            </div>

            <Link
              href="/predictions?tab=bonus"
              className="w-full flex items-center justify-center py-2.5 bg-slate-800 hover:bg-slate-700 text-foreground font-semibold rounded-xl text-xs transition-all border border-border"
            >
              Completar Especiales
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
