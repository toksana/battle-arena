import { faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';

import { RateLimitedBodySchema, retryAfterSeconds } from './api-errors';

describe('retryAfterSeconds', () => {
  it('rounds a partial second up', () => {
    // Arrange
    const now = faker.date.recent().getTime();

    // Act
    const seconds = retryAfterSeconds(now + 1500, now);

    // Assert
    expect(seconds).toBe(2);
  });

  it('is at least 1 for any reset time, even one in the past', () => {
    // Arrange
    const now = faker.date.recent().getTime();
    const offsets = faker.helpers.multiple(() => faker.number.int({ min: -60_000, max: 600_000 }), {
      count: 50,
    });

    // Act
    const values = offsets.map((offset) => retryAfterSeconds(now + offset, now));

    // Assert
    values.forEach((value, index) => {
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value * 1000).toBeGreaterThanOrEqual(offsets[index]);
    });
  });
});

describe('RateLimitedBodySchema', () => {
  it('accepts the body the route sends', () => {
    // Arrange
    const body = { error: 'rate_limited', resetAt: faker.date.soon().getTime() };

    // Act
    const result = RateLimitedBodySchema.safeParse(body);

    // Assert
    expect(result.data).toEqual(body);
  });

  it.each([
    ['another error code', { error: 'too_long', resetAt: 1 }],
    ['a missing reset time', { error: 'rate_limited' }],
  ])('rejects %s', (_name, body) => {
    // Act
    const result = RateLimitedBodySchema.safeParse(body);

    // Assert
    expect(result.success).toBe(false);
  });
});
