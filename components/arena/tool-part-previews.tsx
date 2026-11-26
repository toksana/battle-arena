import type { ArenaToolPart } from '@/lib/ai/messages';

import { ComparisonCard } from './comparison-card';

export const ComparisonPreview = ({ part }: { part: ArenaToolPart<'renderComparison'> }) =>
  part.state === 'output-error' ? null : (
    <ComparisonCard input={part.input} isStreaming={part.state === 'input-streaming'} />
  );
