import { faker } from '@faker-js/faker';
import type { ChatTransport } from 'ai';
import { convertReadableStreamToArray } from 'ai/test';
import { describe, expect, it, vi } from 'vitest';

import type { ArenaUIMessage } from '@/lib/ai/messages';
import { makeComparison } from '@/test/factories';
import { makeComparisonMessage, makeUserMessage } from '@/test/messages';

import type { PresetReplay } from './fixtures';
import { REPLAY_UNAVAILABLE, createArenaTransport, replayPresetIdOf } from './transport';

type SendOptions = Parameters<ChatTransport<ArenaUIMessage>['sendMessages']>[0];

const replayUser = (presetId: string): ArenaUIMessage => ({
  ...makeUserMessage(),
  metadata: { replayPresetId: presetId },
});

const recording: PresetReplay = {
  presetId: 'coffee-vs-smoothie',
  clarification: {
    question: faker.lorem.sentence(),
    goals: ['a', 'b', 'c'].map((id) => ({ id, label: id, emoji: '⚡', hint: faker.lorem.word() })),
  },
  comparisons: [],
};

const sendOptions = (messages: ArenaUIMessage[]): SendOptions => ({
  trigger: 'submit-message',
  chatId: faker.string.uuid(),
  messageId: undefined,
  messages,
  abortSignal: undefined,
});

const makeTransport = () => {
  const liveStream = new ReadableStream();
  const live = {
    sendMessages: vi.fn(async () => liveStream),
    reconnectToStream: vi.fn(async () => null),
  };
  const load = vi.fn(async () => recording);
  const transport = createArenaTransport(live, { load, initialDelayInMs: 0, chunkDelayInMs: 0 });
  return { transport, live, liveStream, load };
};

describe('replayPresetIdOf', () => {
  it.each<[string, ArenaUIMessage[], string | null]>([
    ['a replayed preset', [replayUser('claude-vs-groq')], 'claude-vs-groq'],
    ['a live battle', [makeUserMessage()], null],
    ['an unknown preset id', [replayUser('not-a-preset')], null],
    ['an empty history', [], null],
  ])('%s → %s', (_name, messages, expected) => {
    // Act
    const id = replayPresetIdOf(messages);

    // Assert
    expect(id).toBe(expected);
  });
});

describe('createArenaTransport', () => {
  it('sends live battles to the API untouched', async () => {
    // Arrange
    const { transport, live, liveStream, load } = makeTransport();
    const options = sendOptions([makeUserMessage()]);

    // Act
    const stream = await transport.sendMessages(options);

    // Assert
    expect(stream).toBe(liveStream);
    expect(live.sendMessages).toHaveBeenCalledExactlyOnceWith(options);
    expect(load).not.toHaveBeenCalled();
  });

  it('streams the recorded clarification for a replayed preset without the API', async () => {
    // Arrange
    const { transport, live, load } = makeTransport();

    // Act
    const chunks = await convertReadableStreamToArray(
      await transport.sendMessages(sendOptions([replayUser('coffee-vs-smoothie')])),
    );

    // Assert
    expect(live.sendMessages).not.toHaveBeenCalled();
    expect(load).toHaveBeenCalledExactlyOnceWith('coffee-vs-smoothie');
    expect(chunks).toContainEqual(
      expect.objectContaining({
        type: 'tool-input-available',
        toolName: 'askClarification',
        input: recording.clarification,
      }),
    );
  });

  it('reports a friendly error when the recording has no matching step', async () => {
    // Arrange
    const { transport } = makeTransport();
    const history = [replayUser('coffee-vs-smoothie'), makeComparisonMessage(makeComparison())];

    // Act
    const chunks = await convertReadableStreamToArray(
      await transport.sendMessages(sendOptions(history)),
    );

    // Assert
    expect(chunks).toEqual([{ type: 'error', errorText: REPLAY_UNAVAILABLE }]);
  });
});
