import { faker } from '@faker-js/faker';
import { APICallError, type ChatStatus } from 'ai';
import { describe, expect, it } from 'vitest';

import {
  GENERIC_CHAT_ERROR,
  INVALID_PROMPT_MESSAGE,
  chatErrorMessage,
  isChatBusy,
  isRateLimited,
  minutesUntil,
  rateLimitResetAt,
} from './chat-status';

const apiError = (statusCode: number, responseBody = faker.lorem.sentence()) =>
  new APICallError({
    message: responseBody,
    url: '/api/chat',
    requestBodyValues: undefined,
    statusCode,
    responseBody,
  });

describe('isChatBusy', () => {
  it.each<[ChatStatus, boolean]>([
    ['submitted', true],
    ['streaming', true],
    ['ready', false],
    ['error', false],
  ])('%s → %s', (status, expected) => {
    // Act
    const busy = isChatBusy(status);

    // Assert
    expect(busy).toBe(expected);
  });
});

describe('chatErrorMessage', () => {
  it('explains a rejected prompt for a 400 response', () => {
    // Arrange
    const error = apiError(400, '{"error":"too_long"}');

    // Act
    const message = chatErrorMessage(error);

    // Assert
    expect(message).toBe(INVALID_PROMPT_MESSAGE);
  });

  it.each([
    ['a 500 response', apiError(500)],
    ['a stream error', new Error(faker.lorem.sentence())],
    ['a non-error value', faker.lorem.word()],
    ['a failed tool call without a chat error', undefined],
  ])('falls back to generic copy for %s', (_name, error) => {
    // Act
    const message = chatErrorMessage(error);

    // Assert
    expect(message).toBe(GENERIC_CHAT_ERROR);
  });

  it('never echoes server-provided text', () => {
    // Arrange
    const secret = faker.string.uuid();

    // Act
    const messages = [400, 500].map((status) => chatErrorMessage(apiError(status, secret)));

    // Assert
    messages.forEach((message) => expect(message).not.toContain(secret));
  });
});

describe('isRateLimited', () => {
  it.each<[string, unknown, boolean]>([
    ['a 429', apiError(429), true],
    ['a 400', apiError(400), false],
    ['a stream error', new Error(faker.lorem.sentence()), false],
    ['no error', undefined, false],
  ])('%s → %s', (_name, error, expected) => {
    // Act
    const limited = isRateLimited(error);

    // Assert
    expect(limited).toBe(expected);
  });
});

describe('rateLimitResetAt', () => {
  it('reads the reset time from a 429 body', () => {
    // Arrange
    const resetAt = faker.date.soon().getTime();
    const error = apiError(429, JSON.stringify({ error: 'rate_limited', resetAt }));

    // Act
    const value = rateLimitResetAt(error);

    // Assert
    expect(value).toBe(resetAt);
  });

  it.each<[string, unknown]>([
    ['a 429 with a non-JSON body', apiError(429, 'Too Many Requests')],
    ['a 429 with another JSON shape', apiError(429, JSON.stringify({ retry: 5 }))],
    [
      'a 400 with a reset time',
      apiError(400, JSON.stringify({ error: 'rate_limited', resetAt: 1 })),
    ],
    ['a plain error', new Error(faker.lorem.sentence())],
  ])('returns null for %s', (_name, error) => {
    // Act
    const value = rateLimitResetAt(error);

    // Assert
    expect(value).toBeNull();
  });
});

describe('minutesUntil', () => {
  it('rounds a partial minute up', () => {
    // Arrange
    const now = faker.date.recent().getTime();

    // Act
    const minutes = minutesUntil(now + 61_000, now);

    // Assert
    expect(minutes).toBe(2);
  });

  it('never goes below 0 and always covers the remaining time', () => {
    // Arrange
    const now = faker.date.recent().getTime();
    const offsets = faker.helpers.multiple(
      () => faker.number.int({ min: -600_000, max: 600_000 }),
      {
        count: 50,
      },
    );

    // Act
    const values = offsets.map((offset) => minutesUntil(now + offset, now));

    // Assert
    values.forEach((minutes, index) => {
      expect(minutes).toBeGreaterThanOrEqual(0);
      expect(minutes * 60_000).toBeGreaterThanOrEqual(offsets[index]);
    });
  });

  it('is 0 exactly at the reset time', () => {
    // Arrange
    const now = faker.date.recent().getTime();

    // Act
    const minutes = minutesUntil(now, now);

    // Assert
    expect(minutes).toBe(0);
  });
});
