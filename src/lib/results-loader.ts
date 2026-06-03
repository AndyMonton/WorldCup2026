import { prisma } from "@/lib/db";
import { saveMatchResult, recalculateUserLeagueMemberships } from "@/app/actions/admin";
import { MatchStatus } from "@prisma/client";
import { calculateScore } from "./scoring";

// Diccionario de traducción de nombres de equipos de openfootball/FIFA a códigos FIFA de nuestro prode
const TEAM_NAME_TO_CODE: Record<string, string> = {
  // Grupo A
  "Mexico": "MEX", "México": "MEX",
  "South Africa": "RSA", "Sudáfrica": "RSA",
  "South Korea": "KOR", "Corea del Sur": "KOR",
  "Czechia": "CZE", "Czech Republic": "CZE", "República Checa": "CZE",
  // Grupo B
  "Canada": "CAN", "Canadá": "CAN",
  "Bosnia and Herzegovina": "BIH", "Bosnia": "BIH", "Bosnia y Herzegovina": "BIH",
  "Qatar": "QAT", "Catar": "QAT",
  "Switzerland": "SUI", "Suiza": "SUI",
  // Grupo C
  "Brazil": "BRA", "Brasil": "BRA",
  "Morocco": "MAR", "Marruecos": "MAR",
  "Haiti": "HAI", "Haití": "HAI",
  "Scotland": "SCO", "Escocia": "SCO",
  // Grupo D
  "United States": "USA", "Estados Unidos": "USA", "USA": "USA",
  "Paraguay": "PAR",
  "Australia": "AUS",
  "Turkey": "TUR", "Türkiye": "TUR", "Turquía": "TUR",
  // Grupo E
  "Germany": "GER", "Alemania": "GER",
  "Curacao": "CUW", "Curaçao": "CUW", "Curazao": "CUW",
  "Ivory Coast": "CIV", "Côte d'Ivoire": "CIV", "Costa de Marfil": "CIV",
  "Ecuador": "ECU",
  // Grupo F
  "Netherlands": "NED", "Países Bajos": "NED", "Holanda": "NED",
  "Japan": "JPN", "Japón": "JPN",
  "Sweden": "SWE", "Suecia": "SWE",
  "Tunisia": "TUN", "Túnez": "TUN",
  // Grupo G
  "Belgium": "BEL", "Bélgica": "BEL",
  "Egypt": "EGY", "Egipto": "EGY",
  "Iran": "IRN", "Irán": "IRN",
  "New Zealand": "NZL", "Nueva Zelanda": "NZL",
  // Grupo H
  "Spain": "ESP", "España": "ESP",
  "Cape Verde": "CPV", "Cabo Verde": "CPV",
  "Saudi Arabia": "KSA", "Arabia Saudita": "KSA",
  "Uruguay": "URU",
  // Grupo I
  "France": "FRA", "Francia": "FRA",
  "Senegal": "SEN",
  "Iraq": "IRQ", "Irak": "IRQ",
  "Norway": "NOR", "Noruega": "NOR",
  // Grupo J
  "Argentina": "ARG",
  "Algeria": "ALG", "Argelia": "ALG",
  "Austria": "AUT",
  "Jordan": "JOR", "Jordania": "JOR",
  // Grupo K
  "Portugal": "POR",
  "DR Congo": "COD", "RD del Congo": "COD", "Congo DR": "COD",
  "Uzbekistan": "UZB", "Uzbekistán": "UZB",
  "Colombia": "COL",
  // Grupo L
  "England": "ENG", "Inglaterra": "ENG",
  "Croatia": "CRO", "Croacia": "CRO",
  "Ghana": "GHA",
  "Panama": "PAN", "Panamá": "PAN",
};

interface OpenFootballMatch {
  date: string;
  team1: string;
  team2: string;
  score?: {
    ft: [number, number]; // [golesLocal, golesVisita] al final de los 90'
    et?: [number, number]; // goles extra si aplica
    p?: [number, number];  // penales si aplica
  };
}

interface OpenFootballResponse {
  matches?: OpenFootballMatch[];
  rounds?: {
    matches: OpenFootballMatch[];
  }[];
}

/**
 * Plan A: Scraper de la Web de la FIFA.
 * Simulado por el momento para evitar fallos de CORS/certificados y bloqueos de IP en Next.js.
 */
