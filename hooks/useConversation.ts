"use client";

import { useEffect, useState, useCallback } from "react";

type Message = {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  edited_at?: string | null;
};

export function useConversation(conversationId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }
    const res = await fetch(`/api/chat/messages?conversationId=${conversationId}`, {
      credentials: "include",
    });
    if (!res.ok) {
      setLoading(false);
      return;
    }
    const data = await res.json();
    setMessages(data.messages || []);
    setLoading(false);
  }, [conversationId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const res = await fetch(`/api/conversations/${conversationId}/send`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text }),
    });
    if (res.ok) {
      await fetchMessages();
    }
  };

  const editMessage = async (messageId: string, text: string) => {
    const res = await fetch(`/api/chat/messages/${messageId}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text }),
    });
    if (res.ok) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, content: text, edited_at: new Date().toISOString() } : m
        )
      );
    }
  };

  const deleteMessage = async (messageId: string) => {
    const res = await fetch(`/api/chat/messages/${messageId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    }
  };

  return {
    messages,
    loading,
    sendMessage,
    editMessage,
    deleteMessage,
    refetch: fetchMessages,
  };
}
