"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useRealtimeConversation } from "@/hooks/useRealtimeConversation";

type Message = {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  edited_at: string | null;
};

function normalizeMessage(input: any): Message | null {
  if (!input) return null;

  const id = typeof input.id === "string" ? input.id : null;
  const senderId =
    typeof input.sender_id === "string"
      ? input.sender_id
      : typeof input.senderId === "string"
      ? input.senderId
      : null;

  if (!id || !senderId) {
    return null;
  }

  const createdAt =
    typeof input.created_at === "string"
      ? input.created_at
      : typeof input.createdAt === "string"
      ? input.createdAt
      : new Date().toISOString();

  const rawEdited = input.edited_at ?? input.editedAt ?? null;
  const editedAt =
    typeof rawEdited === "string"
      ? rawEdited
      : rawEdited instanceof Date
      ? rawEdited.toISOString()
      : null;

  const content =
    typeof input.content === "string"
      ? input.content
      : typeof input.text === "string"
      ? input.text
      : "";

  return {
    id,
    content,
    sender_id: senderId,
    created_at: createdAt,
    edited_at: editedAt,
  };
}

function upsertMessage(list: Message[], message: Message) {
  const next = [...list];
  const index = next.findIndex((item) => item.id === message.id);
  if (index >= 0) {
    next[index] = message;
  } else {
    next.push(message);
  }
  next.sort((a, b) => a.created_at.localeCompare(b.created_at));
  return next;
}

function removeMessage(list: Message[], id: string) {
  return list.filter((item) => item.id !== id);
}

export type ChatWindowProps = {
  conversationId: string;
  currentUserId: string;
  header?: ReactNode;
};

export default function ChatWindow({
  conversationId,
  currentUserId,
  header,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const fetchMessages = useCallback(async (id: string) => {
    const res = await fetch(
      `/api/chat/messages?conversationId=${encodeURIComponent(id)}`,
      {
        credentials: "include",
      }
    );

    const data = await res.json().catch(() => null);

    if (!res.ok || !data) {
      throw new Error(
        (data && typeof data.error === "string" ? data.error : null) ??
          "failed"
      );
    }

    const normalized = (Array.isArray(data?.messages) ? data.messages : [])
      .map((item: any) => normalizeMessage(item))
      .filter((item): item is Message => Boolean(item));

    normalized.sort((a, b) => a.created_at.localeCompare(b.created_at));

    return normalized;
  }, []);

  useEffect(() => {
    let active = true;

    setMessages([]);
    setLoading(true);
    setError(null);
    setSubmitError(null);
    setEditingId(null);
    setText("");
    setPending(false);

    (async () => {
      try {
        const normalized = await fetchMessages(conversationId);
        if (!active) return;
        setMessages(normalized);
        setError(null);
      } catch (err) {
        if (!active) return;
        setMessages([]);
        setError("Не удалось загрузить сообщения. Попробуйте позже.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [conversationId, fetchMessages]);

  useEffect(() => {
    fetch(`/api/conversations/${conversationId}/read`, {
      method: "POST",
      credentials: "include",
    }).catch(() => undefined);
  }, [conversationId]);

  const handleRealtimeInsert = useCallback((payload: any) => {
    if (payload?.deleted_at) {
      setMessages((prev) => removeMessage(prev, payload.id));
      return;
    }

    const message = normalizeMessage(payload);
    if (message) {
      setMessages((prev) => upsertMessage(prev, message));
    }
  }, []);

  const handleRealtimeUpdate = useCallback((payload: any) => {
    if (payload?.deleted_at) {
      setMessages((prev) => removeMessage(prev, payload.id));
      return;
    }

    const message = normalizeMessage(payload);
    if (message) {
      setMessages((prev) => upsertMessage(prev, message));
    }
  }, []);

  useRealtimeConversation(
    conversationId,
    handleRealtimeInsert,
    handleRealtimeUpdate
  );

  const handleSend = async () => {
    const value = text.trim();
    if (!value || pending) return;

    setPending(true);
    setSubmitError(null);

    try {
      if (editingId) {
        const res = await fetch(`/api/chat/messages/${editingId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ content: value }),
        });

        const data = await res.json().catch(() => null);

        if (!res.ok || !data?.message) {
          throw new Error(data?.error ?? "failed");
        }

        const updated = normalizeMessage(data.message);
        if (updated) {
          setMessages((prev) => upsertMessage(prev, updated));
        }

        setEditingId(null);
        setText("");
      } else {
        const res = await fetch(
          `/api/conversations/${conversationId}/send`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ content: value }),
          }
        );

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(data?.error ?? "failed");
        }

        const created = normalizeMessage(data);
        if (created) {
          setMessages((prev) => upsertMessage(prev, created));
        }

        setText("");
      }
    } catch (err) {
      setSubmitError("Не удалось отправить сообщение. Попробуйте снова.");
    } finally {
      setPending(false);
    }
  };

  const handleDelete = async (messageId: string) => {
    setSubmitError(null);

    try {
      const res = await fetch(`/api/chat/messages/${messageId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "failed");
      }

      setMessages((prev) => removeMessage(prev, messageId));
      if (editingId === messageId) {
        setEditingId(null);
        setText("");
      }
    } catch (err) {
      setSubmitError("Не удалось удалить сообщение. Попробуйте снова.");
    }
  };

  return (
    <div className="flex h-full flex-col">
      {header ? (
        <div className="border-b bg-white p-3">{header}</div>
      ) : null}
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {loading ? (
          <p className="text-sm text-gray-400">Загружаю...</p>
        ) : error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-gray-400">Пока нет сообщений</p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${
                m.sender_id === currentUserId ? "justify-end" : "justify-start"
              }`}
            >
              <div className="relative max-w-[75%] rounded-lg bg-gray-100 px-3 py-2 text-sm">
                <p className="whitespace-pre-wrap break-words">{m.content}</p>
                {m.edited_at ? (
                  <span className="ml-2 text-[10px] text-gray-400">изменено</span>
                ) : null}
                {m.sender_id === currentUserId ? (
                  <div className="absolute -right-6 top-1 flex flex-col gap-1">
                    <button
                      onClick={() => {
                        setEditingId(m.id);
                        setText(m.content);
                        setSubmitError(null);
                      }}
                      className="text-[10px] text-blue-500"
                    >
                      изм
                    </button>
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="text-[10px] text-red-500"
                    >
                      ×
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
      <div className="flex flex-col gap-2 border-t p-3">
        {submitError ? (
          <p className="text-xs text-red-500">{submitError}</p>
        ) : null}
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={editingId ? "Редактируешь..." : "Написать сообщение"}
            className="flex-1 rounded border px-2 py-1 text-sm"
          />
          <button
            onClick={handleSend}
            disabled={pending}
            className="rounded bg-black px-3 py-1 text-sm text-white disabled:opacity-60"
          >
            {editingId ? "Сохранить" : "Отпр."}
          </button>
        </div>
      </div>
    </div>
  );
}
