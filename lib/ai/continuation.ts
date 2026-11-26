import { isToolUIPart } from 'ai';

import type { ArenaUIMessage } from './messages';

/**
 * Auto-send only after the user answered askClarification. Display tools are acknowledged
 * on the server, so a generic "all tool calls complete" check would loop: every finished
 * comparison would trigger another request and a duplicate card.
 */
export const shouldContinueAfterClarification = ({
  messages,
}: {
  messages: readonly ArenaUIMessage[];
}): boolean => {
  const last = messages.at(-1);
  if (last?.role !== 'assistant') return false;
  const lastTool = last.parts.filter(isToolUIPart).at(-1);
  return lastTool?.type === 'tool-askClarification' && lastTool.state === 'output-available';
};
