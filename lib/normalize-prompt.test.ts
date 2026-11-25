import { faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';

import { LINK_PLACEHOLDER, checkPrompt, normalizePrompt } from './normalize-prompt';
import { PROMPT_LIMIT } from './prompt-limit';

const RUNS = 30;

const makeMessyInput = (): string =>
  faker.helpers
    .shuffle([
      faker.lorem.words(3),
      faker.internet.url(),
      `www.${faker.internet.domainName()}`,
      '\u0000\u0007',
      '\n\t  ',
    ])
    .join(' ');

describe('normalizePrompt', () => {
  it('leaves plain text untouched', () => {
    // Arrange
    const text = `${faker.lorem.word()} vs. ${faker.lorem.word()}`;

    // Act
    const result = normalizePrompt(text);

    // Assert
    expect(result).toBe(text);
  });

  it.each([
    'Array<T> vs T[]',
    'Map<string, number> vs Record<string, number>',
    '<div> vs <section>',
  ])('keeps markup-like text intact: %s', (text) => {
    // Arrange — input from the table

    // Act
    const result = normalizePrompt(text);

    // Assert
    expect(result).toBe(text);
  });

  it('removes links, control chars and extra whitespace from messy input', () => {
    for (let run = 0; run < RUNS; run += 1) {
      // Arrange
      const input = makeMessyInput();

      // Act
      const result = normalizePrompt(input);

      // Assert
      expect(result).not.toMatch(/https?:\/\/|www\./i);
      expect(result).not.toMatch(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/);
      expect(result).not.toMatch(/\s{2,}/);
      expect(result).toBe(result.trim());
    }
  });

  it('is idempotent', () => {
    for (let run = 0; run < RUNS; run += 1) {
      // Arrange
      const once = normalizePrompt(makeMessyInput());

      // Act
      const twice = normalizePrompt(once);

      // Assert
      expect(twice).toBe(once);
    }
  });

  it('replaces each link with a placeholder', () => {
    // Arrange
    const input = `Compare ${faker.internet.url()} vs www.${faker.internet.domainName()}`;

    // Act
    const result = normalizePrompt(input);

    // Assert
    expect(result).toBe(`Compare ${LINK_PLACEHOLDER} vs ${LINK_PLACEHOLDER}`);
  });
});

describe('checkPrompt', () => {
  it('accepts a prompt exactly at the limit', () => {
    // Arrange
    const raw = faker.string.alpha(PROMPT_LIMIT);

    // Act
    const result = checkPrompt(raw);

    // Assert
    expect(result).toEqual({ ok: true, prompt: raw });
  });

  it('rejects a prompt one character over the limit', () => {
    // Arrange
    const raw = faker.string.alpha(PROMPT_LIMIT + 1);

    // Act
    const result = checkPrompt(raw);

    // Assert
    expect(result).toEqual({ ok: false, reason: 'too_long' });
  });

  it('measures the trimmed text, like the client counter', () => {
    // Arrange
    const text = faker.string.alpha(PROMPT_LIMIT);

    // Act
    const result = checkPrompt(`   ${text}   `);

    // Assert
    expect(result).toEqual({ ok: true, prompt: text });
  });

  it.each(['', '   ', '\u0000', '\u0007\n\t'])('rejects %j as empty after normalizing', (raw) => {
    // Arrange — input from the table

    // Act
    const result = checkPrompt(raw);

    // Assert
    expect(result).toEqual({ ok: false, reason: 'empty' });
  });
});
