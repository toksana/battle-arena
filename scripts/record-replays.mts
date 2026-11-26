/**
 * Records pre-rendered preset battles from a running dev server into lib/replay/fixtures.
 * Usage: node scripts/record-replays.mts [baseUrl]   (default http://localhost:3123)
 * Costs one clarification plus one comparison per goal for every preset (16 model calls).
 */
import { mkdir, writeFile } from 'node:fs/promises';

import { ClarificationSchema, ComparisonSchema } from '../lib/ai/schemas.ts';
import { PRESETS, type Preset } from '../lib/presets.ts';

const BASE_URL = process.argv[2] ?? 'http://localhost:3123';
const OUT_DIR = new URL('../lib/replay/fixtures/', import.meta.url);
const MAX_ATTEMPTS = 3;

interface ToolCall {
  toolCallId: string;
  input: unknown;
}

const userMessage = (text: string) => ({
  id: crypto.randomUUID(),
  role: 'user',
  parts: [{ type: 'text', text }],
});

const readChunks = (body: string): Array<Record<string, unknown>> =>
  body
    .split('\n')
    .filter((line) => line.startsWith('data: {'))
    .map((line) => JSON.parse(line.slice('data: '.length)));

/** One request; throws unless the model called the expected tool with valid input. */
const callTool = async (messages: unknown[], toolName: string): Promise<ToolCall> => {
  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ messages }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  const call = readChunks(await res.text()).find(
    (chunk) => chunk.type === 'tool-input-available' && chunk.toolName === toolName,
  );
  if (typeof call?.toolCallId !== 'string') throw new Error(`no valid ${toolName} call`);
  return { toolCallId: call.toolCallId, input: call.input };
};

/** The model occasionally overshoots a schema limit; a fresh sample usually fits. */
const withRetries = async <T,>(label: string, attempt: () => Promise<T>): Promise<T> => {
  const errors: string[] = [];
  for (let index = 0; index < MAX_ATTEMPTS; index += 1) {
    try {
      return await attempt();
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      errors.push(error.message);
      console.warn(`  retry ${label}: ${error.message}`);
    }
  }
  throw new Error(`${label} failed ${MAX_ATTEMPTS} times: ${errors.join('; ')}`);
};

const recordPreset = async (preset: Preset) => {
  const user = userMessage(preset.prompt);
  const ask = await withRetries(`${preset.id} clarification`, () =>
    callTool([user], 'askClarification'),
  );
  const clarification = ClarificationSchema.parse(ask.input);

  const comparisons = [];
  // Sequential on purpose: stays well inside the rate limit and is easy to follow in the log.
  for (const goal of clarification.goals) {
    const answered = {
      id: crypto.randomUUID(),
      role: 'assistant',
      parts: [
        {
          type: 'tool-askClarification',
          toolCallId: ask.toolCallId,
          state: 'output-available',
          input: clarification,
          output: { goalId: goal.id, label: goal.label },
        },
      ],
    };
    const call = await withRetries(`${preset.id} → ${goal.id}`, () =>
      callTool([user, answered], 'renderComparison'),
    );
    comparisons.push({ goalId: goal.id, comparison: ComparisonSchema.parse(call.input) });
    console.log(`  ${preset.id} → ${goal.label}`);
  }

  return { presetId: preset.id, clarification, comparisons };
};

await mkdir(OUT_DIR, { recursive: true });
for (const preset of PRESETS) {
  console.log(`Recording ${preset.id}`);
  const replay = await recordPreset(preset);
  await writeFile(new URL(`${preset.id}.json`, OUT_DIR), `${JSON.stringify(replay, null, 2)}\n`);
}
