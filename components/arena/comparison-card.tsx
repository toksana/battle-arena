'use client';

import type { DeepPartial } from 'ai';
import { SlidersHorizontal } from 'lucide-react';
import { useId, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCardWeights } from '@/hooks/use-card-weights';
import type { Comparison, VerdictOutcome } from '@/lib/ai/schemas';
import {
  type ReadyCriterion,
  isCriterionReady,
  presentItems,
  verdictFor,
} from '@/lib/comparison-view';
import { type Leader, type Scores, computeScores, pickLeader } from '@/lib/scoring';

import { CriterionBar } from './criterion-bar';
import { OptionCard } from './option-card';
import { type ScoreEntry, ScoreSummary } from './score-summary';
import { Reveal } from './reveal';
import { WeightSliders } from './weight-sliders';

export const ADJUST_WEIGHTS_LABEL = 'Adjust weights';
export const PLOT_TWIST_LABEL = 'Plot twist';

/** Shown on an exact tie: the model wrote no verdict for it, the user's weights decide. */
export const TIE_VERDICT = 'Dead heat. Your weights, your call.';

interface ComparisonCardProps {
  input: DeepPartial<Comparison> | undefined;
  isStreaming: boolean;
}

/** The dilemma above is the only title; the card opens with the model's cold-open scene. */
const CardHeader = ({ input, isStreaming }: ComparisonCardProps) => (
  <header className="flex flex-wrap items-baseline justify-between gap-2">
    {input?.scene ? (
      <p className="text-base font-medium text-pretty italic">{input.scene}</p>
    ) : (
      isStreaming && <Skeleton className="h-6 w-2/3" />
    )}
    {input?.goal && (
      <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">
        Goal: {input.goal}
      </span>
    )}
  </header>
);

interface OptionsGridProps extends ComparisonCardProps {
  scores?: Scores;
  leader: Leader;
}

const OptionsGrid = ({ input, isStreaming, scores, leader }: OptionsGridProps) => {
  const [a, b] = input?.options ?? [];
  return (
    <div className="relative grid grid-cols-1 gap-3 md:grid-cols-2">
      <OptionCard
        option={a}
        side="A"
        isStreaming={isStreaming}
        score={scores?.a}
        isLeader={leader === 'a'}
      />
      <span
        aria-hidden
        className="z-10 mx-auto -my-5 grid size-9 place-items-center rounded-full border border-border bg-background font-mono text-xs font-semibold md:absolute md:top-6 md:left-1/2 md:m-0 md:-translate-x-1/2"
      >
        VS
      </span>
      <OptionCard
        option={b}
        side="B"
        isStreaming={isStreaming}
        score={scores?.b}
        isLeader={leader === 'b'}
      />
    </div>
  );
};

interface CriteriaProps extends ComparisonCardProps {
  ready: readonly ReadyCriterion[];
}

const Criteria = ({ input, isStreaming, ready }: CriteriaProps) => {
  if (ready.length === 0 && !isStreaming) return null;
  return (
    <section
      aria-label="Criteria"
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4"
    >
      {ready.map((criterion, index) => (
        <Reveal key={index}>
          <CriterionBar criterion={criterion} />
        </Reveal>
      ))}
      {isStreaming && !input?.verdict && <Skeleton className="h-10 w-full" />}
    </section>
  );
};

/** The winner call, then the condition that flips it: useful, not just a punchline. */
const OutcomeLines = ({ outcome }: { outcome: DeepPartial<VerdictOutcome> | undefined }) => {
  if (!outcome?.line) {
    return (
      <p className="flex gap-2 font-medium">
        <span aria-hidden>🤝</span>
        {TIE_VERDICT}
      </p>
    );
  }
  return (
    <>
      <p className="flex gap-2 font-medium">
        <span aria-hidden>🏆</span>
        {outcome.line}
      </p>
      {outcome.plotTwist && (
        <p className="flex gap-2 text-muted-foreground">
          <span aria-hidden>🔀</span>
          <span>
            <span className="sr-only">{PLOT_TWIST_LABEL}: </span>
            {outcome.plotTwist}
          </span>
        </p>
      )}
    </>
  );
};

