import type { ArenaUIMessage } from '@/lib/ai/messages';

import { MessagePart } from './message-part';

interface BattleViewProps {
  messages: readonly ArenaUIMessage[];
}

const textOf = (message: ArenaUIMessage): string =>
  message.parts.flatMap((part) => (part.type === 'text' ? [part.text] : [])).join(' ');

/** One battle: the user's dilemma as a heading, then every assistant part in order. */
export const BattleView = ({ messages }: BattleViewProps) => {
  const dilemma = messages.find((message) => message.role === 'user');
  const replies = messages.filter((message) => message.role === 'assistant');

  return (
    <article aria-label="Current battle" className="flex flex-col gap-4">
      {dilemma && <h2 className="text-base font-semibold break-words">{textOf(dilemma)}</h2>}
      {replies.flatMap((message) =>
        message.parts.map((part, index) => (
          <MessagePart key={`${message.id}-${index}`} part={part} />
        )),
      )}
    </article>
  );
};
