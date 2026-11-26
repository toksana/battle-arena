import { faker } from '@faker-js/faker';
import { simulateReadableStream } from 'ai';
import { MockLanguageModelV4 } from 'ai/test';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PROMPT_LIMIT } from '@/lib/prompt-limit';
import { makeComparison } from '@/test/factories';
import { makeUserMessage } from '@/test/messages';

import { FRIENDLY_STREAM_ERROR, createChatHandler } from './chat-handler';
import { SYSTEM_PROMPT } from './system-prompt';

const USAGE = {
  inputTokens: { total: 120, noCache: 120, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: 340, text: 340, reasoning: undefined },
};

/** Streams a renderComparison tool call in three JSON chunks, like a real provider would. */
const comparisonModel = (input: string) => {
  const third = Math.ceil(input.length / 3);
  const deltas = [input.slice(0, third), input.slice(third, third * 2), input.slice(third * 2)];
  return new MockLanguageModelV4({
    doStream: async () => ({
      stream: simulateReadableStream({
        chunks: [
          { type: 'custom', kind: 'anthropic.message_start', providerMetadata: {} },
          { type: 'reasoning-start', id: 'r-1' },
          { type: 'reasoning-delta', id: 'r-1', delta: 'private chain of thought' },
          { type: 'reasoning-end', id: 'r-1' },
          { type: 'tool-input-start', id: 'call-1', toolName: 'renderComparison' },
          ...deltas.map((delta) => ({ type: 'tool-input-delta' as const, id: 'call-1', delta })),
          { type: 'tool-input-end', id: 'call-1' },
          { type: 'tool-call', toolCallId: 'call-1', toolName: 'renderComparison', input },
          {
            type: 'finish',
            finishReason: { unified: 'tool-calls', raw: undefined },
            logprobs: undefined,
            usage: USAGE,
          },
        ],
      }),
    }),
  });
};

const failingModel = () =>
  new MockLanguageModelV4({
    doStream: async () => {
      throw new Error('upstream exploded: secret-internal-detail');
    },
  });