interface VerdictProps {
  verdict: DeepPartial<Comparison>['verdict'];
  leader: Leader;
}

/**
 * Follows the live leader: the winner call and its plot twist swap when a slider flips the
 * lead. Keyed by leader so each swap fades in; announced politely to screen readers.
 */
const Verdict = ({ verdict, leader }: VerdictProps) => (
  <section
    aria-label="Verdict"
    aria-live="polite"
    className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4"
  >
    <h4 className="font-semibold">Verdict</h4>
    <Reveal key={leader ?? 'tie'} className="flex flex-col gap-2">
      <OutcomeLines outcome={verdictFor(verdict, leader)} />
    </Reveal>
  </section>
);

const FALLBACK_REASON = 'This battle cannot be fought.';

/** Absurd or injected dilemmas get the witty one-liner instead of fabricated facts. */
const IrrelevantNotice = ({ input, isStreaming }: ComparisonCardProps) => {
  const reason = input?.fallbackReason;
  if (!reason && isStreaming) return <Skeleton className="h-14 w-full rounded-xl" />;
  return (
    <Reveal className="rounded-xl border border-warning/40 bg-warning/10 p-4">
      <p className="font-medium">{reason ?? FALLBACK_REASON}</p>
    </Reveal>
  );
};

interface WeightsPanelProps {
  ready: readonly ReadyCriterion[];
  weights: ReturnType<typeof useCardWeights>;
  entries: readonly ScoreEntry[];
  leader: Leader;
}

/** Collapsed by default so the verdict stays the focus; opening it never calls the model. */
const WeightsPanel = ({ ready, weights, entries, leader }: WeightsPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = `${useId()}-weights`;
  return (
    <div className="flex flex-col gap-3">
      <Button
        variant="outline"
        size="sm"
        className="self-start"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((open) => !open)}
      >
        <SlidersHorizontal aria-hidden />
        {ADJUST_WEIGHTS_LABEL}
      </Button>
      {isOpen && (
        <WeightSliders
          id={panelId}
          header={<ScoreSummary entries={entries} leader={leader} />}
          labels={ready.map((criterion) => criterion.label)}
          weights={weights.weights}
          canReset={weights.isAdjusted}
          onChange={weights.setWeight}
          onReset={weights.reset}
        />
      )}
    </div>
  );
};

const scoreEntries = (input: DeepPartial<Comparison> | undefined, scores: Scores): ScoreEntry[] =>
  (['a', 'b'] as const).map((side, index) => ({
    side,
    name: input?.options?.[index]?.name ?? `Option ${side.toUpperCase()}`,
    emoji: input?.options?.[index]?.emoji ?? '',
    score: scores[side],
  }));

/** Scores and the leader appear once streaming ends, then follow the weight sliders live. */
const Battle = ({ input, isStreaming }: ComparisonCardProps) => {
  const ready = presentItems(input?.criteria).filter(isCriterionReady);
  const weights = useCardWeights(ready);
  const scores =
    isStreaming || ready.length === 0 ? undefined : computeScores(ready, weights.weights);
  const leader = scores ? pickLeader(scores) : null;

  return (
    <>
      <CardHeader input={input} isStreaming={isStreaming} />
      <OptionsGrid input={input} isStreaming={isStreaming} scores={scores} leader={leader} />
      <Criteria input={input} isStreaming={isStreaming} ready={ready} />
      {scores && <Verdict verdict={input?.verdict} leader={leader} />}
      {scores && (
        <WeightsPanel
          ready={ready}
          weights={weights}
          entries={scoreEntries(input, scores)}
          leader={leader}
        />
      )}
    </>
  );
};

/** Renders the comparison progressively: each field appears as soon as it streams in. */
export const ComparisonCard = ({ input, isStreaming }: ComparisonCardProps) => (
  <article aria-label="Comparison" aria-busy={isStreaming} className="flex flex-col gap-3">
    {input?.isRelevant === false ? (
      <IrrelevantNotice input={input} isStreaming={isStreaming} />
    ) : (
      <Battle input={input} isStreaming={isStreaming} />
    )}
  </article>
);
