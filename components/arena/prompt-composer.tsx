'use client';

import { ArrowUp } from 'lucide-react';
import { type FormEvent, type KeyboardEvent, useId } from 'react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PROMPT_LIMIT, promptLength, promptLengthTone } from '@/lib/prompt-limit';

import { CharCounter } from './char-counter';

export const PROMPT_LABEL = 'Describe your dilemma';
export const SEND_LABEL = 'Start battle';

interface PromptComposerProps {
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
  /** True while a battle is streaming: typing stays allowed, sending does not. */
  isBusy?: boolean;
  limit?: number;
}

/** Enter submits, Shift+Enter adds a line, and IME composition is left alone. */
const isSubmitKey = (event: KeyboardEvent<HTMLTextAreaElement>): boolean =>
  event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing;

export const PromptComposer = ({
  value,
  onValueChange,
  onSubmit,
  isBusy = false,
  limit = PROMPT_LIMIT,
}: PromptComposerProps) => {
  const id = useId();
  const promptId = `${id}-prompt`;
  const counterId = `${id}-counter`;
  const length = promptLength(value);
  const tone = promptLengthTone(length, limit);
  const isOverLimit = tone === 'over';
  const canSubmit = length > 0 && !isBusy && !isOverLimit;

  const submitIfAllowed = () => {
    if (canSubmit) onSubmit();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitIfAllowed();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!isSubmitKey(event)) return;
    event.preventDefault();
    submitIfAllowed();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      {isOverLimit && (
        <p
          role="status"
          className="w-fit rounded-lg border border-danger/40 bg-danger/10 px-3 py-1 text-xs text-danger"
        >
          Too long for one battle ({limit} chars max). Trim it to the two options and a goal.
        </p>
      )}
      <div className="flex flex-col rounded-xl border bg-card p-2 shadow-sm backdrop-blur-md transition-shadow focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/40">
        <label htmlFor={promptId} className="sr-only">
          {PROMPT_LABEL}
        </label>
        {/* Text stays 16px below md so Safari on iPhone does not zoom in on focus. */}
        <Textarea
          id={promptId}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. Tea vs. coffee for a late-night coding session"
          rows={1}
          aria-invalid={isOverLimit}
          aria-describedby={tone === 'hidden' ? undefined : counterId}
          className="max-h-32 min-h-10 min-w-0 resize-none border-0 bg-transparent px-1 shadow-none focus-visible:ring-0 aria-invalid:ring-0 dark:bg-transparent"
        />
        <div className="flex items-center justify-end gap-3 pt-1">
          <CharCounter id={counterId} length={length} limit={limit} tone={tone} />
          <Button type="submit" size="icon-sm" disabled={!canSubmit} aria-label={SEND_LABEL}>
            <ArrowUp />
          </Button>
        </div>
      </div>
    </form>
  );
};
