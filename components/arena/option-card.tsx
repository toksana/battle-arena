import type { DeepPartial } from 'ai';
import { Check, X } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import type { Option } from '@/lib/ai/schemas';
import { presentItems } from '@/lib/comparison-view';

import { Reveal } from './reveal';

interface OptionCardProps {
  option: DeepPartial<Option> | undefined;
  side: 'A' | 'B';
  isStreaming: boolean;
}

const OptionHeader = ({ option, side, isStreaming }: OptionCardProps) => (
  <header className="flex flex-col gap-1">
    <span className="font-mono text-[0.65rem] tracking-widest text-muted-foreground uppercase">
      Option {side}
    </span>
    {option?.name ? (
      <h3 className="flex items-center gap-2 text-base font-semibold break-words">
        <span aria-hidden>{option.emoji}</span>
        {option.name}
      </h3>
    ) : (
      isStreaming && <Skeleton className="h-6 w-2/3" />
    )}
    {option?.tagline ? (
      <p className="text-muted-foreground">{option.tagline}</p>
    ) : (
      isStreaming && <Skeleton className="h-4 w-full" />
    )}
  </header>
);

const Metrics = ({ metrics }: { metrics: DeepPartial<Option>['metrics'] }) => {
  const items = presentItems(metrics).filter((metric) => metric.label);
  if (items.length === 0) return null;
  return (
    <dl className="grid grid-cols-2 gap-2">
      {items.map((metric, index) => (
        <Reveal key={index} className="rounded-md bg-muted/40 px-2.5 py-1.5">
          <dt className="text-[0.7rem] text-muted-foreground">{metric.label}</dt>
          <dd className="font-mono text-xs">{metric.value}</dd>
        </Reveal>
      ))}
    </dl>
  );
};

interface PointListProps {
  label: string;
  points: ReadonlyArray<string | undefined> | undefined;
  tone: 'pro' | 'con';
}

const PointList = ({ label, points, tone }: PointListProps) => {
  const items = presentItems(points);
  if (items.length === 0) return null;
  const Icon = tone === 'pro' ? Check : X;
  return (
    <ul aria-label={label} className="flex flex-col gap-1.5">
      {items.map((point, index) => (
        <Reveal as="li" key={index} className="flex gap-2">
          <Icon
            aria-hidden
            className={`mt-0.5 size-3.5 shrink-0 ${tone === 'pro' ? 'text-success' : 'text-danger'}`}
          />
          <span>{point}</span>
        </Reveal>
      ))}
    </ul>
  );
};

export const OptionCard = ({ option, side, isStreaming }: OptionCardProps) => (
  <section
    aria-label={option?.name ?? `Option ${side}`}
    className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4"
  >
    <OptionHeader option={option} side={side} isStreaming={isStreaming} />
    <Metrics metrics={option?.metrics} />
    <PointList label="Pros" points={option?.pros} tone="pro" />
    <PointList label="Cons" points={option?.cons} tone="con" />
  </section>
);
