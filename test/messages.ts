import { faker } from '@faker-js/faker';

import type { ArenaUIMessage } from '@/lib/ai/messages';
import type { Comparison } from '@/lib/ai/schemas';

export const makeUserMessage = (text: string = faker.lorem.words(4)): ArenaUIMessage => ({
  id: faker.string.uuid(),
  role: 'user',
  parts: [{ type: 'text', text }],
});

export const makeComparisonMessage = (input: Comparison): ArenaUIMessage => ({
  id: faker.string.uuid(),
  role: 'assistant',
  parts: [
    {
      type: 'tool-renderComparison',
      toolCallId: faker.string.uuid(),
      state: 'output-available',
      input,
      output: { rendered: true },
    },
  ],
});
