"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { useConversation } from "@/hooks/useConversation";
import { useRealtimeRoomMessages } from "@/hooks/useRealtimeRoomMessages";
import type { MessageDto } from "@/lib/chatService";

type ChatWindowProps = {
  roomId: string | null;
  currentUserId?: string;
  header?: ReactNode;
};

type AuthIssue = "none" | "unauthorized" | "forbidden";

function normalizeRealtimeMessage(roomId: string, payload: any): MessageDto | null {
  if (!payload?.id) return null;

  const createdAtRaw = payload.createdAt ?? payload.created_at;
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
    id: String(payload.id),
    conversationId: String(payload.conversationId ?? roomId),
    senderId: String(payload.senderId ?? payload.user_id ?? ""),
    content,
    createdAt,
  } satisfies MessageDto;
}

export default function ChatWindow({ roomId, currentUserId, header }: ChatWindowProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [text, setText] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [authIssue, setAuthIssue] = useState<AuthIssue>("none");

  const { messages, loading, error, sendMessage, refetch, appendMessage } =
    useConversation(roomId);

  useEffect(() => {
    if (!error) return;
    const status = (error as any)?.status;
    if (status === 401) {
      setAuthIssue("unauthorized");
    } else if (status === 403) {
      setAuthIssue("forbidden");
    }
  }, [error]);

  useEffect(() => {
    if (authIssue === "unauthorized") {
      router.push(`/login?redirect=${encodeURIComponent("/chat")}`);
    }
  }, [authIssue, router]);

  const messagesKey = roomId ?? "__none__";

  useRealtimeRoomMessages(
    messagesKey,
    (payload) => {
      if (!roomId) return;
      const message = normalizeRealtimeMessage(roomId, payload.new);
      if (!message) return;
      appendMessage(message);
    },
    5000
  );

  const handleRetry = useCallback(() => {
    if (!pending && roomId) {
      refetch();
    }
  }, [pending, refetch, roomId]);

  const handleSend = useCallback(async () => {
    if (!roomId) {
      return;
    }

    const value = text.trim();
    if (!value || pending) return;

    setPending(true);
    setSubmitError(null);

    try {
      await sendMessage(value);
      setText("");
      setAuthIssue("none");
    } catch (err) {
      const status = (err as any)?.status;
      if (status === 401) {
        setAuthIssue("unauthorized");
      } else if (status === 403) {
        setAuthIssue("forbidden");
      } else {
        setSubmitError("Не удалось отправить сообщение. Попробуйте ещё раз.");
      }
    } finally {
      setPending(false);
    }
  }, [pending, roomId, sendMessage, text]);

  const headerContent = useMemo(() => header ?? null, [header]);

  const isLoading = Boolean(roomId) && loading;
  const loadError =
    authIssue === "none" && error
      ? "Не удалось загрузить сообщения. Попробуйте позже."
      : null;

  if (!roomId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-white/60 text-center text-sm text-neutral-500">
        <p>Выберите чат, чтобы начать переписку.</p>
      </div>
    );
  }

  if (authIssue === "forbidden") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-white/60 text-center text-sm text-neutral-500">
        <p>У вас нет доступа к этому диалогу.</p>
        <button
          type="button"
          className="text-xs font-semibold text-blue-600 underline"
          onClick={() => router.push("/chat")}
        >
          Вернуться к списку
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-white/60">
      <header className="flex items-center justify-between border-b border-white/30 px-6 py-4">
        {headerContent}
        <div className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">
          Домик · Чат
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-5 text-sm text-neutral-700">
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center text-sm text-neutral-500">
            Загружаем сообщения…
          </div>
        ) : loadError ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center text-sm text-neutral-500">
            <p>{loadError}</p>
            <button
              type="button"
              className="text-xs font-semibold text-blue-600 underline"
              onClick={handleRetry}
            >
              Повторить загрузку
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-sm text-neutral-500">
            Пока нет сообщений. Напишите первым!
          </div>
        ) : (
          messages.map((message) => {
            const isMine = message.senderId === currentUserId;
            return (
              <div
                key={message.id}
                className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow ${
                    isMine
                      ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
                      : "bg-white text-neutral-800 shadow-inner"
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                </div>
                <span className="mt-1 text-[11px] uppercase tracking-wide text-neutral-400">
                  {new Date(message.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            );
          })
        )}
      </div>

      <footer className="border-t border-white/30 bg-white/70 px-6 py-4">
        {authIssue === "unauthorized" ? (
          <div className="flex items-center justify-between text-xs text-neutral-600">
            <span>Авторизуйтесь, чтобы отправлять сообщения.</span>
            <button
              type="button"
              className="text-xs font-semibold text-blue-600 underline"
              onClick={() => router.push(`/login?redirect=${encodeURIComponent("/chat")}`)}
            >
              Войти
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <textarea
              className="min-h-[44px] flex-1 resize-none rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-800 shadow-inner focus:border-blue-400 focus:outline-none"
              placeholder="Напишите сообщение..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={pending || !text.trim()}
              className="rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:from-blue-600 hover:to-indigo-600 disabled:cursor-not-allowed disabled:from-neutral-300 disabled:to-neutral-300"
            >
              Отправить
            </button>
          </div>
        )}
        {submitError ? (
          <p className="mt-2 text-xs text-red-600">{submitError}</p>
        ) : null}
      </footer>
    </div>
  );
}