async function fetchFIFAOfficialResults(): Promise<any[]> {
  console.log("[Scraping FIFA] Iniciando consulta simulada a FIFA...");
  // FIFA usualmente carga sus marcadores dinámicamente mediante WebSockets o un API interna de JSON.
  // Un scraper básico de HTML es frágil. En un entorno real se consultaría una ruta de API específica de la FIFA.
  // Para propósitos del proyecto, si falla o no está implementado, lanzamos un error para activar el Plan B.
  throw new Error("El scraper de la FIFA HTML no está disponible o requiere Javascript (Puppeteer). Redirigiendo a Plan B.");
}

/**
 * Plan B: Cargar resultados desde los JSON públicos de OpenFootball en GitHub.
 */
async function fetchOpenFootballResults(): Promise<any[]> {
  console.log("[OpenFootball] Iniciando descarga de fixture y resultados...");
  // URL del repositorio worldcup.json de openfootball
  // https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json
  // Dado que el Mundial 2026 aún no ha sucedido, usaremos un mock o una llamada real.
  const url = "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json";
  
  const response = await fetch(url, {
    method: "GET",
    next: { revalidate: 300 }, // Caché de 5 minutos en Next.js
  });

  if (!response.ok) {
    throw new Error(`Fallo al descargar JSON de OpenFootball. HTTP Status: ${response.status}`);
  }

  const json = (await response.json()) as OpenFootballResponse;
  
  // Aplanar los partidos del JSON (puede venir en rounds o como array plano de matches)
  let matches: OpenFootballMatch[] = [];
  
  if (json.matches) {
    matches = json.matches;
  } else if (json.rounds) {
    json.rounds.forEach((round) => {
      if (round.matches) {
        matches.push(...round.matches);
      }
    });
  }

  console.log(`[OpenFootball] Descargados ${matches.length} partidos. Iniciando procesamiento...`);
  return matches;
}

/**
 * Ejecuta el proceso de actualización automatizada de resultados.
 * Intenta Plan A -> Cae a Plan B en caso de fallo.
 */
