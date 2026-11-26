'use client';

import { useSyncExternalStore } from 'react';

const TICK_MS = 30_000;

const subscribe = (onTick: () => void) => {
  const id = setInterval(onTick, TICK_MS);
  return () => clearInterval(id);
};

/** Rounded to the tick, so the snapshot stays stable between ticks as React requires. */
const getSnapshot = (): number => Math.floor(Date.now() / TICK_MS) * TICK_MS;

/** Server render has no clock that matters for a cooldown; 0 means "unknown". */
const getServerSnapshot = (): number => 0;

/** Current time, refreshed every 30 s: enough for a countdown in minutes. */
export const useNow = (): number => useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
