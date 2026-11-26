import { describe, expect, it } from 'vitest';

import { PRESETS } from '@/lib/presets';

import { hasReplay, loadReplay } from './registry';

describe('preset replays', () => {
  it.each(PRESETS.map((preset) => [preset.id, preset] as const))(
    '%s has a valid recording with one comparison per goal',
    async (id) => {
      // Act
      const replay = await loadReplay(id);

      // Assert
      expect(replay.presetId).toBe(id);
      expect(replay.comparisons.map((entry) => entry.goalId).sort()).toEqual(
        replay.clarification.goals.map((goal) => goal.id).sort(),
      );
      replay.comparisons.forEach(({ goalId, comparison }) => {
        const goal = replay.clarification.goals.find((candidate) => candidate.id === goalId);
        expect(comparison.goal).toBe(goal?.label);
        expect(comparison.isRelevant).toBe(true);
      });
    },
  );

  it('knows which presets have a recording', () => {
    // Act
    const known = PRESETS.map((preset) => hasReplay(preset.id));

    // Assert
    expect(known).toEqual(PRESETS.map(() => true));
    expect(hasReplay('not-a-preset')).toBe(false);
  });
});
