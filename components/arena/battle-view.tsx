import type { ArenaUIMessage, GoalAnswer } from '@/lib/ai/messages';

import { MessagePart } from './message-part';

interface BattleViewProps {
  messages: readonly ArenaUIMessage[];
  onAnswer?: (answer: GoalAnswer) => void;
  /** A suggested dilemma was picked; the arena puts it into the composer. */
  onPickPrompt?: (prompt: string) => void;
  isBusy?: boolean;
}

/** Marks a replayed battle so nobody mistakes the recording for a live model answer. */
export const PRE_RENDERED_LABEL = 'Pre-rendered';

const textOf = (message: ArenaUIMessage): string =>
  message.parts.flatMap((part) => (part.type === 'text' ? [part.text] : [])).join(' ');

/** One battle: the user's dilemma as a heading, then every assistant part in order. */
export const BattleView = ({
  messages,
  onAnswer,
  onPickPrompt,
  isBusy = false,
}: BattleViewProps) => {
  const dilemma = messages.find((message) => message.role === 'user');
  const replies = messages.filter((message) => message.role === 'assistant');

  return (
    <article aria-label="Current battle" className="flex flex-col gap-4">
      {dilemma && (
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-semibold break-words">{textOf(dilemma)}</h2>
          {dilemma.metadata?.replayPresetId && (
            <span className="rounded-full border border-border px-2 py-0.5 font-mono text-[0.65rem] text-muted-foreground uppercase">
              {PRE_RENDERED_LABEL}
            </span>
          )}
        </div>
      )}
      {replies.flatMap((message) =>
        message.parts.map((part, index) => (
          <MessagePart
            key={`${message.id}-${index}`}
            part={part}
            onAnswer={onAnswer}
            onPickPrompt={onPickPrompt}
            isBusy={isBusy}
          />
        )),
      )}
    </article>
  );
};
