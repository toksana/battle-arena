export interface Preset {
  id: string;
  label: string;
  emoji: string;
  prompt: string;
}

export const PRESETS = [
  {
    id: 'coffee-vs-smoothie',
    label: 'Coffee vs. Smoothie',
    emoji: '☕',
    prompt: 'Coffee vs. Smoothie',
  },
  {
    id: 'claude-vs-groq',
    label: 'Claude vs. Groq',
    emoji: '🤖',
    prompt: 'Claude vs. Groq for an AI product',
  },
  {
    id: 'christmas-vs-new-year',
    label: 'Christmas vs. New Year',
    emoji: '🎄',
    prompt: 'Christmas vs. New Year celebration',
  },
  {
    id: 'python-vs-typescript',
    label: 'AI Agents: Python vs. TypeScript',
    emoji: '🧠',
    prompt: 'Building AI agents: Python vs. TypeScript',
  },
] as const satisfies readonly Preset[];

/** Ids of the built-in presets; each one has a recorded battle for replay. */
export type PresetId = (typeof PRESETS)[number]['id'];
