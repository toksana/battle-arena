import type { DeepPartial } from 'ai';
import { CircleSlash } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import type { ArenaToolPart } from '@/lib/ai/messages';
import type { FallbackChips } from '@/lib/ai/schemas';
import { toFallbackPresets } from '@/lib/fallback-chips';
import type { Preset } from '@/lib/presets';

import { PresetChips } from './preset-chips';

export const FALLBACK_CHIPS_LABEL = 'Suggested dilemmas';

interface FallbackChipsCardProps {
  part: ArenaToolPart<'renderFallbackChips'>;
  onPick?: (prompt: string) => void;
  /** True while a request is in flight: chips stay visible but cannot be picked. */
  disabled?: boolean;
}

/** Out-of-scope requests: a neutral one-liner plus safe dilemmas derived from the user's topic. */
export const FallbackChipsCard = ({ part, onPick, disabled = false }: FallbackChipsCardProps) => {
  const input: DeepPartial<FallbackChips> | undefined = part.input;
  const isStreaming = part.state === 'input-streaming';
  const chips = toFallbackPresets(input?.prompts);

  return (
    <section
      aria-label="Out of scope"
      aria-busy={isStreaming}
      className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
    >
      {input?.message ? (
        <p className="flex items-start gap-2">
          <CircleSlash aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          {input.message}
        </p>
      ) : (
        <Skeleton className="h-5 w-3/4" />
      )}
      {chips.length > 0 ? (
        <PresetChips
          presets={chips}
          label={FALLBACK_CHIPS_LABEL}
          disabled={disabled || isStreaming}
          onSelect={(preset: Preset) => onPick?.(preset.prompt)}
        />
      ) : (
        isStreaming && <Skeleton className="h-8 w-2/3 rounded-full" />
      )}
    </section>
  );
};
