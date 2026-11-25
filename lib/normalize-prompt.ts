import { PROMPT_LIMIT, promptLength } from '@/lib/prompt-limit';

export const LINK_PLACEHOLDER = '[link]';

const URL = /\b(?:https?:\/\/|www\.)\S+/gi;
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const WHITESPACE = /\s+/g;

/**
 * Input hygiene, NOT a security boundary.
 *
 * - Prompt injection cannot be filtered out of plain text. It is contained instead: no secrets in the system prompt,
 *   side-effect-free tools, schema-constrained output, short input, rate limiting.
 *
 * So markup is deliberately kept: "Array<T> vs T[]" is a legitimate dilemma.
 * Links become a placeholder as a product rule: battles compare things, not URLs.
 */
export const normalizePrompt = (raw: string): string =>
  raw.replace(URL, LINK_PLACEHOLDER).replace(CONTROL_CHARS, '').replace(WHITESPACE, ' ').trim();

export type PromptCheck =
  { ok: true; prompt: string } | { ok: false; reason: 'empty' | 'too_long' };

/**
 * Server-side gate. The limit applies to the trimmed raw text, exactly as the client
 * counter shows it; emptiness is checked after normalizing, so control-only input is rejected.
 */
export const checkPrompt = (raw: string, limit: number = PROMPT_LIMIT): PromptCheck => {
  if (promptLength(raw) > limit) return { ok: false, reason: 'too_long' };
  const prompt = normalizePrompt(raw);
  if (prompt.length === 0) return { ok: false, reason: 'empty' };
  return { ok: true, prompt };
};
