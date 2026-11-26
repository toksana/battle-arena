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

type ArenaPart = ArenaUIMessage['parts'][number];

const isFailedTool = (part: ArenaPart): boolean =>
  isToolUIPart(part) && part.state === 'output-error';

const lastAssistant = (messages: readonly ArenaUIMessage[]): ArenaUIMessage | undefined => {
  const last = messages.at(-1);
  return last?.role === 'assistant' ? last : undefined;
};

/** True when the latest reply holds a tool call that failed, e.g. schema validation. */
export const hasFailedTool = (messages: readonly ArenaUIMessage[]): boolean =>
  lastAssistant(messages)?.parts.some(isFailedTool) ?? false;

/**
 * Cuts the latest reply at its first failed tool call, keeping what came before it
 * (an answered clarification) minus the dangling step marker, so a retry resumes from there instead of starting over.
 */
export const dropFailedToolParts = (messages: readonly ArenaUIMessage[]): ArenaUIMessage[] => {
  const last = lastAssistant(messages);
  const failedAt = last?.parts.findIndex(isFailedTool) ?? -1;
  if (!last || failedAt === -1) return [...messages];
  const kept = last.parts.slice(0, failedAt);
  const lastContent = kept.findLastIndex((part) => part.type !== 'step-start');
  return [...messages.slice(0, -1), { ...last, parts: kept.slice(0, lastContent + 1) }];
};
