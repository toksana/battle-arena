import type { DeepPartial } from 'ai';

import type { ArenaToolPart } from '@/lib/ai/messages';
import type { ArenaToolName } from '@/lib/ai/tools';
import type { FallbackChips } from '@/lib/ai/schemas';

import { ComparisonCard } from './comparison-card';

export const STREAMING_LABEL = 'Streaming…';

/**
 * Shared status line. A failed tool renders nothing here: its unvalidated input is dropped,
 * its error text can hold validation details, and the arena shows a retry notice instead.
 */
const ToolStatus = ({ state }: { state: ArenaToolPart<ArenaToolName>['state'] }) => {
  if (state === 'input-streaming')
    return <p className="font-mono text-xs text-muted-foreground">{STREAMING_LABEL}</p>;
  return null;
};

// Plain-text placeholder: slice 11 replaces the fallback preview with real chips.

export const ComparisonPreview = ({ part }: { part: ArenaToolPart<'renderComparison'> }) =>
  part.state === 'output-error' ? null : (
    <ComparisonCard input={part.input} isStreaming={part.state === 'input-streaming'} />
  );

export const FallbackPreview = ({ part }: { part: ArenaToolPart<'renderFallbackChips'> }) => {
  const input: DeepPartial<FallbackChips> | undefined = part.input;
  return (
    <div className="flex flex-col gap-1">
      <p>{input?.message}</p>
      <ul className="text-muted-foreground">
        {input?.prompts?.map((prompt, index) => (
          <li key={index}>{prompt}</li>
        ))}
      </ul>
      <ToolStatus state={part.state} />
    </div>
  );
};
