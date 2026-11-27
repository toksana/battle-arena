import { faker } from '@faker-js/faker';

import {
  MAX_SCORE,
  MAX_CRITERIA,
  MAX_WEIGHT,
  MIN_CRITERIA,
  MIN_SCORE,
  MIN_WEIGHT,
  OPTION_COUNT,
  PRO_CON_COUNT,
  type Comparison,
  type Criterion,
  type Option,
  type Stat,
} from '@/lib/ai/schemas';

const short = (max: number): string => faker.lorem.words(2).slice(0, max);

export const makeScore = (): number => faker.number.int({ min: MIN_SCORE, max: MAX_SCORE });

export const makeWeight = (): number => faker.number.int({ min: MIN_WEIGHT, max: MAX_WEIGHT });

export const makeCriterion = (overrides: Partial<Criterion> = {}): Criterion => ({
  label: short(20),
  defaultWeight: makeWeight(),
  scoreA: makeScore(),
  scoreB: makeScore(),
  ...overrides,
});

export const makeStat = (overrides: Partial<Stat> = {}): Stat => ({
  label: short(20),
  value: `~${faker.number.int(400)} kcal`,
  quip: faker.lorem.words(3).slice(0, 40),
  ...overrides,
});

/** Distinct texts: tests look points up by text, and lorem words repeat often. */
const makePoints = (): string[] =>
  faker.helpers.uniqueArray(() => faker.lorem.sentence(5).slice(0, 50), PRO_CON_COUNT);

export const makeOption = (overrides: Partial<Option> = {}): Option => ({
  name: faker.commerce.product().slice(0, 40),
  emoji: '☕',
  nickname: `The ${faker.word.adjective()} ${faker.word.noun()}`.slice(0, 40),
  // Distinct quips so tests can find every stat by its quip.
  stats: faker.helpers
    .uniqueArray(() => faker.lorem.words(3).slice(0, 40), 2)
    .map((quip) => makeStat({ quip })),
  pros: makePoints(),
  cons: makePoints(),
  ...overrides,
});

export const makeComparison = (overrides: Partial<Comparison> = {}): Comparison => ({
  isRelevant: true,
  fallbackReason: null,
  scene: faker.lorem.sentence().slice(0, 100),
  goal: short(40),
  // Distinct names: tests look options up by name, and the product list is short.
  options: faker.helpers
    .uniqueArray(() => faker.commerce.product().slice(0, 40), OPTION_COUNT)
    .map((name) => makeOption({ name })),
  criteria: faker.helpers.multiple(() => makeCriterion(), {
    count: { min: MIN_CRITERIA, max: MAX_CRITERIA },
  }),
  verdict: { summary: faker.lorem.sentence().slice(0, 240), confidence: 'medium' },
  ...overrides,
});
