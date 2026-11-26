import type { Page } from '@playwright/test';

import { type Leader, computeScores, pickLeader } from '../lib/scoring';
import type { Criterion } from '../lib/ai/schemas';

export const FIVE_MINUTES_MS = 5 * 60_000;

/**
 * The one stubbed boundary: /api/chat answers 429, as Upstash would after the limit.
 * Returns a counter so tests can prove that replays never call the API.
 */
export const stubRateLimit = async (page: Page): Promise<{ calls: () => number }> => {
  let calls = 0;
  await page.route('**/api/chat', async (route) => {
    calls += 1;
    await route.fulfill({
      status: 429,
      contentType: 'application/json',
      headers: { 'Retry-After': '300' },
      json: { error: 'rate_limited', resetAt: Date.now() + FIVE_MINUTES_MS },
    });
  });
  return { calls: () => calls };
};

/** Picks a preset in the hero row and sends it, like a visitor would. */
export const startPresetBattle = async (page: Page, label: string): Promise<void> => {
  await page
    .getByRole('list', { name: 'Preset dilemmas' })
    .getByRole('button', { name: label })
    .click();
  await page.getByRole('button', { name: 'Start battle' }).click();
};

export interface LeadChange {
  criterion: Criterion;
  /** Keyboard key that moves the slider to the extreme weight. */
  key: 'Home' | 'End';
  from: Leader;
  to: Leader;
}

/** A single slider move to 1 or 5 that hands the lead to the other option, if one exists. */
export const findLeadChange = (criteria: readonly Criterion[]): LeadChange | null => {
  const defaults = criteria.map((criterion) => criterion.defaultWeight);
  const from = pickLeader(computeScores(criteria, defaults));
  const moves = criteria.flatMap((criterion, index) =>
    (['Home', 'End'] as const).map((key) => {
      const weights = defaults.map((weight, other) =>
        other === index ? (key === 'Home' ? 1 : 5) : weight,
      );
      return { criterion, key, from, to: pickLeader(computeScores(criteria, weights)) };
    }),
  );
  return moves.find((move) => move.to !== null && move.to !== from) ?? null;
};
