import { safeValidateUIMessages } from 'ai';

import { checkPrompt } from '@/lib/normalize-prompt';

import { MessageMetadataSchema, type ArenaUIMessage } from './messages';
import { tools } from './tools';

/** Caps the history the client may resend: a battle needs ~4 messages, history stays short. */
export const MAX_MESSAGES = 20;

export type PrepareError = 'invalid_messages' | 'too_many_messages' | 'empty' | 'too_long';

export type PrepareResult =
  { ok: true; messages: ArenaUIMessage[] } | { ok: false; error: PrepareError };

const userText = (message: ArenaUIMessage): string =>
  message.parts.flatMap((part) => (part.type === 'text' ? [part.text] : [])).join(' ');

type UserCheck = { ok: true; message: ArenaUIMessage } | { ok: false; error: PrepareError };

/** Every user message is re-checked: the client could have edited older ones. Only text survives. */
const normalizeUserMessage = (message: ArenaUIMessage): UserCheck => {
  if (message.role !== 'user') return { ok: true, message };
  const check = checkPrompt(userText(message));
  if (!check.ok) return { ok: false, error: check.reason };
  return { ok: true, message: { ...message, parts: [{ type: 'text', text: check.prompt }] } };
};

/**
 * Server-side gate for the client-held chat history: structural validation against the
 * tool schemas, a history cap, and the same length rules the composer enforces.
 */
export const prepareMessages = async (raw: unknown): Promise<PrepareResult> => {
  const validated = await safeValidateUIMessages<ArenaUIMessage>({
    messages: raw,
    // User messages carry no metadata; only assistant messages get it from the stream.
    metadataSchema: MessageMetadataSchema.optional(),
    tools,
  });
  if (!validated.success) return { ok: false, error: 'invalid_messages' };
  if (validated.data.length > MAX_MESSAGES) return { ok: false, error: 'too_many_messages' };

  const checks = validated.data.map(normalizeUserMessage);
  const failed = checks.find((check) => !check.ok);
  if (failed && !failed.ok) return { ok: false, error: failed.error };

  return {
    ok: true,
    messages: checks.flatMap((check) => (check.ok ? [check.message] : [])),
  };
};

const DELIMITER_TAG = /<\/?user_dilemma>/gi;

/** Marks user text as data for the model; the delimiter itself cannot be smuggled in. */
export const wrapDilemma = (text: string): string =>
  `<user_dilemma>${text.replace(DELIMITER_TAG, '')}</user_dilemma>`;

export const wrapUserMessages = (messages: ArenaUIMessage[]): ArenaUIMessage[] =>
  messages.map((message) =>
    message.role === 'user'
      ? {
          ...message,
          parts: message.parts.map((part) =>
            part.type === 'text' ? { ...part, text: wrapDilemma(part.text) } : part,
          ),
        }
      : message,
  );
