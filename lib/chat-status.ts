import { APICallError, type ChatStatus } from 'ai';

import { RateLimitedBodySchema } from '@/lib/api-errors';

const HTTP_BAD_REQUEST = 400;
const HTTP_TOO_MANY_REQUESTS = 429;
const MS_PER_MINUTE = 60_000;

export const INVALID_PROMPT_MESSAGE =
  'This dilemma could not be sent. Check its length and try again.';
export const GENERIC_CHAT_ERROR = 'The arena glitched mid-battle. Please try again.';

/** True while a request is in flight, so input and presets stay locked. */
export const isChatBusy = (status: ChatStatus): boolean =>
  status === 'submitted' || status === 'streaming';

/**
 * Maps any chat error to fixed client-side copy, so server or provider text is never rendered.
 */
export const chatErrorMessage = (error: unknown): string =>
  APICallError.isInstance(error) && error.statusCode === HTTP_BAD_REQUEST
    ? INVALID_PROMPT_MESSAGE
    : GENERIC_CHAT_ERROR;

export const isRateLimited = (error: unknown): boolean =>
  APICallError.isInstance(error) && error.statusCode === HTTP_TOO_MANY_REQUESTS;

const parseJson = (text: string | undefined): unknown => {
  try {
    return JSON.parse(text ?? '');
  } catch (error) {
    if (error instanceof SyntaxError) return null;
    throw error;
  }
};

/** When a 429 says the window frees up; null for other errors or a body without a valid time. */
export const rateLimitResetAt = (error: unknown): number | null => {
  if (!APICallError.isInstance(error) || !isRateLimited(error)) return null;
  const body = RateLimitedBodySchema.safeParse(parseJson(error.responseBody));
  return body.success ? body.data.resetAt : null;
};

/** Whole minutes until reset, rounded up; 0 once the reset time has passed. */
export const minutesUntil = (resetAt: number, now: number): number =>
  Math.max(0, Math.ceil((resetAt - now) / MS_PER_MINUTE));
