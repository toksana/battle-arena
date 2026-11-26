import { isToolUIPart } from 'ai';

import { shouldContinueAfterClarification } from '@/lib/ai/continuation';
import type { ArenaUIMessage } from '@/lib/ai/messages';

import type { RecordedToolCall } from './chunks';
import type { PresetReplay } from './fixtures';

const answeredGoalId = (message: ArenaUIMessage): string | undefined =>
  message.parts
    .filter(isToolUIPart)
    .flatMap((part) =>
      part.type === 'tool-askClarification' && part.state === 'output-available'
        ? [part.output.goalId]
        : [],
    )
    .at(-1);

/**
 * Which recorded tool call answers this history: the clarification for a fresh dilemma, the
 * comparison for the picked goal after an answer, or null when the recording has no match.
 */
export const replayStep = (
  messages: readonly ArenaUIMessage[],
  replay: PresetReplay,
): RecordedToolCall | null => {
  const last = messages.at(-1);
  if (last?.role === 'user') {
    return {
      toolName: 'askClarification',
      toolCallId: `replay-${replay.presetId}-clarification`,
      input: replay.clarification,
    };
  }
  if (!last || !shouldContinueAfterClarification({ messages })) return null;

  const goalId = answeredGoalId(last);
  const entry = replay.comparisons.find((candidate) => candidate.goalId === goalId);
  if (!entry) return null;
  return {
    toolName: 'renderComparison',
    toolCallId: `replay-${replay.presetId}-${entry.goalId}`,
    input: entry.comparison,
    output: { rendered: true },
    messageId: last.id,
  };
};
