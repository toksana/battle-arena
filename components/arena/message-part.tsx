import type { ArenaPart } from '@/lib/ai/messages';

import { ClarificationCard } from './clarification-card';
import { ComparisonPreview, FallbackPreview } from './tool-part-previews';

interface MessagePartProps {
  part: ArenaPart;
}

/** Routes each streamed part to its view. Everything renders as plain text, never as HTML. */
export const MessagePart = ({ part }: MessagePartProps) => {
  switch (part.type) {
    case 'text':
      return <p className="whitespace-pre-wrap">{part.text}</p>;
    case 'tool-askClarification':
      return part.state === 'output-error' ? null : <ClarificationCard part={part} />;
    case 'tool-renderComparison':
      return <ComparisonPreview part={part} />;
    case 'tool-renderFallbackChips':
      return <FallbackPreview part={part} />;
    default:
      // step-start, reasoning, sources, files: not part of the arena UI.
      return null;
  }
};
