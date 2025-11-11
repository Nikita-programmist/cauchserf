"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";

import { useRealtimeRoomMessages } from "@/hooks/useRealtimeRoomMessages";

type Message = {
  id: string;
  room_id: string;
  user_id: string | null;
  content: string;
  created_at: string;
  optimistic?: boolean;
};

type MessagesResponse = {
  items: Message[];
};

type ChatWindowProps = {
  roomId: string | null;
  currentUserId?: string;
  header?: ReactNode;
};

type AuthIssue = "none" | "unauthorized" | "forbidden";

const MESSAGE_LIMIT = 50;

function normalizeMessage(payload: any): Message | null {
  if (!payload) return null;
  const id = typeof payload.id === "string" ? payload.id : null;
  const roomId = typeof payload.room_id === "string" ? payload.room_id : null;

  if (!id || !roomId) {
    return null;
  }

  const createdAtRaw = payload.created_at;
  const createdAt =
    typeof createdAtRaw === "string"
      ? createdAtRaw
      : createdAtRaw instanceof Date
      ? createdAtRaw.toISOString()
      : new Date().toISOString();

  const content =
    typeof payload.content === "string"
      ? payload.content
      : typeof payload.text === "string"
      ? payload.text
      : "";

  return {
    id,
    room_id: roomId,
    user_id: typeof payload.user_id === "string" ? payload.user_id : null,
    content,
    created_at: createdAt,
  };
}

function sortMessages(items: Message[]) {
  return [...items].sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export default function ChatWindow({ roomId, currentUserId, header }: ChatWindowProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [text, setText] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [authIssue, setAuthIssue] = useState<AuthIssue>("none");

  const fetcher = useCallback(async (): Promise<MessagesResponse> => {
    if (!roomId) {
      return { items: [] };
    }

    const res = await fetch(`/api/rooms/${roomId}/messages?limit=${MESSAGE_LIMIT}`, {
      credentials: "include",
    });

    const payload = await res.json().catch(() => null);

    if (res.status === 401) {
      const error = new Error("unauthorized");
      (error as any).status = 401;
      throw error;
    }

    if (res.status === 403) {
      const error = new Error("forbidden");
      (error as any).status = 403;
      throw error;
    }

    if (!res.ok || !payload) {
      const error = new Error(
        typeof payload?.error === "string" ? payload.error : "failed"
      );
      (error as any).status = res.status;
      throw error;
    }

    const items = Array.isArray(payload.items) ? payload.items : [];
    const normalized = items
      .map((item: any) => normalizeMessage(item))
      .filter((item): item is Message => Boolean(item));

    return { items: sortMessages(normalized) };
  }, [roomId]);

  const { data, error, mutate, isValidating } = useSWR<MessagesResponse>(
    roomId ? ["room-messages", roomId] : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  useEffect(() => {
    if (!error) {
      setAuthIssue("none");
      return;
    }

    const status = (error as any).status;
    if (status === 401) {
      setAuthIssue("unauthorized");
    } else if (status === 403) {
      setAuthIssue("forbidden");
    } else {
      setAuthIssue("none");
    }
  }, [error]);

  const messages = data?.items ?? [];
  const isLoading = Boolean(roomId) && !data && isValidating && !error;
  const loadError = error && authIssue === "none" ? "Не удалось загрузить сообщения. Попробуйте позже." : null;

  useRealtimeRoomMessages(
    roomId ?? "__none__",
    (payload) => {
      const message = normalizeMessage(payload.new);
      if (!message) return;
      mutate(
        (prev) => {
          const prevItems = prev?.items ?? [];
          if (prevItems.some((item) => item.id === message.id)) {
            return prev;
          }
          return { items: sortMessages([...prevItems, message]) };
        },
        { revalidate: false }
      );
    }
  );

  const handleRetry = useCallback(() => {
    if (!pending && roomId) {
      mutate();
    }
  }, [mutate, pending, roomId]);

  const handleSend = useCallback(async () => {
    if (!roomId) {
      return;
    }

    const value = text.trim();
    if (!value || pending) return;

    setPending(true);
    setSubmitError(null);

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      room_id: roomId,
      user_id: currentUserId ?? "optimistic",
      content: value,
      created_at: new Date().toISOString(),
      optimistic: true,
    };

    mutate(
      (prev) => {
        const prevItems = prev?.items ?? [];
        return { items: sortMessages([...prevItems, optimisticMessage]) };
      },
      { revalidate: false }
    );

    let authError = false;

    try {
      const res = await fetch(`/api/rooms/${roomId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ content: value }),
      });

      const payload = await res.json().catch(() => null);

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

      if (!res.ok || !payload?.message) {
        throw new Error(typeof payload?.error === "string" ? payload.error : "failed");
      }

      setAuthIssue("none");

      const message = normalizeMessage(payload.message);
      mutate(
        (prev) => {
          const prevItems = prev?.items ?? [];
          const withoutTemp = prevItems.filter((item) => item.id !== tempId);
          return message
            ? { items: sortMessages([...withoutTemp, message]) }
            : { items: withoutTemp };
        },
        { revalidate: false }
      );

      setText("");
      mutate();
    } catch (err) {
      mutate(
        (prev) => {
          const prevItems = prev?.items ?? [];
          return { items: prevItems.filter((item) => item.id !== tempId) };
        },
        { revalidate: false }
      );

      if (!authError) {
        setSubmitError("Не удалось отправить сообщение. Попробуйте ещё раз.");
      }
    } finally {
      setPending(false);
    }
  }, [currentUserId, mutate, pending, roomId, text]);

  const headerContent = useMemo(() => header ?? null, [header]);

  if (!roomId) {
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
        <div className="border-b border-slate-100 bg-slate-50/80 p-4">{headerContent}</div>
      ) : null}
      <div className="flex-1 space-y-2 overflow-y-auto bg-white p-4">
        {isLoading ? (
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
            const isOwn = currentUserId ? m.user_id === currentUserId : false;
            return (
              <div key={m.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                <div
                  className={`relative max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                    isOwn ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-900"
                  } ${m.optimistic ? "opacity-70" : ""}`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
      <div className="flex flex-col gap-2 border-t border-slate-100 bg-white p-4">
        {submitError ? <p className="text-xs text-red-500">{submitError}</p> : null}
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
