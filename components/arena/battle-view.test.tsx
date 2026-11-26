import { faker } from '@faker-js/faker';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { ArenaUIMessage } from '@/lib/ai/messages';
import { makeComparison } from '@/test/factories';
import { makeComparisonMessage, makeUserMessage } from '@/test/messages';

import { BattleView } from './battle-view';

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
    expect(screen.getByText(comparison.title)).toBeInTheDocument();
    expect(screen.getByText(comparison.verdict.summary)).toBeInTheDocument();
    expect(screen.getByRole('article', { name: 'Comparison' })).toHaveAttribute(
      'aria-busy',
      'false',
    );
  });

  it('renders a partially streamed comparison as busy', () => {
    // Arrange
    const title = faker.lorem.words(3);
    const streaming = assistant([
      {
        type: 'tool-renderComparison',
        toolCallId: faker.string.uuid(),
        state: 'input-streaming',
        input: { title, options: [{ name: faker.lorem.word() }] },
      },
    ]);

    // Act
    render(<BattleView messages={[makeUserMessage(), streaming]} />);

    // Assert
    expect(screen.getByText(title)).toBeInTheDocument();
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
    expect(screen.queryByText(comparison.title)).toBeNull();
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
});
