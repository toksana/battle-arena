import { cn } from 'cn';

import type { PromptLengthTone } from '@/lib/prompt-limit';

// A soft tint per tone, so the numbers read as a status badge rather than stray text.
const TONE_CLASS: Record<PromptLengthTone, string> = {
  hidden: 'bg-muted text-muted-foreground opacity-0',
  visible: 'bg-muted text-muted-foreground',
  near: 'bg-warning/15 text-warning',
  over: 'bg-danger/15 font-medium text-danger',
};

interface CharCounterProps {
  id: string;
  length: number;
  limit: number;
  tone: PromptLengthTone;
}

/** "185 / 200" pill; fades in near the limit. Tabular digits keep its width steady. */
export const CharCounter = ({ id, length, limit, tone }: CharCounterProps) => (
  <span
    id={id}
    aria-hidden={tone === 'hidden'}
    className={cn(
      'rounded-full px-2 py-0.5 font-mono text-xs tabular-nums transition-[opacity,color,background-color] duration-300',
      TONE_CLASS[tone],
    )}
  >
    {length} / {limit}
  </span>
);
