'use client';

import { useState } from 'react';

import {
  type WeightOverrides,
  type WeightedCriterion,
  effectiveWeights,
  isAdjusted,
  withOverride,
} from '@/lib/weights';

/** Per-card weights: overrides live here, defaults keep coming from the streamed criteria. */
export const useCardWeights = (criteria: readonly WeightedCriterion[]) => {
  const [overrides, setOverrides] = useState<WeightOverrides>({});

  const setWeight = (index: number, weight: number) =>
    setOverrides((previous) => withOverride(previous, index, weight));

  const reset = () => setOverrides({});

  return {
    weights: effectiveWeights(criteria, overrides),
    isAdjusted: isAdjusted(criteria, overrides),
    setWeight,
    reset,
  };
};
