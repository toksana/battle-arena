import { isToolUIPart } from 'ai';

import type { ArenaPart, GoalAnswer } from '@/lib/ai/messages';

import { ClarificationCard } from './clarification-card';
import { ComparisonCard } from './comparison-card';
import { FallbackChipsCard } from './fallback-chips';

interface MessagePartProps {
  part: ArenaPart;
  onAnswer?: (answer: GoalAnswer) => void;
  onPickPrompt?: (prompt: string) => void;
  isBusy?: boolean;
}

/** Routes each streamed part to its view. Everything renders as plain text, never as HTML. */
export const MessagePart = ({ part, onAnswer, onPickPrompt, isBusy }: MessagePartProps) => {
  // A failed tool call renders nothing: its input never passed validation, its error text can
  // hold validation details, and the arena shows a retry notice instead.
  if (isToolUIPart(part) && part.state === 'output-error') return null;

  switch (part.type) {
    case 'text':
      return <p className="whitespace-pre-wrap">{part.text}</p>;
    case 'tool-askClarification':
      return <ClarificationCard part={part} onAnswer={onAnswer} disabled={isBusy} />;
    case 'tool-renderComparison':
      return <ComparisonCard input={part.input} isStreaming={part.state === 'input-streaming'} />;
    case 'tool-renderFallbackChips':
      return <FallbackChipsCard part={part} onPick={onPickPrompt} disabled={isBusy} />;
    default:
      // step-start, reasoning, sources, files: not part of the arena UI.
      return null;
  }
};
