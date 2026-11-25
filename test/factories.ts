import { faker } from '@faker-js/faker';

import {
  MAX_SCORE,
  MAX_WEIGHT,
  MIN_SCORE,
  MIN_WEIGHT,
  type Comparison,
  type Criterion,
  type Option,
} from '@/lib/ai/schemas';

const short = (max: number): string => faker.lorem.words(2).slice(0, max);

export const makeScore = (): number => faker.number.int({ min: MIN_SCORE, max: MAX_SCORE });

export const makeWeight = (): number => faker.number.int({ min: MIN_WEIGHT, max: MAX_WEIGHT });

export const makeCriterion = (overrides: Partial<Criterion> = {}): Criterion => ({
  label: short(20),
  defaultWeight: makeWeight(),
  scoreA: makeScore(),
  scoreB: makeScore(),
  rationale: faker.lorem.sentence().slice(0, 100),
  ...overrides,
});

export const makeOption = (overrides: Partial<Option> = {}): Option => ({
  name: faker.commerce.product().slice(0, 40),
  emoji: '☕',
  tagline: faker.lorem.sentence().slice(0, 80),
  metrics: [{ label: 'Calories', value: `${faker.number.int(400)} kcal` }],
  pros: [faker.lorem.sentence().slice(0, 80)],
  cons: [faker.lorem.sentence().slice(0, 80)],
  ...overrides,
});

export const makeComparison = (overrides: Partial<Comparison> = {}): Comparison => ({
  isRelevant: true,
  fallbackReason: null,
  title: 'Coffee vs. Smoothie',
  goal: short(40),
  options: [makeOption(), makeOption()],
  criteria: faker.helpers.multiple(() => makeCriterion(), { count: { min: 3, max: 5 } }),
  verdict: { summary: faker.lorem.sentence().slice(0, 240), confidence: 'medium' },
  ...overrides,
});
