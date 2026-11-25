import { faker } from '@faker-js/faker';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PROMPT_LIMIT } from '@/lib/prompt-limit';

import { PROMPT_LABEL, PromptComposer, SEND_LABEL } from './prompt-composer';

const renderComposer = (value: string, props: { isBusy?: boolean } = {}) => {
  const onSubmit = vi.fn();
  const onValueChange = vi.fn();
  render(
    <PromptComposer
      value={value}
      onValueChange={onValueChange}
      onSubmit={onSubmit}
      isBusy={props.isBusy}
    />,
  );
  return { onSubmit, onValueChange };
};

const field = () => screen.getByLabelText(PROMPT_LABEL);
const sendButton = () => screen.getByRole('button', { name: SEND_LABEL });

describe('PromptComposer', () => {
  it('submits on Enter when the prompt is valid', () => {
    // Arrange
    const { onSubmit } = renderComposer(faker.lorem.words(3));

    // Act
    fireEvent.keyDown(field(), { key: 'Enter' });

    // Assert
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it('does not submit on Shift+Enter', () => {
    // Arrange
    const { onSubmit } = renderComposer(faker.lorem.words(3));

    // Act
    fireEvent.keyDown(field(), { key: 'Enter', shiftKey: true });

    // Assert
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('blocks sending an empty or whitespace-only prompt', () => {
    // Arrange
    const { onSubmit } = renderComposer('   ');

    // Act
    fireEvent.keyDown(field(), { key: 'Enter' });

    // Assert
    expect(sendButton()).toBeDisabled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('blocks sending while busy', () => {
    // Arrange
    const { onSubmit } = renderComposer(faker.lorem.words(3), { isBusy: true });

    // Act
    fireEvent.keyDown(field(), { key: 'Enter' });

    // Assert
    expect(sendButton()).toBeDisabled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('keeps an over-limit prompt intact but blocks sending and explains why', () => {
    // Arrange
    const value = faker.string.alpha(PROMPT_LIMIT + 1);
    const { onSubmit } = renderComposer(value);

    // Act
    fireEvent.click(sendButton());

    // Assert
    expect(field()).toHaveValue(value);
    expect(field()).toHaveAttribute('aria-invalid', 'true');
    expect(sendButton()).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent(`${PROMPT_LIMIT} chars max`);
    expect(screen.getByText(`${PROMPT_LIMIT + 1} / ${PROMPT_LIMIT}`)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('reports typing through onValueChange', () => {
    // Arrange
    const typed = faker.lorem.words(2);
    const { onValueChange } = renderComposer('');

    // Act
    fireEvent.change(field(), { target: { value: typed } });

    // Assert
    expect(onValueChange).toHaveBeenCalledWith(typed);
  });
});
