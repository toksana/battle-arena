import type { InferUIMessageChunk } from 'ai';

import type { ArenaUIMessage } from '@/lib/ai/messages';
import type { ArenaToolName } from '@/lib/ai/tools';

export type ArenaChunk = InferUIMessageChunk<ArenaUIMessage>;

/** Roughly what a provider sends per tool-input delta, so skeletons fill in at a real pace. */
export const DELTA_SIZE = 24;

/** Shown in message metadata instead of a model id, so replays stay recognizable. */
export const REPLAY_MODEL = 'pre-rendered';

export interface RecordedToolCall {
  toolName: ArenaToolName;
  toolCallId: string;
  input: unknown;
  /** Server-acknowledged display tools carry an output; the HITL clarification does not. */
  output?: unknown;
  /** Continue this assistant message, as the live API does after a clarification answer. */
  messageId?: string;
}

/** Splits text into pieces of at most `size` characters; joining them restores the text. */
export const splitIntoDeltas = (text: string, size = DELTA_SIZE): string[] =>
  Array.from({ length: Math.ceil(text.length / size) }, (_, index) =>
    text.slice(index * size, (index + 1) * size),
  );

/** The same chunk sequence the live route streams for one tool call. */
export const toolCallChunks = ({
  toolName,
  toolCallId,
  input,
  output,
  messageId,
}: RecordedToolCall): ArenaChunk[] => [
  { type: 'start', messageId, messageMetadata: { model: REPLAY_MODEL } },
  { type: 'start-step' },
  { type: 'tool-input-start', toolCallId, toolName },
  ...splitIntoDeltas(JSON.stringify(input)).map((inputTextDelta): ArenaChunk => ({
    type: 'tool-input-delta',
    toolCallId,
    inputTextDelta,
  })),
  { type: 'tool-input-available', toolCallId, toolName, input },
  ...(output === undefined
    ? []
    : [{ type: 'tool-output-available', toolCallId, output } satisfies ArenaChunk]),
  { type: 'finish-step' },
  { type: 'finish', finishReason: 'tool-calls' },
];
