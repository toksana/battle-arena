import { faker } from '@faker-js/faker';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { Preset } from '@/lib/presets';

import { PresetChips } from './preset-chips';

const makePreset = (): Preset => ({
  id: faker.string.uuid(),
  label: `${faker.commerce.product()} vs. ${faker.commerce.product()}`,
  emoji: faker.internet.emoji(),
  prompt: faker.lorem.sentence(),
});

describe('PresetChips', () => {
  it('renders one button per preset', () => {
    // Arrange
    const presets = faker.helpers.multiple(makePreset, { count: { min: 1, max: 6 } });

    // Act
    render(<PresetChips presets={presets} />);

    // Assert
    expect(screen.getAllByRole('button')).toHaveLength(presets.length);
  });

  it('calls onSelect with the clicked preset', () => {
    // Arrange
    const presets = faker.helpers.multiple(makePreset, { count: 3 });
    const target = faker.helpers.arrayElement(presets);
    const onSelect = vi.fn();
    render(<PresetChips presets={presets} onSelect={onSelect} />);

    // Act
    fireEvent.click(screen.getByRole('button', { name: new RegExp(target.label) }));

    // Assert
    expect(onSelect).toHaveBeenCalledExactlyOnceWith(target);
  });

  it('disables every chip when disabled', () => {
    // Arrange
    const presets = faker.helpers.multiple(makePreset, { count: 3 });

    // Act
    render(<PresetChips presets={presets} disabled />);

    // Assert
    screen.getAllByRole('button').forEach((button) => expect(button).toBeDisabled());
  });
});
