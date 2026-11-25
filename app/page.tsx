import { Header } from '@/components/arena/header';
import { PresetChips } from '@/components/arena/preset-chips';
import { PRESETS } from '@/lib/presets';

const Home = () => (
  <>
    <Header />
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6">
      <section className="flex flex-col gap-3">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Settle any dilemma, side by side.
        </h1>
        <p className="text-muted-foreground">
          Pick a dilemma or type your own. The agent streams a side-by-side comparison you can
          re-weigh live.
        </p>
        <PresetChips presets={PRESETS} />
      </section>
      <section
        aria-label="Battle canvas"
        className="grid flex-1 place-items-center rounded-xl border border-dashed border-border bg-card/40 p-8 text-center text-muted-foreground"
      >
        <p className="font-mono text-xs">awaiting_dilemma…</p>
      </section>
    </main>
  </>
);

export default Home;
