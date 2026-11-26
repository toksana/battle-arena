import type { DeepPartial } from 'ai';
import { Check } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import type { ArenaToolPart, GoalAnswer } from '@/lib/ai/messages';
import { GOAL_COUNT, type Clarification } from '@/lib/ai/schemas';
import { presentItems } from '@/lib/comparison-view';
import { cn } from '@/lib/utils';

import { Reveal } from './reveal';

type Goal = Clarification['goals'][number];

interface ClarificationCardProps {
  part: ArenaToolPart<'askClarification'>;
  onAnswer?: (answer: GoalAnswer) => void;
  /** True while a request is in flight: goals stay visible but cannot be picked. */
  disabled?: boolean;
}

interface GoalButtonProps {
  goal: DeepPartial<Goal>;
  isChosen: boolean;
  disabled: boolean;
  onPick: () => void;
}

const GoalButton = ({ goal, isChosen, disabled, onPick }: GoalButtonProps) => (
  <button
    type="button"
    aria-pressed={isChosen}
    disabled={disabled}
    onClick={onPick}
    className={cn(
      'flex h-full w-full flex-col items-start gap-1 rounded-xl border bg-card p-3 text-left transition-colors',
      'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
      'enabled:hover:border-primary/60 disabled:cursor-not-allowed',
      isChosen ? 'border-success/70 bg-success/[0.06]' : 'border-border disabled:opacity-60',
    )}
  >
    <span className="flex w-full items-center gap-2 font-medium">
      <span aria-hidden>{goal.emoji}</span>
      {goal.label}
      {isChosen && <Check aria-hidden className="ml-auto size-4 text-success" />}
    </span>
    {goal.hint && <span className="text-xs text-muted-foreground">{goal.hint}</span>}
  </button>
);

/** Goals whose label has not streamed in yet render as skeletons, up to GOAL_COUNT. */
const pendingSlots = (shown: number, isStreaming: boolean): number =>
  isStreaming ? Math.max(0, GOAL_COUNT - shown) : 0;

/** Human-in-the-loop step: the user's pick becomes the tool output and resumes the battle. */
export const ClarificationCard = ({ part, onAnswer, disabled = false }: ClarificationCardProps) => {
  const input: DeepPartial<Clarification> | undefined = part.input;
  const goals = presentItems(input?.goals).filter((goal) => goal.label);
  const isStreaming = part.state === 'input-streaming';
  const chosenId = part.state === 'output-available' ? part.output.goalId : undefined;
  const isLocked = disabled || isStreaming || chosenId !== undefined;

  const pick = (goal: DeepPartial<Goal>) => {
    if (isLocked || !goal.id || !goal.label) return;
    onAnswer?.({ toolCallId: part.toolCallId, goalId: goal.id, label: goal.label });
  };

  return (
    <section aria-label="Choose a goal" aria-busy={isStreaming} className="flex flex-col gap-3">
      {input?.question ? (
        <h3 className="text-base font-semibold">{input.question}</h3>
      ) : (
        <Skeleton className="h-6 w-2/3" />
      )}
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {goals.map((goal, index) => (
          <Reveal as="li" key={goal.id ?? index}>
            <GoalButton
              goal={goal}
              isChosen={goal.id === chosenId}
              disabled={isLocked}
              onPick={() => pick(goal)}
            />
          </Reveal>
        ))}
        {Array.from({ length: pendingSlots(goals.length, isStreaming) }, (_, index) => (
          <li key={`pending-${index}`}>
            <Skeleton className="h-16 w-full rounded-xl" />
          </li>
        ))}
      </ul>
    </section>
  );
};
