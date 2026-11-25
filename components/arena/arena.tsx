'use client';

import { useState } from 'react';

import { PRESETS, type Preset } from '@/lib/presets';

import { PresetChips } from './preset-chips';
import { PromptComposer } from './prompt-composer';

/** Wires the composer and presets; the chat transport is plugged in by a later slice. */
export const Arena = () => {
  const [prompt, setPrompt] = useState('');

  const handlePreset = (preset: Preset) => setPrompt(preset.prompt);

  const handleSubmit = () => {
    // Battle submission is wired to useChat in the next slice.
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
        <PresetChips presets={PRESETS} onSelect={handlePreset} />
      </section>
      <section
        aria-label="Battle canvas"
        className="grid flex-1 place-items-center rounded-xl border border-dashed border-border bg-card/40 p-8 text-center text-muted-foreground"
      >
        <p className="font-mono text-xs">awaiting_dilemma…</p>
      </section>
      <div className="sticky bottom-0 -mx-4 bg-linear-to-t from-background via-background/95 to-transparent px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <PromptComposer value={prompt} onValueChange={setPrompt} onSubmit={handleSubmit} />
      </div>
    </>
  );
};
