"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
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
      : typeof input.body === "string"
      ? input.body
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

type ChatWindowProps = {
  conversationId: string | null;
  requestId?: string | null;
  currentUserId?: string;
  header?: ReactNode;
};

export default function ChatWindow({
  conversationId,
  requestId,
  currentUserId,
  header,
}: ChatWindowProps) {
  const participant = null as {
    id: string;
    name?: string;
    avatar_url?: string | null;
  } | null;
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    conversationId ?? null
  );

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);

  const fetchMessages = useCallback(async (id: string) => {
    const params = new URLSearchParams({ requestId: id, limit: "100", offset: "0" });
    const res = await fetch(`/api/messages?${params.toString()}`, {
      credentials: "include",
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data) {
      throw new Error(
        (data && typeof data.error === "string" ? data.error : null) ??
          "failed"
      );
    }

    if (typeof data?.conversationId === "string") {
      setActiveConversationId(data.conversationId);
    }

    const normalized = (Array.isArray(data?.messages) ? data.messages : [])
      .map((item: any) => normalizeMessage(item))
      .filter((item): item is Message => Boolean(item));

    normalized.sort((a, b) => a.created_at.localeCompare(b.created_at));

    return normalized;
  }, []);

  useEffect(() => {
    if (!requestId) {
      setMessages([]);
      setError(null);
      setSubmitError(null);
      setText("");
      setPending(false);
      setActiveConversationId(conversationId ?? null);
      setLoading(false);
      return;
    }

    let active = true;

    setLoading(true);
    setError(null);
    setSubmitError(null);
    setText("");
    setPending(false);

    (async () => {
      try {
        const normalized = await fetchMessages(requestId);
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
  }, [conversationId, requestId, fetchMessages]);

  const handleRealtimeInsert = useCallback(
    (payload: any) => {
      if (!activeConversationId) {
        return;
      }

      if (payload?.deleted_at) {
        setMessages((prev) => removeMessage(prev, payload.id));
        return;
      }

      if (
        payload?.conversation_id &&
        payload.conversation_id !== activeConversationId
      ) {
        return;
      }

      const message = normalizeMessage(payload);
      if (message) {
        setMessages((prev) => upsertMessage(prev, message));
      }
    },
    [activeConversationId]
  );

  const handleRealtimeUpdate = useCallback(
    (payload: any) => {
      if (!activeConversationId) {
        return;
      }

      if (payload?.deleted_at) {
        setMessages((prev) => removeMessage(prev, payload.id));
        return;
      }

      if (
        payload?.conversation_id &&
        payload.conversation_id !== activeConversationId
      ) {
        return;
      }

      const message = normalizeMessage(payload);
      if (message) {
        setMessages((prev) => upsertMessage(prev, message));
      }
    },
    [activeConversationId]
  );

  const realtimeConversationId = activeConversationId ?? "__none__";

  useRealtimeConversation(
    realtimeConversationId,
    handleRealtimeInsert,
    handleRealtimeUpdate
  );

  const handleSend = async () => {
    const value = text.trim();
    if (!value || pending || !requestId) return;

    setPending(true);
    setSubmitError(null);

    try {
      const res = await fetch(`/api/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ requestId, text: value }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.message) {
        setSubmitError("Не удалось отправить");
        throw new Error(data?.error ?? "failed");
      }

      if (typeof data?.conversationId === "string") {
        setActiveConversationId(data.conversationId);
      }

      const normalized = normalizeMessage(data.message);
      if (normalized) {
        setMessages((prev) => upsertMessage(prev, normalized));
      }

      setText("");
    } catch (err) {
      setSubmitError("Не удалось отправить");
    } finally {
      setPending(false);
    }
  };

  const headerContent = useMemo(() => {
    if (header) {
      return header;
    }

    if (!participant) {
      return null;
    }

    const participantName =
      typeof participant.name === "string" && participant.name.trim().length > 0
        ? participant.name.trim()
        : "Собеседник";
    const initials = participantName.charAt(0).toUpperCase();

    return (
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 overflow-hidden rounded-full bg-slate-200 text-sm font-semibold text-slate-600">
          {participant.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={participant.avatar_url}
              alt={participantName}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              {initials || "🙂"}
            </div>
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-slate-900">
            {participantName}
          </span>
          <span className="text-xs text-slate-500">Личные сообщения</span>
        </div>
      </div>
    );
  }, [header, participant]);

  if (!requestId) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/50 p-6 text-center text-sm text-slate-500">
        Выберите заявку, чтобы начать переписку
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      {headerContent ? (
        <div className="border-b border-slate-100 bg-slate-50/80 p-4">
          {headerContent}
        </div>
      ) : null}
      <div className="flex-1 space-y-2 overflow-y-auto bg-white p-4">
        {loading ? (
          <p className="text-sm text-slate-400">Загружаем сообщения…</p>
        ) : error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-slate-400">Пока нет сообщений</p>
        ) : (
          messages.map((m) => {
            const isOwn = currentUserId ? m.sender_id === currentUserId : false;

            return (
              <div
                key={m.id}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`relative max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                    isOwn
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 text-slate-900"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                  {m.edited_at ? (
                    <span
                      className={`mt-1 block text-[10px] ${
                        isOwn ? "text-white/70" : "text-slate-500"
                      }`}
                    >
                      изменено
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>
      <div className="flex flex-col gap-2 border-t border-slate-100 bg-white p-4">
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
            placeholder="Написать сообщение"
            className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={pending}
            className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-60"
          >
            Отправить
          </button>
        </div>
      </div>
    </div>
  );
}
