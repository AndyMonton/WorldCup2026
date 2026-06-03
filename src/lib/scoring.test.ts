import test from "node:test";
import assert from "node:assert";
import { calculateScore } from "./scoring.js";
import { MatchStage } from "@prisma/client";

test("calculateScore - Fase de Grupos", async (t) => {
  await t.test("Debería otorgar 10 puntos por marcador exacto", () => {
    const pred = { homeScore: 2, awayScore: 1 };
    const real = { homeScore: 2, awayScore: 1, stage: MatchStage.GROUPS };
    const score = calculateScore(pred, real);
    
    assert.strictEqual(score.points, 10);
    assert.strictEqual(score.exactMatch, true);
    assert.strictEqual(score.goalDifferenceMatch, false);
    assert.strictEqual(score.tendencyMatch, false);
    assert.strictEqual(score.consolationMatch, false);
  });

  await t.test("Debería otorgar 7 puntos por acierto de ganador y diferencia de goles correcta", () => {
    const pred = { homeScore: 1, awayScore: 0 };
    const real = { homeScore: 2, awayScore: 1, stage: MatchStage.GROUPS };
    const score = calculateScore(pred, real);
    
    assert.strictEqual(score.points, 7);
    assert.strictEqual(score.exactMatch, false);
    assert.strictEqual(score.goalDifferenceMatch, true);
    assert.strictEqual(score.tendencyMatch, false);
    assert.strictEqual(score.consolationMatch, false);
  });

  await t.test("Debería otorgar 5 puntos por acierto de tendencia de ganador (diferencia incorrecta)", () => {
    const pred = { homeScore: 3, awayScore: 0 };
    const real = { homeScore: 2, awayScore: 1, stage: MatchStage.GROUPS };
    const score = calculateScore(pred, real);
    
    assert.strictEqual(score.points, 5);
    assert.strictEqual(score.exactMatch, false);
    assert.strictEqual(score.goalDifferenceMatch, false);
    assert.strictEqual(score.tendencyMatch, true);
    assert.strictEqual(score.consolationMatch, false);
  });

  await t.test("Debería otorgar 5 puntos por acierto de tendencia de empate (no exacto)", () => {
    const pred = { homeScore: 1, awayScore: 1 };
    const real = { homeScore: 2, awayScore: 2, stage: MatchStage.GROUPS };
    const score = calculateScore(pred, real);
    
    assert.strictEqual(score.points, 5);
    assert.strictEqual(score.exactMatch, false);
    assert.strictEqual(score.goalDifferenceMatch, false);
    assert.strictEqual(score.tendencyMatch, true);
    assert.strictEqual(score.consolationMatch, false);
  });

  await t.test("No debería otorgar puntos por consuelo (debería dar 0 puntos)", () => {
    const pred = { homeScore: 2, awayScore: 3 };
    const real = { homeScore: 2, awayScore: 1, stage: MatchStage.GROUPS };
    const score = calculateScore(pred, real);
    
    assert.strictEqual(score.points, 0);
    assert.strictEqual(score.exactMatch, false);
    assert.strictEqual(score.goalDifferenceMatch, false);
    assert.strictEqual(score.tendencyMatch, false);
    assert.strictEqual(score.consolationMatch, false);
  });

  await t.test("Debería otorgar 0 puntos por pifia total", () => {
    const pred = { homeScore: 0, awayScore: 3 };
    const real = { homeScore: 2, awayScore: 1, stage: MatchStage.GROUPS };
    const score = calculateScore(pred, real);
    
    assert.strictEqual(score.points, 0);
    assert.strictEqual(score.exactMatch, false);
    assert.strictEqual(score.goalDifferenceMatch, false);
    assert.strictEqual(score.tendencyMatch, false);
    assert.strictEqual(score.consolationMatch, false);
  });
});

test("calculateScore - Fase Eliminatoria (Playoffs)", async (t) => {
  const teamA = "team-a-id";
  const teamB = "team-b-id";

  await t.test("Marcador exacto y clasificado acertado -> 10 + 3 = 13 puntos", () => {
    const pred = { homeScore: 1, awayScore: 1, predictedWinnerId: teamA };
    const real = { homeScore: 1, awayScore: 1, winnerId: teamA, stage: MatchStage.ROUND_16 };
    const score = calculateScore(pred, real);

    assert.strictEqual(score.points, 13);
    assert.strictEqual(score.exactMatch, true);
    assert.strictEqual(score.bonusMatch, true);
  });

  await t.test("Marcador exacto pero clasificado errado -> 10 + 0 = 10 puntos", () => {
    const pred = { homeScore: 1, awayScore: 1, predictedWinnerId: teamA };
    const real = { homeScore: 1, awayScore: 1, winnerId: teamB, stage: MatchStage.ROUND_16 };
    const score = calculateScore(pred, real);

    assert.strictEqual(score.points, 10);
    assert.strictEqual(score.exactMatch, true);
    assert.strictEqual(score.bonusMatch, false);
  });

  await t.test("Marcador errado pero clasificado acertado -> 0 + 3 = 3 puntos", () => {
    const pred = { homeScore: 2, awayScore: 0, predictedWinnerId: teamA };
    const real = { homeScore: 0, awayScore: 1, winnerId: teamA, stage: MatchStage.ROUND_16 };
    const score = calculateScore(pred, real);

    assert.strictEqual(score.points, 3);
    assert.strictEqual(score.exactMatch, false);
    assert.strictEqual(score.bonusMatch, true);
  });
});
