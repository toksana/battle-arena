import type { UIMessage } from 'ai';
import { z } from 'zod';

import type { ClarificationAnswer } from './schemas';
import type { ArenaToolName, ArenaTools } from './tools';

export const MessageMetadataSchema = z.object({
  /** Set on the user message of a pre-rendered battle; the client replays it, no API call. */
  replayPresetId: z.string().optional(),
  model: z.string().optional(),
  inputTokens: z.number().optional(),
  outputTokens: z.number().optional(),
});

export type MessageMetadata = z.infer<typeof MessageMetadataSchema>;

/** Never-used data parts: the arena streams tool parts and text only. */
type ArenaDataParts = Record<string, never>;

export type ArenaUIMessage = UIMessage<MessageMetadata, ArenaDataParts, ArenaTools>;

export type ArenaPart = ArenaUIMessage['parts'][number];

/** The typed part for one tool, e.g. `ArenaToolPart<'askClarification'>`. */
export type ArenaToolPart<Name extends ArenaToolName> = Extract<
  ArenaPart,
  { type: `tool-${Name}` }
>;

/** A picked clarification goal, addressed to the tool call it answers. */
export interface GoalAnswer extends ClarificationAnswer {
  toolCallId: string;
}
