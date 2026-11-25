import { Swords } from 'lucide-react';

export const Header = () => (
  <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-md">
    <div className="mx-auto flex h-12 max-w-5xl items-center gap-2 px-4">
      <span className="grid size-7 place-items-center rounded-md bg-linear-to-br from-brand to-brand-alt">
        <Swords className="size-4 text-white" aria-hidden />
      </span>
      <span className="font-semibold tracking-tight">Battle Arena</span>
      <span className="hidden font-mono text-xs text-muted-foreground sm:inline">
        / decision engine
      </span>
    </div>
  </header>
);
