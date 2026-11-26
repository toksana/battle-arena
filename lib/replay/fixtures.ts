import { z } from 'zod';

import { ClarificationSchema, ComparisonSchema } from '@/lib/ai/schemas';

/**
 * A pre-rendered preset battle: the clarification the model asked and one comparison per
 * goal. Recorded from the live API by scripts/record-replays.ts; replayed client-side while
 * the arena is rate limited.
 */
export const PresetReplaySchema = z.object({
  presetId: z.string(),
  clarification: ClarificationSchema,
  comparisons: z.array(z.object({ goalId: z.string(), comparison: ComparisonSchema })),
});

export type PresetReplay = z.infer<typeof PresetReplaySchema>;
