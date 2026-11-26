import { faker } from '@faker-js/faker';
import { z } from 'zod';
import { describe, expect, it } from 'vitest';

import { makeComparison, makeCriterion, makeOption } from '@/test/factories';

import {
  ClarificationSchema,
  ComparisonSchema,
  FallbackChipsSchema,
  MAX_SCORE,
  MAX_WEIGHT,
} from './schemas';

/** JSON Schema keywords that some providers reject in tool input schemas. */
const UNSUPPORTED_KEYWORDS = ['prefixItems', 'oneOf', 'allOf', 'propertyNames', 'not', 'if'];

const collectKeys = (node: unknown): string[] => {
  if (Array.isArray(node)) return node.flatMap(collectKeys);
  if (node === null || typeof node !== 'object') return [];
  return Object.entries(node).flatMap(([key, value]) => [key, ...collectKeys(value)]);
};

describe('ComparisonSchema', () => {
  it('accepts a well-formed comparison', () => {
    // Arrange
    const comparison = makeComparison();

    // Act
    const result = ComparisonSchema.safeParse(comparison);

    // Assert
    expect(result.error).toBeUndefined();
  });

  it('accepts an irrelevant comparison with a humorous fallback reason', () => {
    // Arrange
    const comparison = makeComparison({
      isRelevant: false,
      fallbackReason: faker.lorem.sentence().slice(0, 160),
    });

    // Act
    const result = ComparisonSchema.safeParse(comparison);

    // Assert
    expect(result.error).toBeUndefined();
  });

  it.each([1, 3])('rejects %i options (exactly 2 required)', (count) => {
    // Arrange
    const comparison = makeComparison({
      options: faker.helpers.multiple(() => makeOption(), { count }),
    });

    // Act
    const result = ComparisonSchema.safeParse(comparison);

    // Assert
    expect(result.error).toBeInstanceOf(z.ZodError);
  });

  it.each([2, 6])('rejects %i criteria (3–5 required)', (count) => {
    // Arrange
    const comparison = makeComparison({
      criteria: faker.helpers.multiple(() => makeCriterion(), { count }),
    });

    // Act
    const result = ComparisonSchema.safeParse(comparison);

    // Assert
    expect(result.error).toBeInstanceOf(z.ZodError);
  });

  it.each([
    ['score above max', { scoreA: MAX_SCORE + 1 }],
    ['negative score', { scoreB: -1 }],
    ['fractional score', { scoreA: 4.5 }],
    ['weight above max', { defaultWeight: MAX_WEIGHT + 1 }],
    ['zero weight', { defaultWeight: 0 }],
  ])('rejects a criterion with %s', (_name, override) => {
    // Arrange
    const comparison = makeComparison({
      criteria: [makeCriterion(override), makeCriterion(), makeCriterion()],
    });

    // Act
    const result = ComparisonSchema.safeParse(comparison);

    // Assert
    expect(result.error).toBeInstanceOf(z.ZodError);
  });

  it('rejects a title above the length limit', () => {
    // Arrange
    const comparison = makeComparison({ title: faker.string.alpha(61) });

    // Act
    const result = ComparisonSchema.safeParse(comparison);

    // Assert
    expect(result.error).toBeInstanceOf(z.ZodError);
  });
});

describe('ClarificationSchema', () => {
  it('requires exactly three goals', () => {
    // Arrange
    const goal = { id: 'energy', label: 'Get energized', emoji: '⚡', hint: 'Caffeine first' };

    // Act
    const three = ClarificationSchema.safeParse({ question: 'Goal?', goals: [goal, goal, goal] });
    const two = ClarificationSchema.safeParse({ question: 'Goal?', goals: [goal, goal] });

    // Assert
    expect(three.error).toBeUndefined();
    expect(two.error).toBeInstanceOf(z.ZodError);
  });
});

describe('FallbackChipsSchema', () => {
  it('requires exactly three prompts', () => {
    // Arrange
    const prompts = ['Morning vs evening run', 'Treadmill vs outdoor', 'Shoes vs barefoot'];

    // Act
    const message = 'I only compare two options.';
    const valid = FallbackChipsSchema.safeParse({ message, prompts });
    const tooFew = FallbackChipsSchema.safeParse({ message, prompts: prompts.slice(0, 2) });

    // Assert
    expect(valid.error).toBeUndefined();
    expect(tooFew.error).toBeInstanceOf(z.ZodError);
  });
});

describe('JSON Schema sent to the model', () => {
  it.each([
    ['ComparisonSchema', ComparisonSchema],
    ['ClarificationSchema', ClarificationSchema],
    ['FallbackChipsSchema', FallbackChipsSchema],
  ])('%s uses only provider-friendly keywords', (_name, schema) => {
    // Arrange
    const jsonSchema = z.toJSONSchema(schema);

    // Act
    const keys = collectKeys(jsonSchema);

    // Assert
    UNSUPPORTED_KEYWORDS.forEach((keyword) => expect(keys).not.toContain(keyword));
  });

  it('keeps streaming order: title before options, verdict last', () => {
    // Arrange
    const jsonSchema = z.toJSONSchema(ComparisonSchema) as { properties: object };

    // Act
    const order = Object.keys(jsonSchema.properties);

    // Assert
    expect(order.indexOf('title')).toBeLessThan(order.indexOf('options'));
    expect(order.at(-1)).toBe('verdict');
  });
});
