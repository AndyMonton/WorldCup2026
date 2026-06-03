import { MatchStage } from "@prisma/client";

export interface PredictionData {
  homeScore: number;
  awayScore: number;
  predictedWinnerId?: string | null;
}

export interface RealMatchData {
  homeScore: number | null;
  awayScore: number | null;
  winnerId?: string | null;
  stage: MatchStage;
}

export interface ScoreBreakdown {
  points: number;
  exactMatch: boolean;
  goalDifferenceMatch: boolean;
  tendencyMatch: boolean;
  consolationMatch: boolean;
  bonusMatch: boolean;
  detail: string;
}

/**
 * Calcula los puntos obtenidos por una predicción basándose en el resultado real.
 * Considera solo los 90 minutos reglamentarios (+adición) para el marcador,
 * y el clasificado (winnerId) para las fases de eliminación directa.
 */
export function calculateScore(
  prediction: PredictionData,
  realMatch: RealMatchData
): ScoreBreakdown {
  const result: ScoreBreakdown = {
    points: 0,
    exactMatch: false,
    goalDifferenceMatch: false,
    tendencyMatch: false,
    consolationMatch: false,
    bonusMatch: false,
    detail: "El partido aún no ha finalizado o no tiene resultados registrados.",
  };

  // Si no hay resultado real cargado, retorna 0 puntos
  if (realMatch.homeScore === null || realMatch.awayScore === null) {
    return result;
  }

  const pHome = prediction.homeScore;
  const pAway = prediction.awayScore;
  const rHome = realMatch.homeScore;
  const rAway = realMatch.awayScore;

  // Determinar tendencias en 90 min (1 = gana local, -1 = gana visita, 0 = empate)
  const pTendency = Math.sign(pHome - pAway);
  const rTendency = Math.sign(rHome - rAway);

  // Diferencia de goles en 90 min
  const pDiff = pHome - pAway;
  const rDiff = rHome - rAway;

  let points = 0;
  let detailMessage = "";

  // 1. Acierto Exacto (10 Puntos)
  if (pHome === rHome && pAway === rAway) {
    points = 10;
    result.exactMatch = true;
    detailMessage = "¡Marcador exacto! (10 pts)";
  }
  // 2. Diferencia de Goles (7 Puntos) - Solo aplica si hay un ganador
  else if (rTendency !== 0 && pTendency === rTendency && pDiff === rDiff) {
    points = 7;
    result.goalDifferenceMatch = true;
    detailMessage = "Acierto de ganador y diferencia de goles (7 pts)";
  }
  // 3. Tendencia (5 Puntos) - Ganador o empate no exacto
  else if (pTendency === rTendency) {
    points = 5;
    result.tendencyMatch = true;
    detailMessage = pTendency === 0
      ? "Acierto de tendencia de empate (5 pts)"
      : "Acierto de tendencia de ganador (5 pts)";
  }
  // 4. Pifia Total (0 Puntos)
  else {
    points = 0;
    detailMessage = "Sin aciertos en el tiempo reglamentario (0 pts)";
  }

  // 6. Bonus por Clasificado en Fase Eliminatoria (+3 Puntos)
  const isPlayoff = realMatch.stage !== MatchStage.GROUPS;
  let bonusPoints = 0;

  if (isPlayoff) {
    // Si coincide el equipo que clasifica/avanza
    const hasPredictedWinner = !!prediction.predictedWinnerId;
    const hasRealWinner = !!realMatch.winnerId;

    if (hasPredictedWinner && hasRealWinner && prediction.predictedWinnerId === realMatch.winnerId) {
      bonusPoints = 3;
      result.bonusMatch = true;
      detailMessage += " + Bonus de clasificación acertado (+3 pts)";
    } else if (hasPredictedWinner) {
      detailMessage += " (No se acertó el equipo clasificado)";
    }
  }

  result.points = points + bonusPoints;
  result.detail = detailMessage;

  return result;
}
