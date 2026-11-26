import { expect, test } from '@playwright/test';

import { startPresetBattle } from './helpers';

/**
 * Real model, real tokens: skipped by default (grepInvert in playwright.config.ts).
 * Run with `pnpm test:e2e:live` when AI Gateway credentials are available.
 * Asserts structure only, since the model's wording changes from run to run.
 */
test(
  'a live preset battle streams a clarification and a comparison',
  { tag: '@live' },
  async ({ page }) => {
    test.skip(process.env.E2E_LIVE !== '1', 'live tests spend tokens: run pnpm test:e2e:live');
    test.setTimeout(90_000);
    await page.goto('/');
    await startPresetBattle(page, 'Coffee vs. Smoothie');

    const goals = page
      .getByRole('region', { name: 'Choose a goal' })
      .getByRole('list')
      .getByRole('button');
    await expect(goals).toHaveCount(3, { timeout: 30_000 });
    await expect(goals.first()).toBeEnabled();
    await goals.first().click();

    const card = page.getByRole('article', { name: 'Comparison' });
    await expect(card).toHaveAttribute('aria-busy', 'false', { timeout: 45_000 });
    await expect(card.getByText(/^Score \d+ of 100$/)).toHaveCount(2);
  },
);
