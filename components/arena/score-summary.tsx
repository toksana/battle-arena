import type { Leader } from '@/lib/scoring';
import { cn } from '@/lib/utils';

export interface ScoreEntry {
  side: 'a' | 'b';
  name: string;
  emoji: string;
  score: number;
}

interface ScoreSummaryProps {
  entries: readonly ScoreEntry[];
  leader: Leader;
}

/**
 * Compact live score next to the sliders: on mobile the option cards are far above,
 * so this is where the user sees the lead change. Announced politely to screen readers.
 */
export const ScoreSummary = ({ entries, leader }: ScoreSummaryProps) => (
  <p
    aria-live="polite"
    aria-label="Current score"
    className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border pb-3"
  >
    {entries.map((entry, index) => (
      <span key={entry.side} className="flex items-center gap-3">
        {index > 0 && (
          <span aria-hidden className="text-muted-foreground">
            ·
          </span>
        )}
        <span
          data-leader={leader === entry.side ? 'true' : undefined}
          className={cn(
            'flex items-center gap-1.5',
            leader === entry.side ? 'font-semibold text-success' : 'text-muted-foreground',
          )}
        >
          <span aria-hidden>{entry.emoji}</span>
          {entry.name}
          <span className="font-mono tabular-nums">{entry.score}</span>
        </span>
      </span>
    ))}
  </p>
);
