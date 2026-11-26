'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from 'ai';

import type { ArenaUIMessage } from '@/lib/ai/messages';
import { isChatBusy } from '@/lib/chat-status';

const CHAT_API = '/api/chat';

/** Created once: the transport is stateless, so every render can share it. */
const transport = new DefaultChatTransport<ArenaUIMessage>({ api: CHAT_API });

/**
 * One battle at a time: each new dilemma starts a fresh history, so the model never
 * sees earlier battles and the 20-message cap is never reached in normal use.
 */
export const useArenaChat = () => {
  const chat = useChat<ArenaUIMessage>({
    transport,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
  });

  const startBattle = (prompt: string) => {
    chat.setMessages([]);
    void chat.sendMessage({ text: prompt });
  };

  const retry = () => {
    chat.clearError();
    void chat.regenerate();
  };

  return {
    messages: chat.messages,
    status: chat.status,
    error: chat.error,
    isBusy: isChatBusy(chat.status),
    startBattle,
    retry,
  };
};
