"use client";

import { useEffect, useState, useCallback } from "react";
import { listMessages, sendMessage, MessageDto } from "@/lib/chatService";

export function useConversation(conversationId: string | null) {
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }
    try {
      const items = await listMessages(conversationId);
      setMessages(items ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const send = async (text: string) => {
    if (!text.trim() || !conversationId) return;
    const message = await sendMessage(conversationId, text);
    if (message) {
      setMessages((prev) => [...prev, message]);
    } else {
      await fetchMessages();
    }
  };

  return {
    messages,
    loading,
    sendMessage: send,
    refetch: fetchMessages,
  };
}
