import { faker } from '@faker-js/faker';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { ArenaToolPart } from '@/lib/ai/messages';
import { GOAL_COUNT, type Clarification } from '@/lib/ai/schemas';

import { ClarificationCard } from './clarification-card';

type Part = ArenaToolPart<'askClarification'>;

const makeClarification = (): Clarification => ({
  question: faker.lorem.sentence(),
  goals: faker.helpers
    .uniqueArray(() => faker.lorem.word(), GOAL_COUNT)
    .map((label) => ({ id: faker.string.uuid(), label, emoji: '⚡', hint: faker.lorem.words(3) })),
});

const askedPart = (input = makeClarification()): Part => ({
  type: 'tool-askClarification',
  toolCallId: faker.string.uuid(),
  state: 'input-available',
  input,
});

const goalButtons = () => within(screen.getByRole('list')).getAllByRole('button');

describe('ClarificationCard', () => {
  it('shows the question and one enabled button per goal', () => {
    // Arrange
    const input = makeClarification();

    // Act
    render(<ClarificationCard part={askedPart(input)} />);

    // Assert
    expect(screen.getByRole('heading', { name: input.question })).toBeInTheDocument();
    expect(goalButtons()).toHaveLength(GOAL_COUNT);
    goalButtons().forEach((button) => expect(button).toBeEnabled());
  });

  it('answers with the picked goal and its tool call id', () => {
    // Arrange
    const input = makeClarification();
    const part = askedPart(input);
    const goal = faker.helpers.arrayElement(input.goals);
    const onAnswer = vi.fn();
    render(<ClarificationCard part={part} onAnswer={onAnswer} />);

    // Act
    fireEvent.click(screen.getByRole('button', { name: new RegExp(goal.label) }));

    // Assert
    expect(onAnswer).toHaveBeenCalledExactlyOnceWith({
      toolCallId: part.toolCallId,
      goalId: goal.id,
      label: goal.label,
    });
  });

  it('marks the chosen goal and locks the others once answered', () => {
    // Arrange
    const input = makeClarification();
    const [, chosen] = input.goals;
    const answered: Part = {
      type: 'tool-askClarification',
      toolCallId: faker.string.uuid(),
      state: 'output-available',
      input,
      output: { goalId: chosen.id, label: chosen.label },
    };
    const onAnswer = vi.fn();

    // Act
    render(<ClarificationCard part={answered} onAnswer={onAnswer} />);
    goalButtons().forEach((button) => fireEvent.click(button));

    // Assert
    expect(screen.getByRole('button', { pressed: true })).toHaveAccessibleName(
      new RegExp(chosen.label),
    );
    goalButtons().forEach((button) => expect(button).toBeDisabled());
    expect(onAnswer).not.toHaveBeenCalled();
  });

  it('locks the goals while disabled', () => {
    // Arrange
    const onAnswer = vi.fn();

    // Act
    render(<ClarificationCard part={askedPart()} onAnswer={onAnswer} disabled />);
    goalButtons().forEach((button) => fireEvent.click(button));

    // Assert
    goalButtons().forEach((button) => expect(button).toBeDisabled());
    expect(onAnswer).not.toHaveBeenCalled();
  });

  it('shows streamed goals locked and skeletons for the rest', () => {
    // Arrange
    const [first] = makeClarification().goals;
    const streaming: Part = {
      type: 'tool-askClarification',
      toolCallId: faker.string.uuid(),
      state: 'input-streaming',
      input: { goals: [first] },
    };

    // Act
    const { container } = render(<ClarificationCard part={streaming} />);

    // Assert
    expect(goalButtons()).toHaveLength(1);
    expect(goalButtons()[0]).toBeDisabled();
    expect(container.querySelectorAll('li [data-slot="skeleton"]')).toHaveLength(GOAL_COUNT - 1);
  });
});
