import { z } from 'zod';

/** Body of a 429 from /api/chat: shared by the route that sends it and the client that reads it. */
export const RateLimitedBodySchema = z.object({
  error: z.literal('rate_limited'),
  /** Epoch milliseconds when the client may send again. */
  resetAt: z.number(),
});

export type RateLimitedBody = z.infer<typeof RateLimitedBodySchema>;

const MS_PER_SECOND = 1000;

/** Whole seconds until reset for the Retry-After header; never below 1 so clients back off. */
export const retryAfterSeconds = (resetAt: number, now: number): number =>
  Math.max(1, Math.ceil((resetAt - now) / MS_PER_SECOND));
