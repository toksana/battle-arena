import type { DeepPartial } from 'ai';

import type { ArenaUIMessage } from '@/lib/ai/messages';
import type { ArenaToolName } from '@/lib/ai/tools';
import type { Clarification, Comparison, FallbackChips } from '@/lib/ai/schemas';

type ArenaPart = ArenaUIMessage['parts'][number];
type ToolPart<Name extends string> = Extract<ArenaPart, { type: `tool-${Name}` }>;

export const TOOL_ERROR_MESSAGE = 'This part of the battle failed to render.';
export const STREAMING_LABEL = 'Streaming…';

/** Shared status line: tool error text is never shown, it can hold validation details. */
const ToolStatus = ({ state }: { state: ToolPart<ArenaToolName>['state'] }) => {
  if (state === 'output-error') return <p className="text-danger">{TOOL_ERROR_MESSAGE}</p>;
  if (state === 'input-streaming')
    return <p className="font-mono text-xs text-muted-foreground">{STREAMING_LABEL}</p>;
  return null;
};

// Plain-text placeholders: slices 8, 10 and 11 replace them with real components.

export const ClarificationPreview = ({ part }: { part: ToolPart<'askClarification'> }) => {
  const input: DeepPartial<Clarification> | undefined = part.input;
  return (
    <div className="flex flex-col gap-1">
      <p className="font-medium">{input?.question}</p>
      <ul className="flex flex-wrap gap-x-3 text-muted-foreground">
        {input?.goals?.map((goal, index) => (
          <li key={goal?.id ?? index}>
            {goal?.emoji} {goal?.label}
          </li>
        ))}
      </ul>
      <ToolStatus state={part.state} />
    </div>
  );
};

export const ComparisonPreview = ({ part }: { part: ToolPart<'renderComparison'> }) => {
  const input: DeepPartial<Comparison> | undefined = part.input;
  const [a, b] = input?.options ?? [];
  return (
    <div className="flex flex-col gap-1">
      <p className="font-medium">{input?.title}</p>
      <p className="text-muted-foreground">
        {a?.emoji} {a?.name} vs {b?.emoji} {b?.name}
      </p>
      {input?.isRelevant === false && <p>{input.fallbackReason}</p>}
      <p>{input?.verdict?.summary}</p>
      <ToolStatus state={part.state} />
    </div>
  );
};

export const FallbackPreview = ({ part }: { part: ToolPart<'renderFallbackChips'> }) => {
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
