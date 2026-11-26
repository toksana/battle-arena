import { presentItems } from '@/lib/comparison-view';
import type { Preset } from '@/lib/presets';

const FALLBACK_ID_PREFIX = 'fallback';

/**
 * Turns the model's suggested dilemmas into chips: holes and blank strings from a
 * partial stream are dropped, text is trimmed, and duplicates collapse into one chip.
 */
export const toFallbackPresets = (
  prompts: ReadonlyArray<string | undefined> | undefined,
): Preset[] =>
  [...new Set(presentItems(prompts).map((prompt) => prompt.trim()))]
    .filter((prompt) => prompt.length > 0)
    .map((prompt, index) => ({
      id: `${FALLBACK_ID_PREFIX}-${index}`,
      label: prompt,
      emoji: '',
      prompt,
    }));
