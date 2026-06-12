import { prisma } from "@/lib/db";
import { recalculateUserLeagueMemberships, recalculateGoalscorers } from "@/app/actions/admin";
import { MatchStatus, MatchStage, Role } from "@prisma/client";
import { calculateScore } from "./scoring";
import https from "https";

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
  "DR Congo": "COD", "RD del Congo": "COD", "Congo DR": "COD", "Democratic Republic of the Congo": "COD",
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
 * Realiza una petición HTTPS ignorando errores de certificados SSL auto-firmados o de revocación.
 */
function fetchJsonHttps(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const options = {
      rejectUnauthorized: false, // Ignorar errores de certificado y revocación
    };
    https.get(url, options, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Fallo HTTP Status: ${res.statusCode}`));
        return;
      }
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on("error", (err) => {
      reject(err);
    });
  });
}

/**
 * Ejecuta el proceso de actualización automatizada de resultados.
 * Consulta el API real en https://worldcup26.ir/get/games.
 */
export async function runAutomatedResultsUpdate() {
  const summary: { updatedCount: number; matches: string[]; errors: string[] } = {
    updatedCount: 0,
    matches: [],
    errors: [],
  };

  let scrapedMatches: any[] = [];
  const planUsed = "API Real (worldcup26.ir)";

  try {
    console.log("[Actualizador] Consultando partidos finalizados desde la API real...");
    const url = "https://worldcup26.ir/get/games";
    const json = await fetchJsonHttps(url);
    scrapedMatches = json.games || [];
    console.log(`[Actualizador] Descargados ${scrapedMatches.length} partidos.`);
  } catch (error: any) {
    console.error("[Loader Resultados] Falló la descarga de partidos de la API:", error.message);
    throw new Error(`Fallo en automatización. API error: ${error.message}`);
  }

  for (const m of scrapedMatches) {
    // Solo procesar si el partido ha finalizado según la API
    const isFinished = m.finished === "TRUE" || m.finished === true || m.time_elapsed === "finished";
    if (!isFinished) continue;

    const homeCode = TEAM_NAME_TO_CODE[m.home_team_name_en];
    const awayCode = TEAM_NAME_TO_CODE[m.away_team_name_en];

    if (!homeCode || !awayCode) {
      continue; // Ignorar si no mapea o si son placeholders en playoffs
    }

    try {
      // Buscar el partido en nuestra base de datos que coincida con estos códigos y no esté marcado como FINISHED
      const dbMatch = await prisma.match.findFirst({
        where: {
          homeTeam: { code: homeCode },
          awayTeam: { code: awayCode },
          status: { not: MatchStatus.FINISHED },
        },
        include: { homeTeam: true, awayTeam: true },
      });

      if (!dbMatch) {
        continue; // El partido no existe en el fixture o ya está finalizado
      }

      const homeScore = parseInt(m.home_score);
      const awayScore = parseInt(m.away_score);
      
      const homeScorers = m.home_scorers === "null" || !m.home_scorers ? null : m.home_scorers;
      const awayScorers = m.away_scorers === "null" || !m.away_scorers ? null : m.away_scorers;

      // Ganador en eliminatorias directas (playoffs)
      let winnerId = null;
      if (dbMatch.stage !== MatchStage.GROUPS) {
        if (homeScore > awayScore) {
          winnerId = dbMatch.homeTeamId;
        } else if (awayScore > homeScore) {
          winnerId = dbMatch.awayTeamId;
        }
        // Nota: en caso de empate en playoffs, el API informará la resolución
        // (por ejemplo sumando goles en el global o mostrando la definición).
        // Si sigue empatado y no se determina por goles ordinarios, winnerId quedará como null
        // a la espera de resolución manual por el administrador.
      }

      console.log(`[Actualizador] Actualizando: ${dbMatch.homeTeam?.name} vs ${dbMatch.awayTeam?.name} -> Resultado: ${homeScore}-${awayScore}`);

      await prisma.$transaction(async (tx) => {
        // 1. Actualizar el partido
        const updatedMatch = await tx.match.update({
          where: { id: dbMatch.id },
          data: {
            homeScore,
            awayScore,
            homeScorers,
            awayScorers,
            winnerId,
            status: MatchStatus.FINISHED,
          },
        });

        // 2. Recalcular predicciones del partido
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

        // 3. Actualizar caché de puntajes de los usuarios
        const userIds = Array.from(new Set(predictions.map((p) => p.userId)));
        for (const uId of userIds) {
          await recalculateUserLeagueMemberships(tx, uId);
        }

        // 4. Recalcular goleadores
        await recalculateGoalscorers(tx);

        // 5. Log auditoría de sistema
        const systemAdmin = await tx.user.findFirst({ where: { role: Role.ADMIN } });
        await tx.auditLog.create({
          data: {
            userId: systemAdmin?.id || "SYSTEM",
            action: "AUTOMATED_RESULTS_UPDATE",
            details: `Resultados y goleadores cargados automáticamente vía ${planUsed} para ${dbMatch.homeTeam?.name} vs ${dbMatch.awayTeam?.name}.`,
          },
        });
      });

      summary.updatedCount++;
      summary.matches.push(`${dbMatch.homeTeam?.name} vs ${dbMatch.awayTeam?.name}`);

    } catch (err: any) {
      console.error(`Error al procesar el partido:`, err);
      summary.errors.push(`Error en partido ${m.home_team_name_en} vs ${m.away_team_name_en}: ${err.message}`);
    }
  }

  return {
    success: true,
    planUsed,
    ...summary,
  };
}
