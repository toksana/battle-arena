import { faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';

import type { ArenaPart, ArenaUIMessage } from '@/lib/ai/messages';
import { GOAL_COUNT } from '@/lib/ai/schemas';
import { makeComparison } from '@/test/factories';
import { makeComparisonMessage, makeUserMessage } from '@/test/messages';

import type { PresetReplay } from './fixtures';
import { replayStep } from './plan';

const makeReplay = (): PresetReplay => {
  const goals = faker.helpers.multiple(
    () => ({
      id: faker.string.uuid(),
      label: faker.lorem.word(),
      emoji: '⚡',
      hint: faker.lorem.words(3),
    }),
    { count: GOAL_COUNT },
  );
  return {
    presetId: 'coffee-vs-smoothie',
    clarification: { question: faker.lorem.sentence(), goals },
    comparisons: goals.map((goal) => ({
      goalId: goal.id,
      comparison: makeComparison({ goal: goal.label }),
    })),
  };
};

const answered = (replay: PresetReplay, goalId: string): ArenaUIMessage => ({
  id: faker.string.uuid(),
  role: 'assistant',
  parts: [
    {
      type: 'tool-askClarification',
      toolCallId: faker.string.uuid(),
      state: 'output-available',
      input: replay.clarification,
      output: { goalId, label: faker.lorem.word() },
    } satisfies ArenaPart,
  ],
});

describe('replayStep', () => {
  it('asks the recorded clarification for a fresh dilemma', () => {
    // Arrange
    const replay = makeReplay();

    // Act
    const step = replayStep([makeUserMessage()], replay);

    // Assert
    expect(step).toEqual(
      expect.objectContaining({ toolName: 'askClarification', input: replay.clarification }),
    );
    expect(step?.output).toBeUndefined();
  });

  it('plays the comparison recorded for the picked goal, continuing that message', () => {
    // Arrange
    const replay = makeReplay();
    const picked = faker.helpers.arrayElement(replay.comparisons);
    const assistant = answered(replay, picked.goalId);

    // Act
    const step = replayStep([makeUserMessage(), assistant], replay);

    // Assert
    expect(step).toEqual(
      expect.objectContaining({
        toolName: 'renderComparison',
        input: picked.comparison,
        output: { rendered: true },
        messageId: assistant.id,
      }),
    );
  });

  it.each<[string, (replay: PresetReplay) => ArenaUIMessage[]]>([
    ['an unknown goal', (replay) => [makeUserMessage(), answered(replay, 'unknown-goal')]],
    ['a finished comparison', () => [makeUserMessage(), makeComparisonMessage(makeComparison())]],
    [
      'a comparison already played after the answer',
      (replay) => {
        const assistant = answered(replay, replay.comparisons[0].goalId);
        const played = makeComparisonMessage(makeComparison()).parts;
        return [makeUserMessage(), { ...assistant, parts: [...assistant.parts, ...played] }];
      },
    ],
    ['an empty history', () => []],
  ])('has nothing to play after %s', (_name, history) => {
    // Arrange
    const replay = makeReplay();

    // Act
    const step = replayStep(history(replay), replay);

    // Assert
    expect(step).toBeNull();
  });

  it('gives every recorded call a distinct id', () => {
    // Arrange
    const replay = makeReplay();

    // Act
    const ids = [
      replayStep([makeUserMessage()], replay)?.toolCallId,
      ...replay.comparisons.map(
        (entry) =>
          replayStep([makeUserMessage(), answered(replay, entry.goalId)], replay)?.toolCallId,
      ),
    ];

    // Assert
    expect(new Set(ids).size).toBe(GOAL_COUNT + 1);
  });
});
