import type { PresetId } from '@/lib/presets';

import { type PresetReplay, PresetReplaySchema } from './fixtures';

type FixtureLoader = () => Promise<{ default: unknown }>;

/** Dynamic imports: each ~10 KB fixture is fetched only when its replay starts. */
const LOADERS: Record<PresetId, FixtureLoader> = {
  'coffee-vs-smoothie': () => import('./fixtures/coffee-vs-smoothie.json'),
  'claude-vs-groq': () => import('./fixtures/claude-vs-groq.json'),
  'christmas-vs-new-year': () => import('./fixtures/christmas-vs-new-year.json'),
  'python-vs-typescript': () => import('./fixtures/python-vs-typescript.json'),
};

export const hasReplay = (presetId: string): presetId is PresetId => presetId in LOADERS;

/** The recorded battle for a preset, validated so a broken fixture fails loudly in tests. */
export const loadReplay = async (presetId: PresetId): Promise<PresetReplay> => {
  const { default: data } = await LOADERS[presetId]();
  return PresetReplaySchema.parse(data);
};
