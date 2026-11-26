import { tool, type InferUITools, type ToolSet } from 'ai';
import { z } from 'zod';

import {
  ClarificationAnswerSchema,
  ClarificationSchema,
  ComparisonSchema,
  FallbackChipsSchema,
} from './schemas';

/** Display tools only acknowledge rendering, so the history never holds a call without a result. */
const RenderedSchema = z.object({ rendered: z.literal(true) });
const acknowledgeRender = async () => ({ rendered: true as const });

export const tools = {
  /** Human-in-the-loop: no execute; the client answers with addToolOutput. */
  askClarification: tool({
    description:
      'Ask which goal the comparison should optimize for. Offer exactly 3 goals that: ' +
      '(1) cover clearly different priorities (e.g. performance, cost, experience), never synonyms; ' +
      '(2) would change which criteria matter most, ideally so different goals could favor different options; ' +
      '(3) describe an outcome for the user, never an option itself ("Get energized", not "Choose coffee"); ' +
      '(4) are realistic reasons people compare these two specific options.',
    inputSchema: ClarificationSchema,
    outputSchema: ClarificationAnswerSchema,
  }),
  renderComparison: tool({
    description: 'Render the side-by-side comparison card for two options.',
    inputSchema: ComparisonSchema,
    outputSchema: RenderedSchema,
    execute: acknowledgeRender,
  }),
  renderFallbackChips: tool({
    description: 'Offer 3 safe dilemmas the user can start instead of an out-of-scope request.',
    inputSchema: FallbackChipsSchema,
    outputSchema: RenderedSchema,
    execute: acknowledgeRender,
  }),
} satisfies ToolSet;

export type ArenaTools = InferUITools<typeof tools>;
export type ArenaToolName = keyof typeof tools;
