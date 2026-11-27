import { type Page, expect, test } from '@playwright/test';

import coffee from '../lib/replay/fixtures/coffee-vs-smoothie.json';
import { PROMPT_LIMIT } from '../lib/prompt-limit';

import { findLeadChange, startPresetBattle, stubRateLimit } from './helpers';

const goal = coffee.clarification.goals[1];
const recorded = coffee.comparisons.find((entry) => entry.goalId === goal.id)?.comparison;
if (!recorded) throw new Error(`coffee-vs-smoothie recording has no comparison for ${goal.id}`);

/** Rate limited → replay the Coffee vs. Smoothie recording up to the finished comparison. */
const replayCoffeeBattle = async (page: Page) => {
  const api = await stubRateLimit(page);
  await page.goto('/');
  await startPresetBattle(page, 'Coffee vs. Smoothie');

  const banner = page.getByRole('status').filter({ hasText: 'Battle Arena is cooling down!' });
  // useNow ticks on 30 s boundaries, so a 5-minute wait may read as 6 (never as less).
  await expect(banner).toContainText(/Try again in [56] min\./);
  await banner
    .getByRole('list', { name: 'Pre-rendered examples' })
    .getByRole('button', { name: 'Coffee vs. Smoothie' })
    .click();

  const goals = page.getByRole('region', { name: 'Choose a goal' });
  await expect(goals.getByRole('heading', { name: coffee.clarification.question })).toBeVisible();
  await goals.getByRole('button', { name: new RegExp(`^.?\\s*${goal.label}`) }).click();

  const card = page.getByRole('article', { name: 'Comparison' });
  await expect(card).toHaveAttribute('aria-busy', 'false');
  return { api, card };
};

test.describe('rate limited arena', () => {
  test('replays a pre-rendered battle without calling the API again', async ({ page }) => {
    const { api, card } = await replayCoffeeBattle(page);

    await expect(page.getByText('Pre-rendered', { exact: true })).toBeVisible();
    await expect(page.getByRole('status')).toHaveCount(0);
    await expect(card.getByText(`Goal: ${goal.label}`)).toBeVisible();
    for (const option of recorded.options) {
      await expect(card.getByRole('region', { name: option.name })).toContainText(
        /Score \d+ of 100/,
      );
    }
    await expect(card.getByText(recorded.scene)).toBeVisible();
    await expect(card.getByRole('region', { name: 'Verdict' })).toBeVisible();
    await expect(
      page.getByRole('region', { name: 'Choose a goal' }).getByRole('button', { pressed: true }),
    ).toContainText(goal.label);
    expect(api.calls()).toBe(1);
  });

  test('re-weighing a criterion moves the lead and the verdict to the other option', async ({
    page,
  }) => {
    const change = findLeadChange(recorded.criteria);
    if (change === null) return test.skip(true, 'the recording has no single-slider lead change');
    const { card } = await replayCoffeeBattle(page);
    const leaderName = (side: 'a' | 'b' | null) => recorded.options[side === 'a' ? 0 : 1].name;
    const verdictLine = (side: 'a' | 'b' | null) =>
      side === 'a' ? recorded.verdict.ifA.line : recorded.verdict.ifB.line;
    const verdict = card.getByRole('region', { name: 'Verdict' });

    await expect(card.locator('section[data-leader="true"]')).toHaveAccessibleName(
      leaderName(change.from),
    );
    await expect(verdict).toContainText(verdictLine(change.from));
    await card.getByRole('button', { name: 'Adjust weights' }).click();
    const slider = card.getByRole('slider', { name: `${change.criterion.label} weight` });
    await slider.focus();
    await slider.press(change.key);

    await expect(card.locator('section[data-leader="true"]')).toHaveAccessibleName(
      leaderName(change.to),
    );
    await expect(verdict).toContainText(verdictLine(change.to));
    await card.getByRole('button', { name: 'Reset weights' }).click();
    await expect(card.locator('section[data-leader="true"]')).toHaveAccessibleName(
      leaderName(change.from),
    );
  });
});

test('blocks a dilemma over the length limit before anything is sent', async ({ page }) => {
  const api = await stubRateLimit(page);
  await page.goto('/');

  await page
    .getByRole('textbox', { name: 'Describe your dilemma' })
    .fill('x'.repeat(PROMPT_LIMIT + 1));

  await expect(page.getByRole('button', { name: 'Start battle' })).toBeDisabled();
  await page.getByRole('textbox', { name: 'Describe your dilemma' }).press('Enter');
  expect(api.calls()).toBe(0);
});
