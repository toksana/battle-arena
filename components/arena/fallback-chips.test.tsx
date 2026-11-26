import { faker } from '@faker-js/faker';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { ArenaToolPart } from '@/lib/ai/messages';
import { FALLBACK_PROMPT_COUNT, type FallbackChips } from '@/lib/ai/schemas';

import { FALLBACK_CHIPS_LABEL, FallbackChipsCard } from './fallback-chips';

type Part = ArenaToolPart<'renderFallbackChips'>;

const makeFallback = (): FallbackChips => ({
  message: faker.lorem.sentence(),
  prompts: faker.helpers.uniqueArray(
    () => `${faker.commerce.product()} vs ${faker.lorem.word()}`,
    FALLBACK_PROMPT_COUNT,
  ),
});

const shownPart = (input = makeFallback()): Part => ({
  type: 'tool-renderFallbackChips',
  toolCallId: faker.string.uuid(),
  state: 'output-available',
  input,
  output: { rendered: true },
});

const chips = () =>
  within(screen.getByRole('list', { name: FALLBACK_CHIPS_LABEL })).getAllByRole('button');

describe('FallbackChipsCard', () => {
  it('shows the message and one chip per suggested dilemma', () => {
    // Arrange
    const input = makeFallback();

    // Act
    render(<FallbackChipsCard part={shownPart(input)} />);

    // Assert
    expect(screen.getByText(input.message)).toBeInTheDocument();
    expect(chips().map((chip) => chip.textContent)).toEqual(input.prompts);
  });

  it('passes the picked dilemma up', () => {
    // Arrange
    const input = makeFallback();
    const prompt = faker.helpers.arrayElement(input.prompts);
    const onPick = vi.fn();
    render(<FallbackChipsCard part={shownPart(input)} onPick={onPick} />);

    // Act
    fireEvent.click(screen.getByRole('button', { name: prompt }));

    // Assert
    expect(onPick).toHaveBeenCalledExactlyOnceWith(prompt);
  });

  it('locks the chips while disabled', () => {
    // Arrange
    const onPick = vi.fn();
    render(<FallbackChipsCard part={shownPart()} onPick={onPick} disabled />);

    // Act
    chips().forEach((chip) => fireEvent.click(chip));

    // Assert
    chips().forEach((chip) => expect(chip).toBeDisabled());
    expect(onPick).not.toHaveBeenCalled();
  });

  it('shows streamed chips locked and a skeleton for the missing message', () => {
    // Arrange
    const [first] = makeFallback().prompts;
    const streaming: Part = {
      type: 'tool-renderFallbackChips',
      toolCallId: faker.string.uuid(),
      state: 'input-streaming',
      input: { prompts: [first] },
    };

    // Act
    const { container } = render(<FallbackChipsCard part={streaming} />);

    // Assert
    expect(chips()).toHaveLength(1);
    expect(chips()[0]).toBeDisabled();
    expect(container.querySelector('[data-slot="skeleton"]')).not.toBeNull();
  });

  it('renders model text as literal text', () => {
    // Arrange
    const markup = '<img src=x onerror="alert(1)">';
    const input = { message: markup, prompts: [markup] };

    // Act
    const { container } = render(<FallbackChipsCard part={shownPart(input)} />);

    // Assert
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getAllByText(markup)).toHaveLength(2);
  });
});
