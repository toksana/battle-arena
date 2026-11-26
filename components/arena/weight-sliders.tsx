'use client';

import { RotateCcw } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { MAX_WEIGHT, MIN_WEIGHT } from '@/lib/ai/schemas';

export const RESET_WEIGHTS_LABEL = 'Reset weights';

interface WeightSliderProps {
  label: string;
  weight: number;
  onChange: (weight: number) => void;
}

const WeightSlider = ({ label, weight, onChange }: WeightSliderProps) => (
  <li className="grid grid-cols-[minmax(0,7rem)_1fr_1.5rem] items-center gap-3">
    <span className="truncate">{label}</span>
    <Slider
      thumbLabel={`${label} weight`}
      min={MIN_WEIGHT}
      max={MAX_WEIGHT}
      step={1}
      value={[weight]}
      onValueChange={([next]) => onChange(next ?? weight)}
    />
    <span className="text-right font-mono text-xs tabular-nums">{weight}</span>
  </li>
);

interface WeightSlidersProps {
  id: string;
  /** Rendered above the sliders, e.g. the live score summary. */
  header?: ReactNode;
  labels: readonly string[];
  weights: readonly number[];
  canReset: boolean;
  onChange: (index: number, weight: number) => void;
  onReset: () => void;
}

/** One slider per criterion; scores and the leader update instantly, no model call. */
export const WeightSliders = ({
  id,
  header,
  labels,
  weights,
  canReset,
  onChange,
  onReset,
}: WeightSlidersProps) => (
  <div id={id} className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
    {header}
    <ul aria-label="Criterion weights" className="flex flex-col gap-4">
      {labels.map((label, index) => (
        <WeightSlider
          key={index}
          label={label}
          weight={weights[index] ?? MIN_WEIGHT}
          onChange={(weight) => onChange(index, weight)}
        />
      ))}
    </ul>
    <Button variant="ghost" size="sm" className="self-end" disabled={!canReset} onClick={onReset}>
      <RotateCcw aria-hidden />
      {RESET_WEIGHTS_LABEL}
    </Button>
  </div>
);
