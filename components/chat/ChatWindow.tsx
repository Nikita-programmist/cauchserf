"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useConversation } from "@/hooks/useConversation";
import { useRealtimeConversation } from "@/hooks/useRealtimeConversation";

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
  const {
    messages,
    loading,
    sendMessage,
    editMessage,
    deleteMessage,
    refetch,
  } = useConversation(conversationId);
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/conversations/${conversationId}/read`, {
      method: "POST",
      credentials: "include",
    }).catch(() => undefined);
  }, [conversationId]);

  useRealtimeConversation(
    conversationId,
    () => {
      refetch();
    },
    () => {
      refetch();
    }
  );

  const handleSend = async () => {
    const value = text.trim();
    if (!value) return;

    if (editingId) {
      await editMessage(editingId, value);
      setEditingId(null);
      setText("");
    } else {
      await sendMessage(value);
      setText("");
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
                      }}
                      className="text-[10px] text-blue-500"
                    >
                      изм
                    </button>
                    <button
                      onClick={() => deleteMessage(m.id)}
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
      <div className="flex gap-2 border-t p-3">
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
          className="rounded bg-black px-3 py-1 text-sm text-white"
        >
          {editingId ? "Сохранить" : "Отпр."}
        </button>
      </div>
    </div>
  );
}
