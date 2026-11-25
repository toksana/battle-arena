import { faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';

import {
  COUNTER_VISIBLE_RATIO,
  NEAR_LIMIT_RATIO,
  PROMPT_LIMIT,
  promptLength,
  promptLengthTone,
} from './prompt-limit';

const TONE_ORDER = ['hidden', 'visible', 'near', 'over'] as const;

describe('promptLengthTone', () => {
  it('never steps back to a calmer tone as the prompt grows', () => {
    // Arrange
    const limit = faker.number.int({ min: 50, max: 1000 });
    const lengths = Array.from({ length: limit + 20 }, (_, length) => length);

    // Act
    const ranks = lengths.map((length) => TONE_ORDER.indexOf(promptLengthTone(length, limit)));

    // Assert
    ranks.slice(1).forEach((rank, index) => expect(rank).toBeGreaterThanOrEqual(ranks[index]));
  });

  it('is "over" exactly when the length exceeds the limit', () => {
    // Arrange
    const limit = faker.number.int({ min: 50, max: 1000 });

    // Act
    const atLimit = promptLengthTone(limit, limit);
    const pastLimit = promptLengthTone(limit + 1, limit);

    // Assert
    expect(atLimit).toBe('near');
    expect(pastLimit).toBe('over');
  });

  it('switches tones at the configured ratios of the default limit', () => {
    // Arrange
    const visibleAt = Math.ceil(PROMPT_LIMIT * COUNTER_VISIBLE_RATIO);
    const nearAt = Math.ceil(PROMPT_LIMIT * NEAR_LIMIT_RATIO);

    // Act
    const tones = [visibleAt - 1, visibleAt, nearAt - 1, nearAt].map((length) =>
      promptLengthTone(length),
    );

    // Assert
    expect(tones).toEqual(['hidden', 'visible', 'visible', 'near']);
  });

  it('is hidden for an empty prompt', () => {
    // Arrange
    const length = 0;

    // Act
    const tone = promptLengthTone(length);

    // Assert
    expect(tone).toBe('hidden');
  });
});

describe('promptLength', () => {
  it('ignores surrounding whitespace', () => {
    // Arrange
    const text = faker.lorem.words(3);

    // Act
    const length = promptLength(`  \n${text}\t `);

    // Assert
    expect(length).toBe(text.length);
  });
});
