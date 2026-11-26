import type { UIMessage } from 'ai';
import { z } from 'zod';

import type { ArenaTools } from './tools';

export const MessageMetadataSchema = z.object({
  model: z.string().optional(),
  inputTokens: z.number().optional(),
  outputTokens: z.number().optional(),
});

export type MessageMetadata = z.infer<typeof MessageMetadataSchema>;

/** Never-used data parts: the arena streams tool parts and text only. */
type ArenaDataParts = Record<string, never>;

export type ArenaUIMessage = UIMessage<MessageMetadata, ArenaDataParts, ArenaTools>;
