'use client';

import { motion } from 'motion/react';

import { type ReadyCriterion, scorePercent } from '@/lib/comparison-view';

const BAR_DURATION_S = 0.5;

interface ScoreBarProps {
  side: 'A' | 'B';
  score: number;
}

const ScoreBar = ({ side, score }: ScoreBarProps) => (
  <div className="flex items-center gap-2">
    <span className="w-3 font-mono text-[0.65rem] text-muted-foreground">{side}</span>
    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
      <motion.div
        className={`h-full rounded-full ${side === 'A' ? 'bg-side-a' : 'bg-side-b'}`}
        initial={{ width: 0 }}
        animate={{ width: `${scorePercent(score)}%` }}
        transition={{ duration: BAR_DURATION_S, ease: 'easeOut' }}
      />
    </div>
    <span className="w-5 text-right font-mono text-xs tabular-nums">{score}</span>
  </div>
);

/** One criterion: both scores side by side so the gap is readable at a glance. */
export const CriterionBar = ({ criterion }: { criterion: ReadyCriterion }) => (
  <div className="flex flex-col gap-1.5">
    <span className="font-medium">{criterion.label}</span>
    <ScoreBar side="A" score={criterion.scoreA} />
    <ScoreBar side="B" score={criterion.scoreB} />
  </div>
);
