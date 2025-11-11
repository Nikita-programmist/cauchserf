"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import { useRealtimeConversation } from "@/hooks/useRealtimeConversation";

type Message = {
  id: string;
  text: string;
  sender_id: string;
  created_at: string;
  edited_at: string | null;
  optimistic?: boolean;
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

  const createdAtRaw = input.created_at ?? input.createdAt ?? null;
  const createdAt =
    typeof createdAtRaw === "string"
      ? createdAtRaw
      : createdAtRaw instanceof Date
      ? createdAtRaw.toISOString()
      : new Date().toISOString();

  const editedRaw = input.edited_at ?? input.editedAt ?? null;
  const editedAt =
    typeof editedRaw === "string"
      ? editedRaw
      : editedRaw instanceof Date
      ? editedRaw.toISOString()
      : null;

  const text =
    typeof input.text === "string"
      ? input.text
      : typeof input.content === "string"
      ? input.content
      : typeof input.body === "string"
      ? input.body
      : "";

  return {
    id,
    text,
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
  currentUserId?: string;
  header?: ReactNode;
};

type AuthIssue = "none" | "unauthorized" | "forbidden";

const MESSAGE_LIMIT = 50;

export default function ChatWindow({
  conversationId,
  currentUserId,
  header,
}: ChatWindowProps) {
  const router = useRouter();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    conversationId ?? null,
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const [authIssue, setAuthIssue] = useState<AuthIssue>("none");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setActiveConversationId(conversationId ?? null);
  }, [conversationId]);

  const fetchMessages = useCallback(async (id: string) => {
    const res = await fetch(
      `/api/conversations/${id}/messages?limit=${MESSAGE_LIMIT}`,
      {
        credentials: "include",
      },
    );

    const data = await res.json().catch(() => null);

    if (res.status === 401) {
      setAuthIssue("unauthorized");
      throw new Error("unauthorized");
    }

    if (res.status === 403) {
      setAuthIssue("forbidden");
      throw new Error("forbidden");
    }

    if (!res.ok || !data) {
      setAuthIssue("none");
      throw new Error(
        typeof data?.error === "string" ? data.error : "failed",
      );
    }

    setAuthIssue("none");

    const normalized = (Array.isArray(data?.items) ? data.items : [])
      .map((item: any) => normalizeMessage(item))
      .filter((item): item is Message => Boolean(item));

    normalized.sort((a, b) => a.created_at.localeCompare(b.created_at));

    return normalized;
  }, []);

  useEffect(() => {
    let active = true;

    if (!conversationId) {
      setActiveConversationId(null);
      setMessages([]);
      setAuthIssue("none");
      setLoading(false);
      setLoadError(null);
      return;
    }

    setLoading(true);
    setLoadError(null);
    setSubmitError(null);

    fetchMessages(conversationId)
      .then((normalized) => {
        if (!active) return;
        setActiveConversationId(conversationId);
        setMessages(normalized);
      })
      .catch((err) => {
        if (!active) return;
        if (
          err instanceof Error &&
          (err.message === "unauthorized" || err.message === "forbidden")
        ) {
          setMessages([]);
          setLoadError(null);
        } else {
          setMessages([]);
          setLoadError("Не удалось загрузить сообщения. Попробуйте позже.");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [conversationId, fetchMessages, reloadKey]);

  const handleRetry = useCallback(() => {
    if (!pending) {
      setReloadKey((prev) => prev + 1);
    }
  }, [pending]);

  const handleRealtimeInsert = useCallback(
    (payload: any) => {
      if (!activeConversationId) {
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
    [activeConversationId],
  );

  const handleRealtimeUpdate = useCallback(
    (payload: any) => {
      if (!activeConversationId) {
        return;
      }

      if (
        payload?.conversation_id &&
        payload.conversation_id !== activeConversationId
      ) {
        return;
      }

      if (payload?.deleted_at) {
        setMessages((prev) => removeMessage(prev, payload.id));
        return;
      }

      const message = normalizeMessage(payload);
      if (message) {
        setMessages((prev) => upsertMessage(prev, message));
      }
    },
    [activeConversationId],
  );

  const realtimeConversationId = activeConversationId ?? "__none__";

  useRealtimeConversation(
    realtimeConversationId,
    handleRealtimeInsert,
    handleRealtimeUpdate,
  );

  const handleSend = useCallback(async () => {
    if (!conversationId) {
      return;
    }

    const value = text.trim();
    if (!value || pending) return;

    setPending(true);
    setSubmitError(null);

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      sender_id: currentUserId ?? "optimistic",
      text: value,
      created_at: new Date().toISOString(),
      edited_at: null,
      optimistic: true,
    };

    setMessages((prev) => upsertMessage(prev, optimisticMessage));

    let authError = false;

    try {
      const res = await fetch(`/api/conversations/${conversationId}/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ text: value }),
      });

      const data = await res.json().catch(() => null);

      if (res.status === 401) {
        authError = true;
        setAuthIssue("unauthorized");
        throw new Error("unauthorized");
      }

      if (res.status === 403) {
        authError = true;
        setAuthIssue("forbidden");
        throw new Error("forbidden");
      }

      if (!res.ok || !data?.message) {
        setAuthIssue("none");
        throw new Error(
          typeof data?.error === "string" ? data.error : "failed",
        );
      }

      setAuthIssue("none");

      const normalized = normalizeMessage(data.message);

      setMessages((prev) => {
        const withoutTemp = removeMessage(prev, tempId);
        return normalized ? upsertMessage(withoutTemp, normalized) : withoutTemp;
      });

      setText("");
    } catch (err) {
      setMessages((prev) => removeMessage(prev, tempId));
      if (!authError) {
        setSubmitError(
          "Не удалось отправить сообщение. Попробуйте ещё раз.",
        );
      }
    } finally {
      setPending(false);
    }
  }, [conversationId, currentUserId, pending, text]);

  const headerContent = useMemo(() => header ?? null, [header]);

  if (!conversationId) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/50 p-6 text-center text-sm text-slate-500">
        Выберите чат, чтобы начать переписку
      </div>
    );
  }

  if (authIssue === "unauthorized") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-600">
        <p>Чтобы продолжить переписку, пожалуйста, войдите в аккаунт.</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => router.push("/auth")}
            className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
          >
            Войти
          </button>
          <button
            type="button"
            onClick={handleRetry}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Повторить
          </button>
        </div>
      </div>
    );
  }

  if (authIssue === "forbidden") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-600">
        <p>Нет доступа к этой переписке.</p>
        <button
          type="button"
          onClick={handleRetry}
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
        >
          Повторить
        </button>
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
        ) : loadError ? (
          <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <p>{loadError}</p>
            <button
              type="button"
              onClick={handleRetry}
              className="self-start rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-100"
            >
              Повторить
            </button>
          </div>
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
                  } ${m.optimistic ? "opacity-70" : ""}`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.text}</p>
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
            disabled={pending}
            className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none disabled:opacity-60"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={pending || text.trim().length === 0}
            className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Отправить
          </button>
        </div>
      </div>
    </div>
  );
}
