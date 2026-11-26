import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type LanguageModel,
} from 'ai';

import { type RateLimitedBody, retryAfterSeconds } from '@/lib/api-errors';
import { type RateLimiter, allowAll, clientKey } from '@/lib/rate-limit';

import type { ArenaUIMessage, MessageMetadata } from './messages';
import { prepareMessages, wrapUserMessages } from './prepare-messages';
import { SYSTEM_PROMPT } from './system-prompt';
import { tools } from './tools';

export const FRIENDLY_STREAM_ERROR = 'The arena glitched mid-battle. Please try again.';

interface ChatHandlerOptions {
  model: LanguageModel;
  /** Shown in message metadata (future Agent Inspector). */
  modelId: string;
  /** Checked before anything else, so over-limit requests never reach the model. */
  rateLimit?: RateLimiter;
  now?: () => number;
}

const readJson = async (req: Request): Promise<unknown> => {
  try {
    return await req.json();
  } catch (error) {
    if (error instanceof Error) return null;
    throw error;
  }
};

const messagesOf = (body: unknown): unknown =>
  typeof body === 'object' && body !== null && 'messages' in body ? body.messages : undefined;

/** Provider-specific `custom` parts (e.g. raw usage blobs) are noise for the client. */
const dropCustomParts = <PART extends { type: string }>() =>
  new TransformStream<PART, PART>({
    transform: (part, controller) => {
      if (part.type !== 'custom') controller.enqueue(part);
    },
  });

interface UsagePart {
  type: string;
  totalUsage?: { inputTokens?: number; outputTokens?: number };
}

/** Model id on start, token usage on finish — the data a future Agent Inspector shows. */
const metadataFor =
  (modelId: string) =>
  ({ part }: { part: UsagePart }): MessageMetadata | undefined => {
    if (part.type === 'start') return { model: modelId };
    if (part.type === 'finish') {
      return {
        inputTokens: part.totalUsage?.inputTokens,
        outputTokens: part.totalUsage?.outputTokens,
      };
    }
    return undefined;
  };

const logStreamError = (error: unknown): string => {
  console.error('[chat] stream error', error instanceof Error ? error.message : error);
  return FRIENDLY_STREAM_ERROR;
};

const tooManyRequests = (resetAt: number, now: number): Response => {
  const body: RateLimitedBody = { error: 'rate_limited', resetAt };
  return Response.json(body, {
    status: 429,
    headers: { 'Retry-After': String(retryAfterSeconds(resetAt, now)) },
  });
};

interface BattleStreamOptions {
  model: LanguageModel;
  modelId: string;
  messages: ArenaUIMessage[];
}

const streamBattle = async ({ model, modelId, messages }: BattleStreamOptions) => {
  const result = streamText({
    model,
    instructions: SYSTEM_PROMPT,
    messages: await convertToModelMessages(wrapUserMessages(messages)),
    tools,
    // Every route is a tool call, so the model has no channel to narrate its reasoning.
    toolChoice: 'required',
    // A comparison card needs no chain of thought; skipping it cuts time to first token.
    reasoning: 'none',
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream.pipeThrough(dropCustomParts()),
      originalMessages: messages,
      messageMetadata: metadataFor(modelId),
      sendReasoning: false,
      onError: logStreamError,
    }),
  });
};

export const createChatHandler =
  ({ model, modelId, rateLimit = allowAll, now = Date.now }: ChatHandlerOptions) =>
  async (req: Request): Promise<Response> => {
    const limit = await rateLimit(clientKey(req.headers));
    if (!limit.allowed) return tooManyRequests(limit.resetAt, now());

    const prepared = await prepareMessages(messagesOf(await readJson(req)));
    if (!prepared.ok) return Response.json({ error: prepared.error }, { status: 400 });

    return streamBattle({ model, modelId, messages: prepared.messages });
  };
