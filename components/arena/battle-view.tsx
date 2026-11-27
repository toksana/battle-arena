import type { ArenaUIMessage, GoalAnswer } from '@/lib/ai/messages';

import { MessagePart } from './message-part';
import { PreRenderedBadge } from './pre-rendered-badge';

interface BattleViewProps {
  messages: readonly ArenaUIMessage[];
  onAnswer?: (answer: GoalAnswer) => void;
  /** A suggested dilemma was picked; the arena puts it into the composer. */
  onPickPrompt?: (prompt: string) => void;
  isBusy?: boolean;
}

const textOf = (message: ArenaUIMessage): string =>
  message.parts.flatMap((part) => (part.type === 'text' ? [part.text] : [])).join(' ');

const asksClarification = (messages: readonly ArenaUIMessage[]): boolean =>
  messages.some((message) => message.parts.some((part) => part.type === 'tool-askClarification'));

/**
 * One battle: the user's dilemma as a heading, then every assistant part in order.
 * A clarification question already names both options, so it replaces the dilemma heading.
 */
export const BattleView = ({
  messages,
  onAnswer,
  onPickPrompt,
  isBusy = false,
}: BattleViewProps) => {
  const dilemma = messages.find((message) => message.role === 'user');
  const replies = messages.filter((message) => message.role === 'assistant');
  const isPreRendered = dilemma?.metadata?.replayPresetId !== undefined;
  const showsDilemma = dilemma !== undefined && !asksClarification(replies);

  return (
    <article aria-label="Current battle" className="flex flex-col gap-4">
      {showsDilemma && (
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-semibold break-words">{textOf(dilemma)}</h2>
          {isPreRendered && <PreRenderedBadge />}
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
            isPreRendered={isPreRendered}
          />
        )),
      )}
    </article>
  );
};
