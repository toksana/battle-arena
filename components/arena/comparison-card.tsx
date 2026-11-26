import type { DeepPartial } from 'ai';

import { Skeleton } from '@/components/ui/skeleton';
import type { Comparison } from '@/lib/ai/schemas';
import { isCriterionReady, presentItems } from '@/lib/comparison-view';

import { CriterionBar } from './criterion-bar';
import { OptionCard } from './option-card';
import { Reveal } from './reveal';

export const CONFIDENCE_LABEL = {
  low: 'Low confidence',
  medium: 'Medium confidence',
  high: 'High confidence',
} as const;

interface ComparisonCardProps {
  input: DeepPartial<Comparison> | undefined;
  isStreaming: boolean;
}

const CardHeader = ({ input, isStreaming }: ComparisonCardProps) => (
  <header className="flex flex-wrap items-baseline justify-between gap-2">
    {input?.title ? (
      <h3 className="text-lg font-semibold tracking-tight">{input.title}</h3>
    ) : (
      isStreaming && <Skeleton className="h-7 w-1/2" />
    )}
    {input?.goal && (
      <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">
        Goal: {input.goal}
      </span>
    )}
  </header>
);

const OptionsGrid = ({ input, isStreaming }: ComparisonCardProps) => {
  const [a, b] = input?.options ?? [];
  return (
    <div className="relative grid grid-cols-1 gap-3 md:grid-cols-2">
      <OptionCard option={a} side="A" isStreaming={isStreaming} />
      <span
        aria-hidden
        className="z-10 mx-auto -my-5 grid size-9 place-items-center rounded-full border border-border bg-background font-mono text-xs font-semibold md:absolute md:top-6 md:left-1/2 md:m-0 md:-translate-x-1/2"
      >
        VS
      </span>
      <OptionCard option={b} side="B" isStreaming={isStreaming} />
    </div>
  );
};

const Criteria = ({ input, isStreaming }: ComparisonCardProps) => {
  const ready = presentItems(input?.criteria).filter(isCriterionReady);
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

const Verdict = ({ verdict }: { verdict: DeepPartial<Comparison>['verdict'] }) => {
  if (!verdict?.summary) return null;
  return (
    <Reveal className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <h4 className="font-semibold">Verdict</h4>
        {verdict.confidence && (
          <span className="font-mono text-[0.7rem] text-muted-foreground">
            {CONFIDENCE_LABEL[verdict.confidence]}
          </span>
        )}
      </div>
      <p>{verdict.summary}</p>
    </Reveal>
  );
};

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

/** Renders the comparison progressively: each field appears as soon as it streams in. */
export const ComparisonCard = ({ input, isStreaming }: ComparisonCardProps) => (
  <article aria-label="Comparison" aria-busy={isStreaming} className="flex flex-col gap-3">
    {input?.isRelevant === false ? (
      <IrrelevantNotice input={input} isStreaming={isStreaming} />
    ) : (
      <>
        <CardHeader input={input} isStreaming={isStreaming} />
        <OptionsGrid input={input} isStreaming={isStreaming} />
        <Criteria input={input} isStreaming={isStreaming} />
        <Verdict verdict={input?.verdict} />
      </>
    )}
  </article>
);
