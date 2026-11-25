import { faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';

import { MAX_SCORE, MAX_WEIGHT, MIN_WEIGHT } from '@/lib/ai/schemas';
import { makeCriterion, makeWeight } from '@/test/factories';

import { clampWeight, computeScores, pickLeader } from './scoring';

const RUNS = 50;

const makeBattle = () => {
  const criteria = faker.helpers.multiple(() => makeCriterion(), { count: { min: 1, max: 5 } });
  const weights = criteria.map(() => makeWeight());
  return { criteria, weights };
};

describe('computeScores', () => {
  it('always returns integers within 0–100 for random battles', () => {
    for (let run = 0; run < RUNS; run += 1) {
      // Arrange
      const { criteria, weights } = makeBattle();

      // Act
      const { a, b } = computeScores(criteria, weights);

      // Assert
      [a, b].forEach((score) => {
        expect(score).toBe(Math.round(score));
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      });
    }
  });

  it('is invariant to scaling all weights by the same factor', () => {
    // Arrange
    const { criteria, weights } = makeBattle();
    const factor = faker.number.int({ min: 2, max: 9 });

    // Act
    const base = computeScores(criteria, weights);
    const scaled = computeScores(
      criteria,
      weights.map((weight) => weight * factor),
    );

    // Assert
    expect(scaled).toEqual(base);
  });

  it('swaps results when options A and B swap', () => {
    // Arrange
    const { criteria, weights } = makeBattle();
    const swapped = criteria.map((c) => ({ ...c, scoreA: c.scoreB, scoreB: c.scoreA }));

    // Act
    const original = computeScores(criteria, weights);
    const mirrored = computeScores(swapped, weights);

    // Assert
    expect(mirrored).toEqual({ a: original.b, b: original.a });
  });

  it('equals the scaled score when there is a single criterion', () => {
    // Arrange
    const criterion = makeCriterion();

    // Act
    const result = computeScores([criterion], [makeWeight()]);

    // Assert
    expect(result).toEqual({
      a: (criterion.scoreA * 100) / MAX_SCORE,
      b: (criterion.scoreB * 100) / MAX_SCORE,
    });
  });

  it('lets a heavier weight pull the result toward that criterion', () => {
    // Arrange
    const criteria = [makeCriterion({ scoreA: 10 }), makeCriterion({ scoreA: 0 })];

    // Act
    const favorFirst = computeScores(criteria, [MAX_WEIGHT, MIN_WEIGHT]);
    const favorSecond = computeScores(criteria, [MIN_WEIGHT, MAX_WEIGHT]);

    // Assert
    expect(favorFirst.a).toBeGreaterThan(favorSecond.a);
  });

  it('returns zeros for empty criteria or zero total weight', () => {
    // Arrange
    const criteria = [makeCriterion()];

    // Act
    const empty = computeScores([], []);
    const weightless = computeScores(criteria, [0]);
    const missingWeights = computeScores(criteria, []);

    // Assert
    expect(empty).toEqual({ a: 0, b: 0 });
    expect(weightless).toEqual({ a: 0, b: 0 });
    expect(missingWeights).toEqual({ a: 0, b: 0 });
  });
});

describe('pickLeader', () => {
  it('returns the side with the higher score', () => {
    // Arrange
    const low = faker.number.int({ min: 0, max: 49 });
    const high = faker.number.int({ min: 50, max: 100 });

    // Act
    const aWins = pickLeader({ a: high, b: low });
    const bWins = pickLeader({ a: low, b: high });

    // Assert
    expect(aWins).toBe('a');
    expect(bWins).toBe('b');
  });

  it('returns null on a tie', () => {
    // Arrange
    const score = faker.number.int({ min: 0, max: 100 });

    // Act
    const leader = pickLeader({ a: score, b: score });

    // Assert
    expect(leader).toBeNull();
  });
});

describe('clampWeight', () => {
  it('keeps any number within the allowed integer range', () => {
    for (let run = 0; run < RUNS; run += 1) {
      // Arrange
      const raw = faker.number.float({ min: -100, max: 100 });

      // Act
      const weight = clampWeight(raw);

      // Assert
      expect(weight).toBe(Math.round(weight));
      expect(weight).toBeGreaterThanOrEqual(MIN_WEIGHT);
      expect(weight).toBeLessThanOrEqual(MAX_WEIGHT);
    }
  });

  it('leaves valid weights unchanged', () => {
    // Arrange
    const weight = makeWeight();

    // Act
    const result = clampWeight(weight);

    // Assert
    expect(result).toBe(weight);
  });
});
