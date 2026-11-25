export const PROMPT_LIMIT = 200;

/** The counter stays out of the way until the prompt reaches this share of the limit. */
export const COUNTER_VISIBLE_RATIO = 0.8;
/** From this share the counter warns (amber) that the limit is close. */
export const NEAR_LIMIT_RATIO = 0.9;

/**
 * How the length counter looks: hidden while short, then plain, amber near the limit and red
 * past it (submit is blocked then; the text itself is never cut).
 */
export type PromptLengthTone = 'hidden' | 'visible' | 'near' | 'over';

/** Counted like the server counts: on the trimmed text. */
export const promptLength = (prompt: string): number => prompt.trim().length;

export const promptLengthTone = (
  length: number,
  limit: number = PROMPT_LIMIT,
): PromptLengthTone => {
  if (length > limit) return 'over';
  if (length >= limit * NEAR_LIMIT_RATIO) return 'near';
  if (length >= limit * COUNTER_VISIBLE_RATIO) return 'visible';
  return 'hidden';
};
