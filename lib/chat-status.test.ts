import { faker } from '@faker-js/faker';
import { APICallError, type ChatStatus } from 'ai';
import { describe, expect, it } from 'vitest';

import {
  GENERIC_CHAT_ERROR,
  INVALID_PROMPT_MESSAGE,
  chatErrorMessage,
  isChatBusy,
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
