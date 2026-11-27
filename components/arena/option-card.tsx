import type { DeepPartial } from 'ai';
import { Check, X } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import type { Option } from '@/lib/ai/schemas';
import { presentItems } from '@/lib/comparison-view';
import { cn } from '@/lib/utils';

import { AnimatedScore } from './animated-score';
import { Reveal } from './reveal';

export const LEADING_LABEL = 'Leading';

interface OptionCardProps {
  option: DeepPartial<Option> | undefined;
  side: 'A' | 'B';
  isStreaming: boolean;
  /** Weighted 0–100 score; undefined until the comparison has finished streaming. */
  score?: number;
  isLeader?: boolean;
}

const SideLabel = ({ side, isLeader }: Pick<OptionCardProps, 'side' | 'isLeader'>) => (
  <div className="flex items-center gap-2">
    <span
      aria-hidden
      className={cn('size-2 rounded-full', side === 'A' ? 'bg-side-a' : 'bg-side-b')}
    />
    <span className="font-mono text-[0.65rem] tracking-widest text-muted-foreground uppercase">
      Option {side}
    </span>
    {isLeader && (
      <Reveal className="rounded-full bg-success/15 px-2 py-0.5 text-[0.65rem] font-medium text-success">
        {LEADING_LABEL}
      </Reveal>
    )}
  </div>
);

const OptionHeader = ({ option, side, isStreaming, score, isLeader }: OptionCardProps) => (
  <header className="flex flex-col gap-1">
    <div className="flex items-start justify-between gap-3">
      <SideLabel side={side} isLeader={isLeader} />
      {score !== undefined && <AnimatedScore score={score} />}
    </div>
    {option?.name ? (
      <h3 className="flex items-center gap-2 text-base font-semibold break-words">
        <span aria-hidden>{option.emoji}</span>
        {option.name}
      </h3>
    ) : (
      isStreaming && <Skeleton className="h-6 w-2/3" />
    )}
    {option?.nickname ? (
      <p className="text-muted-foreground italic">“{option.nickname}”</p>
    ) : (
      isStreaming && <Skeleton className="h-4 w-1/2" />
    )}
  </header>
);

/** One row per stat: the honest number in mono, the joke beside it in muted text. */
const Stats = ({ stats }: { stats: DeepPartial<Option>['stats'] }) => {
  const items = presentItems(stats).filter((stat) => stat.label);
  if (items.length === 0) return null;
  return (
    <dl className="flex flex-col gap-1.5">
      {items.map((stat, index) => (
        <Reveal key={index} className="flex flex-wrap items-baseline gap-x-2">
          <dt className="text-[0.7rem] text-muted-foreground">{stat.label}</dt>
          <dd className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-mono text-xs">{stat.value}</span>
            {stat.quip && <span className="text-xs text-muted-foreground">({stat.quip})</span>}
          </dd>
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

/** The leader gets the emerald border and pale fill; a tie leaves both cards neutral. */
export const OptionCard = (props: OptionCardProps) => (
  <section
    aria-label={props.option?.name ?? `Option ${props.side}`}
    data-leader={props.isLeader ? 'true' : undefined}
    className={cn(
      'flex flex-col gap-4 rounded-xl border bg-card p-4 transition-[border-color,background-color,box-shadow] duration-300',
      props.isLeader
        ? 'border-success/70 bg-success/[0.06] shadow-[0_0_24px_-8px] shadow-success/40'
        : 'border-border',
    )}
  >
    <OptionHeader {...props} />
    <Stats stats={props.option?.stats} />
    <PointList label="Pros" points={props.option?.pros} tone="pro" />
    <PointList label="Cons" points={props.option?.cons} tone="con" />
  </section>
);
