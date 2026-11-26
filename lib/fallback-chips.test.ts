import { faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';

import { toFallbackPresets } from './fallback-chips';

const dilemma = () => `${faker.commerce.product()} vs ${faker.lorem.word()}`;

describe('toFallbackPresets', () => {
  it('maps each prompt to a chip that sends the same text', () => {
    // Arrange
    const prompts = faker.helpers.uniqueArray(dilemma, 3);

    // Act
    const chips = toFallbackPresets(prompts);

    // Assert
    expect(chips.map((chip) => chip.prompt)).toEqual(prompts);
    chips.forEach((chip) => expect(chip.label).toBe(chip.prompt));
  });

  it('gives every chip a unique id', () => {
    // Arrange
    const prompts = faker.helpers.uniqueArray(dilemma, 3);

    // Act
    const ids = toFallbackPresets(prompts).map((chip) => chip.id);

    // Assert
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('drops holes and blank prompts from a partial stream', () => {
    // Arrange
    const prompt = dilemma();

    // Act
    const chips = toFallbackPresets([undefined, '   ', prompt, '']);

    // Assert
    expect(chips.map((chip) => chip.prompt)).toEqual([prompt]);
  });

  it('trims prompts and collapses duplicates', () => {
    // Arrange
    const prompt = dilemma();

    // Act
    const chips = toFallbackPresets([` ${prompt} `, prompt]);

    // Assert
    expect(chips.map((chip) => chip.prompt)).toEqual([prompt]);
  });

  it.each([undefined, []])('returns no chips for %s', (prompts) => {
    // Act
    const chips = toFallbackPresets(prompts);

    // Assert
    expect(chips).toEqual([]);
  });
});
