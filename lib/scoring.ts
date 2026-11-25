import { MAX_SCORE, MAX_WEIGHT, MIN_WEIGHT } from '@/lib/ai/schemas';

export interface ScoredCriterion {
  scoreA: number;
  scoreB: number;
}

export interface Scores {
  a: number;
  b: number;
}

export type Leader = 'a' | 'b' | null;

/** Scores are normalized from 0–MAX_SCORE to 0–100. */
const SCALE = 100 / MAX_SCORE;

export const clampWeight = (weight: number): number =>
  Math.min(MAX_WEIGHT, Math.max(MIN_WEIGHT, Math.round(weight)));

/** Weighted mean of per-criterion scores, scaled to an integer 0–100. */
export const computeScores = (
  criteria: readonly ScoredCriterion[],
  weights: readonly number[],
): Scores => {
  const totals = criteria.reduce(
    (acc, criterion, index) => {
      const weight = weights[index] ?? 0;
      return {
        weight: acc.weight + weight,
        a: acc.a + weight * criterion.scoreA,
        b: acc.b + weight * criterion.scoreB,
      };
    },
    { weight: 0, a: 0, b: 0 },
  );

  if (totals.weight === 0) return { a: 0, b: 0 };

  return {
    a: Math.round((totals.a / totals.weight) * SCALE),
    b: Math.round((totals.b / totals.weight) * SCALE),
  };
};

export const pickLeader = ({ a, b }: Scores): Leader => {
  if (a === b) return null;
  return a > b ? 'a' : 'b';
};
