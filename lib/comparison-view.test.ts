import { faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';

import { MAX_SCORE, MIN_SCORE } from '@/lib/ai/schemas';
import { makeCriterion, makeOutcome, makeScore } from '@/test/factories';

import { isCriterionReady, presentItems, scorePercent, verdictFor } from './comparison-view';

describe('presentItems', () => {
  it('drops holes and keeps order', () => {
    // Arrange
    const words = faker.helpers.multiple(() => faker.lorem.word(), { count: 3 });

    // Act
    const items = presentItems([words[0], undefined, words[1], undefined, words[2]]);

    // Assert
    expect(items).toEqual(words);
  });

  it.each([undefined, []])('returns an empty list for %s', (input) => {
    // Act
    const items = presentItems(input);

    // Assert
    expect(items).toEqual([]);
  });
});

describe('scorePercent', () => {
  it('maps the score range onto 0–100', () => {
    // Act
    const bounds = [scorePercent(MIN_SCORE), scorePercent(MAX_SCORE)];

    // Assert
    expect(bounds).toEqual([0, 100]);
  });

  it('stays inside 0–100 and grows with the score for any value', () => {
    // Arrange
    const scores = faker.helpers.multiple(() => faker.number.float({ min: -50, max: 50 }), {
      count: 50,
    });

    // Act
    const sorted = [...scores].sort((x, y) => x - y).map(scorePercent);

    // Assert
    sorted.forEach((percent, index) => {
      expect(percent).toBeGreaterThanOrEqual(0);
      expect(percent).toBeLessThanOrEqual(100);
      expect(percent).toBeGreaterThanOrEqual(sorted[index - 1] ?? 0);
    });
  });

  it('is proportional inside the range', () => {
    // Arrange
    const score = makeScore();

    // Act
    const percent = scorePercent(score);

    // Assert
    expect(percent).toBeCloseTo(((score - MIN_SCORE) / (MAX_SCORE - MIN_SCORE)) * 100);
  });
});

describe('isCriterionReady', () => {
  it('accepts a criterion with label, weight and both scores', () => {
    // Arrange
    const { label, defaultWeight, scoreA, scoreB } = makeCriterion();

    // Act
    const ready = isCriterionReady({ label, defaultWeight, scoreA, scoreB });

    // Assert
    expect(ready).toBe(true);
  });

  it('accepts a zero score', () => {
    // Act
    const ready = isCriterionReady(makeCriterion({ scoreA: 0, scoreB: 0 }));

    // Assert
    expect(ready).toBe(true);
  });

  it.each(['label', 'defaultWeight', 'scoreA', 'scoreB'] as const)(
    'rejects a criterion missing %s',
    (field) => {
      // Arrange
      const criterion = { ...makeCriterion(), [field]: undefined };

      // Act
      const ready = isCriterionReady(criterion);

      // Assert
      expect(ready).toBe(false);
    },
  );

  it('rejects a hole in the array', () => {
    // Act
    const ready = isCriterionReady(undefined);

    // Assert
    expect(ready).toBe(false);
  });
});

describe('verdictFor', () => {
  it.each([
    ['a', 'ifA'],
    ['b', 'ifB'],
  ] as const)('picks the outcome for leader %s', (leader, key) => {
    // Arrange
    const verdict = { ifA: makeOutcome(), ifB: makeOutcome() };

    // Act
    const outcome = verdictFor(verdict, leader);

    // Assert
    expect(outcome).toBe(verdict[key]);
  });

  it('has no outcome on a tie', () => {
    // Arrange
    const verdict = { ifA: makeOutcome(), ifB: makeOutcome() };

    // Act
    const outcome = verdictFor(verdict, null);

    // Assert
    expect(outcome).toBeUndefined();
  });

  it('tolerates a verdict that has not streamed in yet', () => {
    // Act
    const outcomes = [verdictFor(undefined, 'a'), verdictFor({ ifA: makeOutcome() }, 'b')];

    // Assert
    expect(outcomes).toEqual([undefined, undefined]);
  });
});