const post = (body: unknown, headers: Record<string, string> = {}): Request =>
  new Request('http://localhost/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

/** Parses the SSE body into the JSON chunks the client would receive. */
const readChunks = async (response: Response): Promise<Array<Record<string, unknown>>> =>
  (await response.text())
    .split('\n')
    .filter((line) => line.startsWith('data: {'))
    .map((line) => JSON.parse(line.slice('data: '.length)));

describe('createChatHandler', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('streams the tool input in parts and acknowledges the render', async () => {
    // Arrange
    const input = JSON.stringify(makeComparison());
    const handler = createChatHandler({ model: comparisonModel(input), modelId: 'mock' });

    // Act
    const response = await handler(post({ messages: [makeUserMessage()] }));
    const chunks = await readChunks(response);

    // Assert
    expect(response.status).toBe(200);
    expect(chunks.filter((chunk) => chunk.type === 'tool-input-delta')).toHaveLength(3);
    expect(chunks).toContainEqual(
      expect.objectContaining({ type: 'tool-input-available', toolName: 'renderComparison' }),
    );
    expect(chunks).toContainEqual(
      expect.objectContaining({ type: 'tool-output-available', output: { rendered: true } }),
    );
  });

  it('keeps provider custom parts and reasoning out of the client stream', async () => {
    // Arrange
    const handler = createChatHandler({
      model: comparisonModel(JSON.stringify(makeComparison())),
      modelId: 'mock',
    });

    // Act
    const chunks = await readChunks(await handler(post({ messages: [makeUserMessage()] })));
    const types = chunks.map((chunk) => String(chunk.type));

    // Assert
    expect(types).not.toContain('custom');
    expect(types.filter((type) => type.startsWith('reasoning'))).toEqual([]);
  });

  it('attaches model and token usage as message metadata', async () => {
    // Arrange
    const handler = createChatHandler({
      model: comparisonModel(JSON.stringify(makeComparison())),
      modelId: 'mock-model',
    });

    // Act
    const chunks = await readChunks(await handler(post({ messages: [makeUserMessage()] })));
    const metadata = chunks.flatMap((chunk) =>
      chunk.messageMetadata ? [chunk.messageMetadata] : [],
    );

    // Assert
    expect(metadata).toContainEqual(expect.objectContaining({ model: 'mock-model' }));
    expect(metadata).toContainEqual({ inputTokens: 120, outputTokens: 340 });
  });

  it('forces a tool call, sends instructions and wraps the user text as data', async () => {
    // Arrange
    const model = comparisonModel(JSON.stringify(makeComparison()));
    const handler = createChatHandler({ model, modelId: 'mock' });
    const text = `${faker.lorem.word()} vs ${faker.lorem.word()}`;

    // Act
    await (await handler(post({ messages: [makeUserMessage(text)] }))).text();
    const prompt = model.doStreamCalls[0].prompt;

    // Assert
    expect(model.doStreamCalls[0].toolChoice).toEqual({ type: 'required' });
    expect(prompt[0]).toEqual(expect.objectContaining({ role: 'system', content: SYSTEM_PROMPT }));
    expect(prompt[1]).toEqual(
      expect.objectContaining({
        role: 'user',
        content: [
          expect.objectContaining({ type: 'text', text: `<user_dilemma>${text}</user_dilemma>` }),
        ],
      }),
    );
  });

  it.each([
    ['invalid JSON', '{not json', 'invalid_messages'],
    ['missing messages', {}, 'invalid_messages'],
    [
      'over-limit prompt',
      { messages: [makeUserMessage('x'.repeat(PROMPT_LIMIT + 1))] },
      'too_long',
    ],
  ])('rejects %s with 400 before calling the model', async (_name, body, error) => {
    // Arrange
    const model = comparisonModel('{}');
    const handler = createChatHandler({ model, modelId: 'mock' });

    // Act
    const response = await handler(post(body));

    // Assert
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error });
    expect(model.doStreamCalls).toHaveLength(0);
  });

  it('hides provider error details behind a friendly message', async () => {
    // Arrange
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const handler = createChatHandler({ model: failingModel(), modelId: 'mock' });

    // Act
    const body = await (await handler(post({ messages: [makeUserMessage()] }))).text();

    // Assert
    expect(body).toContain(FRIENDLY_STREAM_ERROR);
    expect(body).not.toContain('secret-internal-detail');
  });

  describe('rate limit', () => {
    it('rejects an over-limit client with 429 before calling the model', async () => {
      // Arrange
      const now = faker.date.recent().getTime();
      const resetAt = now + 90_500;
      const ip = faker.internet.ip();
      const rateLimit = vi.fn(async () => ({ allowed: false, resetAt }));
      const model = comparisonModel('{}');
      const handler = createChatHandler({ model, modelId: 'mock', rateLimit, now: () => now });

      // Act
      const response = await handler(post({ messages: [makeUserMessage()] }, { 'x-real-ip': ip }));

      // Assert
      expect(response.status).toBe(429);
      expect(response.headers.get('Retry-After')).toBe('91');
      expect(await response.json()).toEqual({ error: 'rate_limited', resetAt });
      expect(rateLimit).toHaveBeenCalledExactlyOnceWith(ip);
      expect(model.doStreamCalls).toHaveLength(0);
    });

    it('counts invalid requests too, so malformed spam is limited', async () => {
      // Arrange
      const rateLimit = vi.fn(async () => ({ allowed: true, resetAt: 0 }));
      const handler = createChatHandler({
        model: comparisonModel('{}'),
        modelId: 'mock',
        rateLimit,
      });

      // Act
      const response = await handler(post('{not json'));

      // Assert
      expect(response.status).toBe(400);
      expect(rateLimit).toHaveBeenCalledOnce();
    });

    it('streams normally when the client is within the limit', async () => {
      // Arrange
      const rateLimit = vi.fn(async () => ({ allowed: true, resetAt: 0 }));
      const handler = createChatHandler({
        model: comparisonModel(JSON.stringify(makeComparison())),
        modelId: 'mock',
        rateLimit,
      });

      // Act
      const response = await handler(post({ messages: [makeUserMessage()] }));

      // Assert
      expect(response.status).toBe(200);
      expect(await readChunks(response)).toContainEqual(
        expect.objectContaining({ type: 'tool-input-available' }),
      );
    });
  });
});
