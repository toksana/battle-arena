'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';

import {
  dropFailedToolParts,
  hasFailedTool,
  shouldContinueAfterClarification,
} from '@/lib/ai/continuation';
import type { ArenaUIMessage, GoalAnswer } from '@/lib/ai/messages';
import { isChatBusy } from '@/lib/chat-status';
import { createArenaTransport } from '@/lib/replay/transport';

const CHAT_API = '/api/chat';

/**
 * Created once and shared by every render: live battles go to the API, pre-rendered preset
 * battles replay their recording client-side.
 */
const transport = createArenaTransport(new DefaultChatTransport<ArenaUIMessage>({ api: CHAT_API }));

/**
 * One battle at a time: each new dilemma starts a fresh history, so the model never
 * sees earlier battles and the 20-message cap is never reached in normal use.
 */
export const useArenaChat = () => {
  const chat = useChat<ArenaUIMessage>({
    transport,
    sendAutomaticallyWhen: shouldContinueAfterClarification,
  });

  const startBattle = (prompt: string) => {
    chat.setMessages([]);
    void chat.sendMessage({ text: prompt });
  };

  /** The pick becomes the tool output; sendAutomaticallyWhen then requests the comparison. */
  const answerClarification = ({ toolCallId, goalId, label }: GoalAnswer) => {
    void chat.addToolOutput({ tool: 'askClarification', toolCallId, output: { goalId, label } });
  };

  /** Resumes after an answered clarification instead of asking for the goal again. */
  const retry = () => {
    chat.clearError();
    const trimmed = dropFailedToolParts(chat.messages);
    if (shouldContinueAfterClarification({ messages: trimmed })) {
      chat.setMessages(trimmed);
      void chat.sendMessage();
      return;
    }
    void chat.regenerate();
  };

  return {
    messages: chat.messages,
    status: chat.status,
    error: chat.error,
    hasFailed: chat.error !== undefined || hasFailedTool(chat.messages),
    isBusy: isChatBusy(chat.status),
    startBattle,
    answerClarification,
    retry,
  };
};
