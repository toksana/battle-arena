import { createChatHandler } from '@/lib/ai/chat-handler';
import { rateLimiterFromEnv } from '@/lib/rate-limit';

/** Vercel AI Gateway model string; override with MODEL_ID. */
const DEFAULT_MODEL_ID = 'anthropic/claude-haiku-5.5';
const modelId = process.env.MODEL_ID ?? DEFAULT_MODEL_ID;

export const maxDuration = 30;

export const POST = createChatHandler({
  model: modelId,
  modelId,
  rateLimit: rateLimiterFromEnv(),
});
