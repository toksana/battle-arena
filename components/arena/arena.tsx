'use client';

import { useState } from 'react';

import { useArenaChat } from '@/hooks/use-arena-chat';
import { isRateLimited, rateLimitResetAt } from '@/lib/chat-status';
import { PRESETS, type Preset } from '@/lib/presets';

import { BattleView } from './battle-view';
import { ChatErrorNotice } from './chat-error-notice';
import { CooldownBanner } from './cooldown-banner';
import { PresetChips } from './preset-chips';
import { PromptComposer } from './prompt-composer';

/** Wires the composer and presets to the chat: one battle on screen at a time. */
export const Arena = () => {
  const [prompt, setPrompt] = useState('');
  const {
    messages,
    error,
    hasFailed,
    isBusy,
    startBattle,
    startReplay,
    answerClarification,
    retry,
  } = useArenaChat();

  /** One click starts the battle; whatever the user typed stays in the composer. */
  const handlePreset = (preset: Preset) => startBattle(preset.prompt);

  const handleSubmit = () => {
    startBattle(prompt);
    setPrompt('');
  };

  return (
    <>
      <section className="flex flex-col gap-3">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Settle any dilemma, side by side.
        </h1>
        <p className="text-muted-foreground">
          Pick a dilemma or type your own. The agent streams a side-by-side comparison you can
          re-weigh live.
        </p>
        <PresetChips presets={PRESETS} onSelect={handlePreset} disabled={isBusy} />
      </section>
      <section aria-label="Battle canvas" className="flex flex-1 flex-col gap-4">
        {messages.length > 0 && (
          <BattleView
            messages={messages}
            onAnswer={answerClarification}
            onPickPrompt={startBattle}
            isBusy={isBusy}
          />
        )}
        {hasFailed &&
          !isBusy &&
          (isRateLimited(error) ? (
            <CooldownBanner
              resetAt={rateLimitResetAt(error)}
              replays={PRESETS}
              onReplay={startReplay}
            />
          ) : (
            <ChatErrorNotice error={error} onRetry={retry} />
          ))}
      </section>
      <div className="sticky bottom-0 -mx-4 bg-linear-to-t from-background via-background/95 to-transparent px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <PromptComposer
          value={prompt}
          onValueChange={setPrompt}
          onSubmit={handleSubmit}
          isBusy={isBusy}
        />
      </div>
    </>
  );
};
