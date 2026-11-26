'use client';

import { Button } from '@/components/ui/button';
import type { Preset } from '@/lib/presets';

interface PresetChipsProps {
  presets: readonly Preset[];
  /** Accessible name of the list, so several chip rows on one page stay distinguishable. */
  label?: string;
  onSelect?: (preset: Preset) => void;
  disabled?: boolean;
}

export const PresetChips = ({
  presets,
  label = 'Preset dilemmas',
  onSelect,
  disabled,
}: PresetChipsProps) => (
  <ul
    aria-label={label}
    className="-mx-4 flex snap-x scroll-px-4 [scrollbar-width:none] gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
  >
    {presets.map((preset) => (
      <li key={preset.id} className="shrink-0 snap-start">
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => onSelect?.(preset)}
          className="rounded-full border-border bg-card/60 text-xs hover:border-primary/60"
        >
          {preset.emoji && <span aria-hidden>{preset.emoji}</span>}
          {preset.label}
        </Button>
      </li>
    ))}
  </ul>
);
