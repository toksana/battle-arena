import { type ChatTransport, simulateReadableStream } from 'ai';

import type { ArenaUIMessage } from '@/lib/ai/messages';
import type { PresetId } from '@/lib/presets';

import { type ArenaChunk, toolCallChunks } from './chunks';
import { replayStep } from './plan';
import { hasReplay, loadReplay } from './registry';

/** A short pause before the first chunk and a steady cadence read like a fast live model. */
const INITIAL_DELAY_MS = 400;
const CHUNK_DELAY_MS = 25;

export const REPLAY_UNAVAILABLE = 'This pre-rendered battle has no recording for that step.';

/** The preset a battle replays, read from its first user message; null for live battles. */
export const replayPresetIdOf = (messages: readonly ArenaUIMessage[]): PresetId | null => {
  const id = messages.find((message) => message.role === 'user')?.metadata?.replayPresetId;
  return id !== undefined && hasReplay(id) ? id : null;
};

interface ReplayOptions {
  load?: typeof loadReplay;
  initialDelayInMs?: number;
  chunkDelayInMs?: number;
}

/**
 * Live battles go to the API; pre-rendered ones stream their recording through the same
 * chunk protocol, so the cards render exactly as they do live, with no server or rate limit.
 */
export const createArenaTransport = (
  live: ChatTransport<ArenaUIMessage>,
  {
    load = loadReplay,
    initialDelayInMs = INITIAL_DELAY_MS,
    chunkDelayInMs = CHUNK_DELAY_MS,
  }: ReplayOptions = {},
): ChatTransport<ArenaUIMessage> => ({
  sendMessages: async (options) => {
    const presetId = replayPresetIdOf(options.messages);
    if (presetId === null) return live.sendMessages(options);

    const step = replayStep(options.messages, await load(presetId));
    const chunks: ArenaChunk[] = step
      ? toolCallChunks(step)
      : [{ type: 'error', errorText: REPLAY_UNAVAILABLE }];
    return simulateReadableStream({ chunks, initialDelayInMs, chunkDelayInMs });
  },
  reconnectToStream: (options) => live.reconnectToStream(options),
});
