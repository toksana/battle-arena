import { clampWeight } from '@/lib/scoring';

/** User-adjusted weights by criterion index; criteria without an entry keep the model default. */
export type WeightOverrides = Readonly<Record<number, number>>;

export interface WeightedCriterion {
  defaultWeight: number;
}

/** Weights to score with: the user's override where present, the model default otherwise. */
export const effectiveWeights = (
  criteria: readonly WeightedCriterion[],
  overrides: WeightOverrides,
): number[] =>
  criteria.map((criterion, index) => clampWeight(overrides[index] ?? criterion.defaultWeight));

/** Records a slider change, clamped to the weight range, without mutating the previous map. */
export const withOverride = (
  overrides: WeightOverrides,
  index: number,
  weight: number,
): WeightOverrides => ({ ...overrides, [index]: clampWeight(weight) });

/** True when any effective weight differs from the model default, so Reset has work to do. */
export const isAdjusted = (
  criteria: readonly WeightedCriterion[],
  overrides: WeightOverrides,
): boolean =>
  effectiveWeights(criteria, overrides).some(
    (weight, index) => weight !== clampWeight(criteria[index].defaultWeight),
  );
