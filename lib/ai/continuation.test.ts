import { faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';

import { makeComparison } from '@/test/factories';
import { makeComparisonMessage, makeUserMessage } from '@/test/messages';

import {
  dropFailedToolParts,
  hasFailedTool,
  shouldContinueAfterClarification,
} from './continuation';
import type { ArenaPart as Part, ArenaUIMessage } from './messages';

const clarificationInput = {
  question: faker.lorem.sentence(),
  goals: faker.helpers.multiple(
    () => ({
      id: faker.string.alphanumeric(8),
      label: faker.lorem.word(),
      emoji: '⚡',
      hint: faker.lorem.words(3),
    }),
    { count: 3 },
  ),
};

const answeredClarification = (): Part => ({
  type: 'tool-askClarification',
  toolCallId: faker.string.uuid(),
  state: 'output-available',
  input: clarificationInput,
  output: { goalId: clarificationInput.goals[0].id, label: clarificationInput.goals[0].label },
});

const pendingClarification = (): Part => ({
  type: 'tool-askClarification',
  toolCallId: faker.string.uuid(),
  state: 'input-available',
  input: clarificationInput,
});

const assistant = (...parts: Part[]): ArenaUIMessage => ({
  id: faker.string.uuid(),
  role: 'assistant',
  parts: [{ type: 'step-start' }, ...parts],
});

const comparisonPart = (): Part => makeComparisonMessage(makeComparison()).parts[0];

describe('shouldContinueAfterClarification', () => {
  it('continues once the user answered the clarification', () => {
    // Arrange
    const messages = [makeUserMessage(), assistant(answeredClarification())];

    // Act
    const shouldSend = shouldContinueAfterClarification({ messages });

    // Assert
    expect(shouldSend).toBe(true);
  });

  it.each<[string, ArenaUIMessage[]]>([
    ['a finished comparison', [makeUserMessage(), assistant(comparisonPart())]],
    [
      'a comparison after the answered clarification',
      [makeUserMessage(), assistant(answeredClarification(), comparisonPart())],
    ],
    ['an unanswered clarification', [makeUserMessage(), assistant(pendingClarification())]],
    ['a user message last', [makeUserMessage()]],
    ['an empty history', []],
  ])('does not continue after %s', (_name, messages) => {
    // Act
    const shouldSend = shouldContinueAfterClarification({ messages });

    // Assert
    expect(shouldSend).toBe(false);
  });
});

const failedComparison = (): Part => ({
  type: 'tool-renderComparison',
  toolCallId: faker.string.uuid(),
  state: 'output-error',
  input: undefined,
  errorText: faker.lorem.sentence(),
});

describe('hasFailedTool', () => {
  it.each<[string, ArenaUIMessage[], boolean]>([
    ['a failed comparison', [makeUserMessage(), assistant(failedComparison())], true],
    [
      'a failure after the answered clarification',
      [makeUserMessage(), assistant(answeredClarification(), failedComparison())],
      true,
    ],
    ['a finished comparison', [makeUserMessage(), assistant(comparisonPart())], false],
    ['a user message last', [makeUserMessage()], false],
    ['an empty history', [], false],
  ])('%s → %s', (_name, messages, expected) => {
    // Act
    const failed = hasFailedTool(messages);

    // Assert
    expect(failed).toBe(expected);
  });
});

describe('dropFailedToolParts', () => {
  it('keeps the answered clarification so the retry resumes after it', () => {
    // Arrange
    const clarification = answeredClarification();
    const messages = [
      makeUserMessage(),
      assistant(clarification, { type: 'step-start' }, failedComparison()),
    ];

    // Act
    const trimmed = dropFailedToolParts(messages);

    // Assert
    expect(trimmed.at(-1)?.parts).toEqual([{ type: 'step-start' }, clarification]);
    expect(shouldContinueAfterClarification({ messages: trimmed })).toBe(true);
  });

  it('leaves a history without failures unchanged', () => {
    // Arrange
    const messages = [makeUserMessage(), assistant(comparisonPart())];

    // Act
    const trimmed = dropFailedToolParts(messages);

    // Assert
    expect(trimmed).toEqual(messages);
  });

  it('does not mutate the input', () => {
    // Arrange
    const messages = [makeUserMessage(), assistant(answeredClarification(), failedComparison())];
    const snapshot = structuredClone(messages);

    // Act
    dropFailedToolParts(messages);

    // Assert
    expect(messages).toEqual(snapshot);
  });
});
