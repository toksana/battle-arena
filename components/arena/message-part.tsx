import type { ArenaPart, GoalAnswer } from '@/lib/ai/messages';

import { ClarificationCard } from './clarification-card';
import { FallbackChipsCard } from './fallback-chips';
import { ComparisonPreview } from './tool-part-previews';

interface MessagePartProps {
  part: ArenaPart;
  onAnswer?: (answer: GoalAnswer) => void;
  onPickPrompt?: (prompt: string) => void;
  isBusy?: boolean;
}

/** Routes each streamed part to its view. Everything renders as plain text, never as HTML. */
export const MessagePart = ({ part, onAnswer, onPickPrompt, isBusy }: MessagePartProps) => {
  switch (part.type) {
    case 'text':
      return <p className="whitespace-pre-wrap">{part.text}</p>;
    case 'tool-askClarification':
      return part.state === 'output-error' ? null : (
        <ClarificationCard part={part} onAnswer={onAnswer} disabled={isBusy} />
      );
    case 'tool-renderComparison':
      return <ComparisonPreview part={part} />;
    case 'tool-renderFallbackChips':
      return part.state === 'output-error' ? null : (
        <FallbackChipsCard part={part} onPick={onPickPrompt} disabled={isBusy} />
      );
    default:
      // step-start, reasoning, sources, files: not part of the arena UI.
      return null;
  }
};
