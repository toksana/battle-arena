import { faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';

import { MAX_WEIGHT, MIN_WEIGHT } from '@/lib/ai/schemas';
import { makeCriterion, makeWeight } from '@/test/factories';

import { effectiveWeights, isAdjusted, withOverride } from './weights';

const makeCriteria = () =>
  faker.helpers.multiple(() => makeCriterion(), { count: { min: 3, max: 5 } });

describe('effectiveWeights', () => {
  it('uses the model defaults when nothing was adjusted', () => {
    // Arrange
    const criteria = makeCriteria();

    // Act
    const weights = effectiveWeights(criteria, {});

    // Assert
    expect(weights).toEqual(criteria.map((criterion) => criterion.defaultWeight));
  });

  it('applies an override only to its own criterion', () => {
    // Arrange
    const criteria = makeCriteria();
    const index = faker.number.int({ min: 0, max: criteria.length - 1 });
    const weight = makeWeight();

    // Act
    const weights = effectiveWeights(criteria, { [index]: weight });

    // Assert
    expect(weights[index]).toBe(weight);
    weights.forEach((value, other) => {
      if (other !== index) expect(value).toBe(criteria[other].defaultWeight);
    });
  });

  it('keeps one weight per criterion inside the range for any overrides', () => {
    // Arrange
    const criteria = makeCriteria();
    const overrides = Object.fromEntries(
      criteria.map((_, index) => [index, faker.number.float({ min: -20, max: 20 })]),
    );

    // Act
    const weights = effectiveWeights(criteria, overrides);

    // Assert
    expect(weights).toHaveLength(criteria.length);
    weights.forEach((weight) => {
      expect(weight).toBeGreaterThanOrEqual(MIN_WEIGHT);
      expect(weight).toBeLessThanOrEqual(MAX_WEIGHT);
    });
  });

  it('returns no weights for no criteria', () => {
    // Act
    const weights = effectiveWeights([], { 0: makeWeight() });

    // Assert
    expect(weights).toEqual([]);
  });
});

describe('withOverride', () => {
  it('adds the clamped weight and leaves the previous map untouched', () => {
    // Arrange
    const previous = { 0: makeWeight() };

    // Act
    const next = withOverride(previous, 1, MAX_WEIGHT + 3);

    // Assert
    expect(next).toEqual({ ...previous, 1: MAX_WEIGHT });
    expect(previous).not.toHaveProperty('1');
  });
});

describe('isAdjusted', () => {
  it('is false without overrides', () => {
    // Act
    const adjusted = isAdjusted(makeCriteria(), {});

    // Assert
    expect(adjusted).toBe(false);
  });

  it('is false when an override equals the default', () => {
    // Arrange
    const criteria = makeCriteria();

    // Act
    const adjusted = isAdjusted(criteria, { 0: criteria[0].defaultWeight });

    // Assert
    expect(adjusted).toBe(false);
  });

  it('is true when an override differs from the default', () => {
    // Arrange
    const criteria = [makeCriterion({ defaultWeight: MIN_WEIGHT }), makeCriterion()];

    // Act
    const adjusted = isAdjusted(criteria, { 0: MAX_WEIGHT });

    // Assert
    expect(adjusted).toBe(true);
  });
});
