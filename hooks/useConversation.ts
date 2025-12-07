"use client";

import { useEffect, useState, useCallback } from "react";
import { listMessages, sendMessage, type MessageDto } from "@/lib/chatService";

export function useConversation(conversationId: string | null) {
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }
    try {
      const items = await listMessages(conversationId);
      const sorted = (items ?? []).sort((a, b) =>
        a.createdAt.localeCompare(b.createdAt)
      );
      setMessages(sorted);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const send = async (text: string) => {
    if (!text.trim() || !conversationId) return;
    try {
      const message = await sendMessage(conversationId, text);
      if (message) {
        setMessages((prev) =>
          [...prev, message].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        );
        setError(null);
      } else {
        await fetchMessages();
      }
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  return {
    messages,
    loading,
    error,
    sendMessage: send,
    refetch: fetchMessages,
    appendMessage: (message: MessageDto) =>
      setMessages((prev) =>
        [...prev, message].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      ),
  };
}