export async function runAutomatedResultsUpdate() {
  const summary: { updatedCount: number; matches: string[]; errors: string[] } = {
    updatedCount: 0,
    matches: [],
    errors: [],
  };

  let scrapedMatches: any[] = [];
  let planUsed = "Ninguno";

  // Intentar Plan A: FIFA
  try {
    scrapedMatches = await fetchFIFAOfficialResults();
    planUsed = "Plan A (FIFA Scraping)";
  } catch (errorFIFA: any) {
    console.warn("[Scraper FIFA] Falló Plan A, iniciando Plan B (OpenFootball)... Motivo:", errorFIFA.message);
    
    // Intentar Plan B: OpenFootball
    try {
      scrapedMatches = await fetchOpenFootballResults();
      planUsed = "Plan B (OpenFootball JSON)";
    } catch (errorOF: any) {
      console.error("[Loader Resultados] Fallaron ambos planes automáticos.");
      throw new Error(`Fallo en automatización. FIFA: ${errorFIFA.message}. OpenFootball: ${errorOF.message}`);
    }
  }

  // Si llegamos aquí, tenemos partidos descargados
  console.log(`[Actualizador] Procesando partidos con ${planUsed}...`);

  for (const m of scrapedMatches) {
    // Solo nos interesan partidos que tengan un marcador final
    if (!m.score || !m.score.ft) continue;

    const homeCode = TEAM_NAME_TO_CODE[m.team1];
    const awayCode = TEAM_NAME_TO_CODE[m.team2];

    if (!homeCode || !awayCode) {
      // Ignorar o loguear equipos no reconocidos
      continue;
    }

    try {
      // Buscar el partido en nuestra base de datos que coincida con estos códigos
      const dbMatch = await prisma.match.findFirst({
        where: {
          homeTeam: { code: homeCode },
          awayTeam: { code: awayCode },
          status: { not: MatchStatus.FINISHED }, // Solo actualizar los que no estén ya finalizados
        },
        include: { homeTeam: true, awayTeam: true },
      });

      if (!dbMatch) {
        // El partido no existe en el fixture o ya está finalizado
        continue;
      }

      // Marcadores en 90 min
      const homeScore = m.score.ft[0];
      const awayScore = m.score.ft[1];

      // Prórroga
      let homeScoreExtra = null;
      let awayScoreExtra = null;
      if (m.score.et) {
        homeScoreExtra = m.score.et[0];
        awayScoreExtra = m.score.et[1];
      }

      // Penales
      let homeScorePenalties = null;
      let awayScorePenalties = null;
      if (m.score.p) {
        homeScorePenalties = m.score.p[0];
        awayScorePenalties = m.score.p[1];
      }

      // Clasificado
      let winnerId = null;
      if (dbMatch.stage !== "GROUPS") {
        if (homeScore > awayScore) {
          winnerId = dbMatch.homeTeamId;
        } else if (awayScore > homeScore) {
          winnerId = dbMatch.awayTeamId;
        } else if (homeScoreExtra !== null && awayScoreExtra !== null && homeScoreExtra !== awayScoreExtra) {
          winnerId = homeScoreExtra > awayScoreExtra ? dbMatch.homeTeamId : dbMatch.awayTeamId;
        } else if (homeScorePenalties !== null && awayScorePenalties !== null) {
          winnerId = homeScorePenalties > awayScorePenalties ? dbMatch.homeTeamId : dbMatch.awayTeamId;
        }
      }

      console.log(`[Actualizador] Actualizando: ${dbMatch.homeTeam?.name} vs ${dbMatch.awayTeam?.name} -> Resultado: ${homeScore}-${awayScore}`);

      // Llamar al action de guardar marcador (que internamente recalcula puntos y rankings en una transacción)
      // Como estamos llamando a saveMatchResult desde una tarea del sistema, necesitamos saltar la validación de admin.
      // Escribiremos la lógica directamente usando el prisma client en lugar de llamar a saveMatchResult
      // para evitar el chequeo de "session.user.role === ADMIN" que fallaría en una ruta cron desatendida.
      
      await prisma.$transaction(async (tx) => {
        // Actualizar el partido
        const updatedMatch = await tx.match.update({
          where: { id: dbMatch.id },
          data: {
            homeScore,
            awayScore,
            homeScoreExtra,
            awayScoreExtra,
            homeScorePenalties,
            awayScorePenalties,
            winnerId,
            status: MatchStatus.FINISHED,
          },
        });

        // Recalcular predicciones del partido
        const predictions = await tx.prediction.findMany({
          where: { matchId: dbMatch.id },
        });

        for (const pred of predictions) {
          const scoreBreakdown = calculateScore(
            {
              homeScore: pred.homeScore,
              awayScore: pred.awayScore,
              predictedWinnerId: pred.predictedWinnerId,
            },
            {
              homeScore,
              awayScore,
              winnerId,
              stage: updatedMatch.stage,
            }
          );

          await tx.prediction.update({
            where: { id: pred.id },
            data: {
              points: scoreBreakdown.points,
              detail: scoreBreakdown.detail,
              exactMatch: scoreBreakdown.exactMatch,
              goalDifferenceMatch: scoreBreakdown.goalDifferenceMatch,
              tendencyMatch: scoreBreakdown.tendencyMatch,
              consolationMatch: scoreBreakdown.consolationMatch,
              bonusMatch: scoreBreakdown.bonusMatch,
            },
          });
        }

        // Actualizar caché de puntajes
        const userIds = Array.from(new Set(predictions.map((p) => p.userId)));

        for (const uId of userIds) {
          await recalculateUserLeagueMemberships(tx, uId);
        }

        // Log auditoría de sistema
        const systemAdmin = await tx.user.findFirst({ where: { role: "ADMIN" } });
        await tx.auditLog.create({
          data: {
            userId: systemAdmin?.id || "SYSTEM",
            action: "AUTOMATED_RESULTS_UPDATE",
            details: `Resultados cargados automáticamente vía ${planUsed} para ${dbMatch.homeTeam?.name} vs ${dbMatch.awayTeam?.name}.`,
          },
        });
      });

      summary.updatedCount++;
      summary.matches.push(`${dbMatch.homeTeam?.name} vs ${dbMatch.awayTeam?.name}`);

    } catch (err: any) {
      console.error(`Error al procesar el partido:`, err);
      summary.errors.push(`Error en partido ${m.team1} vs ${m.team2}: ${err.message}`);
    }
  }

  return {
    success: true,
    planUsed,
    ...summary,
  };
}
