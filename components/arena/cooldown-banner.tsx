'use client';

import { Hourglass } from 'lucide-react';

import { useNow } from '@/hooks/use-now';
import { minutesUntil } from '@/lib/chat-status';
import type { Preset } from '@/lib/presets';

import { PresetChips } from './preset-chips';

export const COOLDOWN_TITLE = 'Battle Arena is cooling down!';
export const COOLDOWN_OVER = 'The cooldown is over. Start a new battle whenever you like.';
export const REPLAY_HINT = 'Meanwhile, watch a pre-rendered battle:';
export const REPLAY_CHIPS_LABEL = 'Pre-rendered examples';

const waitMessage = (resetAt: number | null, now: number): string => {
  if (resetAt === null) return 'Try again in a few minutes.';
  const minutes = minutesUntil(resetAt, now);
  if (minutes === 0) return COOLDOWN_OVER;
  return `Try again in ${minutes} min.`;
};

interface CooldownBannerProps {
  resetAt: number | null;
  /** Presets with a recorded battle; picking one replays it without the API. */
  replays?: readonly Preset[];
  onReplay?: (preset: Preset) => void;
}

/** Shown instead of the retry notice: retrying before the window frees up would fail again. */
export const CooldownBanner = ({ resetAt, replays = [], onReplay }: CooldownBannerProps) => {
  const now = useNow();
  return (
    <div
      role="status"
      className="flex flex-col gap-3 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3"
    >
      <div className="flex items-start gap-3">
        <Hourglass aria-hidden className="mt-0.5 size-4 shrink-0 text-warning" />
        <div className="flex flex-col gap-0.5">
          <p className="font-medium">{COOLDOWN_TITLE}</p>
          <p className="text-muted-foreground">{waitMessage(resetAt, now)}</p>
        </div>
      </div>
      {replays.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-muted-foreground">{REPLAY_HINT}</p>
          <PresetChips presets={replays} label={REPLAY_CHIPS_LABEL} onSelect={onReplay} />
        </div>
      )}
    </div>
  );
};
