import { RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { chatErrorMessage } from '@/lib/chat-status';

export const RETRY_LABEL = 'Try again';

interface ChatErrorNoticeProps {
  error: unknown;
  onRetry: () => void;
}

export const ChatErrorNotice = ({ error, onRetry }: ChatErrorNoticeProps) => (
  <div
    role="alert"
    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-danger/40 bg-danger/10 px-4 py-3"
  >
    <p>{chatErrorMessage(error)}</p>
    <Button variant="outline" size="sm" onClick={onRetry}>
      <RotateCcw aria-hidden />
      {RETRY_LABEL}
    </Button>
  </div>
);
