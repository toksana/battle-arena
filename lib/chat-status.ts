import { APICallError, type ChatStatus } from 'ai';

const HTTP_BAD_REQUEST = 400;

export const INVALID_PROMPT_MESSAGE =
  'This dilemma could not be sent. Check its length and try again.';
export const GENERIC_CHAT_ERROR = 'The arena glitched mid-battle. Please try again.';

/** True while a request is in flight, so input and presets stay locked. */
export const isChatBusy = (status: ChatStatus): boolean =>
  status === 'submitted' || status === 'streaming';

/**
 * Maps any chat error to fixed client-side copy, so server or provider text is never rendered.
 */
export const chatErrorMessage = (error: unknown): string =>
  APICallError.isInstance(error) && error.statusCode === HTTP_BAD_REQUEST
    ? INVALID_PROMPT_MESSAGE
    : GENERIC_CHAT_ERROR;
