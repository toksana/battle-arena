import { faker } from '@faker-js/faker';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { ArenaUIMessage } from '@/lib/ai/messages';
import { makeComparison } from '@/test/factories';
import { makeComparisonMessage, makeUserMessage } from '@/test/messages';

import { BattleView } from './battle-view';
import { PRE_RENDERED_LABEL } from './pre-rendered-badge';

const assistant = (parts: ArenaUIMessage['parts']): ArenaUIMessage => ({
  id: faker.string.uuid(),
  role: 'assistant',
  parts,
});

describe('BattleView', () => {
  it('shows the dilemma and the finished comparison', () => {
    // Arrange
    const dilemma = faker.lorem.words(4);
    const comparison = makeComparison();

    // Act
    render(<BattleView messages={[makeUserMessage(dilemma), makeComparisonMessage(comparison)]} />);

    // Assert
    expect(screen.getByRole('heading', { name: dilemma })).toBeInTheDocument();
    expect(screen.getByText(comparison.scene)).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Verdict' })).toBeInTheDocument();
    expect(screen.getByRole('article', { name: 'Comparison' })).toHaveAttribute(
      'aria-busy',
      'false',
    );
  });

  it('renders a partially streamed comparison as busy', () => {
    // Arrange
    const scene = faker.lorem.words(3);
    const streaming = assistant([
      {
        type: 'tool-renderComparison',
        toolCallId: faker.string.uuid(),
        state: 'input-streaming',
        input: { scene, options: [{ name: faker.lorem.word() }] },
      },
    ]);

    // Act
    render(<BattleView messages={[makeUserMessage(), streaming]} />);

    // Assert
    expect(screen.getByText(scene)).toBeInTheDocument();
    expect(screen.getByRole('article', { name: 'Comparison' })).toHaveAttribute(
      'aria-busy',
      'true',
    );
  });

  it('drops a failed comparison and never shows its error text', () => {
    // Arrange
    const errorText = faker.lorem.sentence();
    const comparison = makeComparison();
    const failed = assistant([
      {
        type: 'tool-renderComparison',
        toolCallId: faker.string.uuid(),
        state: 'output-error',
        input: comparison,
        errorText,
      },
    ]);

    // Act
    render(<BattleView messages={[makeUserMessage(), failed]} />);

    // Assert
    expect(screen.queryByRole('article', { name: 'Comparison' })).toBeNull();
    expect(screen.queryByText(comparison.scene)).toBeNull();
    expect(screen.queryByText(errorText)).toBeNull();
  });

  it('renders markup in model and user text as literal text', () => {
    // Arrange
    const markup = '<img src=x onerror="alert(1)">';
    const reply = assistant([{ type: 'text', text: markup }]);

    // Act
    const { container } = render(<BattleView messages={[makeUserMessage(markup), reply]} />);

    // Assert
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getAllByText(markup)).toHaveLength(2);
  });

  it('passes a picked goal up and locks the goals while busy', () => {
    // Arrange
    const toolCallId = faker.string.uuid();
    const goals = ['Get energized', 'Lose weight', 'Fuel a workout'].map((label) => ({
      id: faker.string.uuid(),
      label,
      emoji: '⚡',
      hint: faker.lorem.words(3),
    }));
    const asked = assistant([
      {
        type: 'tool-askClarification',
        toolCallId,
        state: 'input-available',
        input: { question: faker.lorem.sentence(), goals },
      },
    ]);
    const onAnswer = vi.fn();
    const { rerender } = render(
      <BattleView messages={[makeUserMessage(), asked]} onAnswer={onAnswer} />,
    );

    // Act
    fireEvent.click(screen.getByRole('button', { name: /Lose weight/ }));
    rerender(<BattleView messages={[makeUserMessage(), asked]} onAnswer={onAnswer} isBusy />);

    // Assert
    expect(onAnswer).toHaveBeenCalledExactlyOnceWith({
      toolCallId,
      goalId: goals[1].id,
      label: 'Lose weight',
    });
    expect(screen.getByRole('button', { name: /Get energized/ })).toBeDisabled();
  });

  it('passes a picked fallback dilemma up and locks the chips while busy', () => {
    // Arrange
    const prompts = ['Morning vs evening run', 'Treadmill vs outdoor running', 'Shoes vs barefoot'];
    const fallback = assistant([
      {
        type: 'tool-renderFallbackChips',
        toolCallId: faker.string.uuid(),
        state: 'output-available',
        input: { message: faker.lorem.sentence(), prompts },
        output: { rendered: true },
      },
    ]);
    const onPickPrompt = vi.fn();
    const { rerender } = render(
      <BattleView messages={[makeUserMessage(), fallback]} onPickPrompt={onPickPrompt} />,
    );

    // Act
    fireEvent.click(screen.getByRole('button', { name: prompts[1] }));
    rerender(
      <BattleView messages={[makeUserMessage(), fallback]} onPickPrompt={onPickPrompt} isBusy />,
    );

    // Assert
    expect(onPickPrompt).toHaveBeenCalledExactlyOnceWith(prompts[1]);
    expect(screen.getByRole('button', { name: prompts[0] })).toBeDisabled();
  });

  it('marks a replayed battle as pre-rendered', () => {
    // Arrange
    const dilemma = { ...makeUserMessage(), metadata: { replayPresetId: 'coffee-vs-smoothie' } };

    // Act
    render(<BattleView messages={[dilemma]} />);

    // Assert
    expect(screen.getByText(PRE_RENDERED_LABEL)).toBeInTheDocument();
  });

  it('does not mark a live battle', () => {
    // Act
    render(<BattleView messages={[makeUserMessage()]} />);

    // Assert
    expect(screen.queryByText(PRE_RENDERED_LABEL)).toBeNull();
  });
});
