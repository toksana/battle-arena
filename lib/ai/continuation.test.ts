import { faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';

import { makeComparison } from '@/test/factories';
import { makeComparisonMessage, makeUserMessage } from '@/test/messages';

import { shouldContinueAfterClarification } from './continuation';
import type { ArenaUIMessage } from './messages';

type Part = ArenaUIMessage['parts'][number];

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
