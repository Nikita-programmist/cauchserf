"use client";

import { useEffect, useState, useCallback } from "react";

type Message = {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  edited_at?: string | null;
};

export function useConversation(requestId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!requestId) {
      setMessages([]);
      setLoading(false);
      return;
    }
    const params = new URLSearchParams({ requestId, limit: '100', offset: '0' });
    const res = await fetch(`/api/messages?${params.toString()}`, {
      credentials: "include",
    });
    if (!res.ok) {
      setLoading(false);
      return;
    }
    const data = await res.json();
    if (typeof data?.conversationId === 'string') {
      setConversationId(data.conversationId);
    }
    const normalized = (Array.isArray(data?.messages) ? data.messages : []).map(
      (item: any) => ({
        id: item.id,
        content: item.text ?? item.content ?? '',
        sender_id: item.sender_id,
        created_at: item.created_at,
        edited_at: item.edited_at ?? null,
      })
    );
    setMessages(normalized);
    setLoading(false);
  }, [requestId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    if (!requestId) return;
    const res = await fetch(`/api/messages`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, text }),
    });
    if (res.ok) {
      const data = await res.json().catch(() => null);
      if (data?.conversationId) {
        setConversationId(data.conversationId);
      }
      if (data?.message) {
        const message = {
          id: data.message.id,
          content: data.message.text ?? data.message.content ?? text,
          sender_id: data.message.sender_id,
          created_at: data.message.created_at,
          edited_at: data.message.edited_at ?? null,
        };
        setMessages((prev) => [...prev, message]);
      } else {
        await fetchMessages();
      }
    }
  };

  const editMessage = async (messageId: string, text: string) => {
    const res = await fetch(`/api/messages/${messageId}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (res.ok) {
      const payload = await res.json().catch(() => null);
      if (payload?.message) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  content: payload.message.text ?? text,
                  edited_at: payload.message.edited_at ?? new Date().toISOString(),
                }
              : m
          )
        );
      }
    }
  };

  const deleteMessage = async (messageId: string) => {
    const res = await fetch(`/api/messages/${messageId}`, {
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
    conversationId,
    sendMessage,
    editMessage,
    deleteMessage,
    refetch: fetchMessages,
  };
}
