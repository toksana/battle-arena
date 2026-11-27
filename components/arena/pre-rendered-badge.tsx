/** Marks a replayed battle so nobody mistakes the recording for a live model answer. */
export const PRE_RENDERED_LABEL = 'Pre-rendered';

export const PreRenderedBadge = () => (
  <span className="rounded-full border border-border px-2 py-0.5 font-mono text-[0.65rem] text-muted-foreground uppercase">
    {PRE_RENDERED_LABEL}
  </span>
);
