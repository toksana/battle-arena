import { faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';

import { makeComparison } from '@/test/factories';

import { DELTA_SIZE, REPLAY_MODEL, splitIntoDeltas, toolCallChunks } from './chunks';

describe('splitIntoDeltas', () => {
  it('restores the text when joined and keeps every piece within the size', () => {
    // Arrange
    const texts = faker.helpers.multiple(() => faker.lorem.paragraphs(2), { count: 20 });

    // Act
    const splits = texts.map((text) => splitIntoDeltas(text));

    // Assert
    splits.forEach((pieces, index) => {
      expect(pieces.join('')).toBe(texts[index]);
      pieces.forEach((piece) => expect(piece.length).toBeLessThanOrEqual(DELTA_SIZE));
    });
  });

  it.each([
    ['empty text', '', 0],
    ['exactly one piece', 'x'.repeat(DELTA_SIZE), 1],
    ['one character over', 'x'.repeat(DELTA_SIZE + 1), 2],
  ])('handles %s', (_name, text, count) => {
    // Act
    const pieces = splitIntoDeltas(text);

    // Assert
    expect(pieces).toHaveLength(count);
  });
});

describe('toolCallChunks', () => {
  const comparison = makeComparison();
  const toolCallId = faker.string.uuid();

  it('streams the input in deltas that rebuild the exact JSON', () => {
    // Act
    const chunks = toolCallChunks({ toolName: 'renderComparison', toolCallId, input: comparison });
    const json = chunks.flatMap((chunk) =>
      chunk.type === 'tool-input-delta' ? [chunk.inputTextDelta] : [],
    );

    // Assert
    expect(json.length).toBeGreaterThan(1);
    expect(JSON.parse(json.join(''))).toEqual(comparison);
  });

  it('frames the call like the live route: start, input, finish', () => {
    // Act
    const types = toolCallChunks({
      toolName: 'renderComparison',
      toolCallId,
      input: comparison,
      output: { rendered: true },
    }).map((chunk) => chunk.type);

    // Assert
    expect(types.slice(0, 3)).toEqual(['start', 'start-step', 'tool-input-start']);
    expect(types.slice(-4)).toEqual([
      'tool-input-available',
      'tool-output-available',
      'finish-step',
      'finish',
    ]);
  });

  it('leaves the clarification without output so the user can answer it', () => {
    // Act
    const types = toolCallChunks({ toolName: 'askClarification', toolCallId, input: {} }).map(
      (chunk) => chunk.type,
    );

    // Assert
    expect(types).not.toContain('tool-output-available');
  });

  it('continues the given message and marks it as pre-rendered', () => {
    // Arrange
    const messageId = faker.string.uuid();

    // Act
    const [start] = toolCallChunks({
      toolName: 'askClarification',
      toolCallId,
      input: {},
      messageId,
    });

    // Assert
    expect(start).toEqual({ type: 'start', messageId, messageMetadata: { model: REPLAY_MODEL } });
  });
});
