import type { DeepPartial } from 'ai';

import { MAX_SCORE, MIN_SCORE, type Criterion } from '@/lib/ai/schemas';

/** Partial JSON can leave holes in arrays mid-stream; drop them so lists render cleanly. */
export const presentItems = <T>(items: ReadonlyArray<T | undefined> | undefined): T[] =>
  (items ?? []).filter((item): item is T => item !== undefined);

/** Score as a bar width in percent, clamped so malformed values never overflow the track. */
export const scorePercent = (score: number): number => {
  const clamped = Math.min(MAX_SCORE, Math.max(MIN_SCORE, score));
  return ((clamped - MIN_SCORE) / (MAX_SCORE - MIN_SCORE)) * 100;
};

export type ReadyCriterion = Pick<Criterion, 'label' | 'defaultWeight' | 'scoreA' | 'scoreB'> & {
  rationale?: string;
};

/** A criterion row can render once its label, default weight and both scores have streamed in. */
export const isCriterionReady = (
  criterion: DeepPartial<Criterion> | undefined,
): criterion is ReadyCriterion =>
  typeof criterion?.label === 'string' &&
  typeof criterion.defaultWeight === 'number' &&
  typeof criterion.scoreA === 'number' &&
  typeof criterion.scoreB === 'number';
