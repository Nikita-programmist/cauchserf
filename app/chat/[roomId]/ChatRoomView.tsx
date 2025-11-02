'use client';

import { useState } from 'react';
import { useChatRoom } from '@/hooks/useChatRoom';

export default function ChatRoomView({ roomId }: { roomId: string }) {
  const { messages, sendMessage, editMessage, deleteMessage, currentUserId, isSending } =
    useChatRoom(roomId);
  const [text, setText] = useState('');
  const [editId, setEditId] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editId) {
      await editMessage(editId, text);
      setEditId(null);
      setText('');
      return;
    }
    await sendMessage(text);
    setText('');
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex-1 overflow-y-auto flex flex-col gap-2">
        {messages.map((m) => {
          const isMe = m.sender_id === currentUserId;
          const isDeleted = !!m.deleted_at;
          return (
            <div
              key={m.id}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`rounded-2xl px-4 py-2 max-w-[60%] ${
                  isMe ? 'bg-[#00694F] text-white' : 'bg-slate-100'
                }`}
              >
                <div className="text-sm">
                  {isDeleted ? <i>Сообщение удалено</i> : m.body}
                </div>
                {!isDeleted && isMe && (
                  <div className="flex gap-2 mt-1 text-xs opacity-80">
                    <button
                      type="button"
                      onClick={() => {
                        setEditId(m.id);
                        setText(m.body);
                      }}
                    >
                      изменить
                    </button>
                    <button type="button" onClick={() => deleteMessage(m.id)}>
                      удалить
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {messages.length === 0 && (
          <div className="text-center text-slate-400 mt-10">Пока нет сообщений.</div>
        )}
      </div>
      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          className="flex-1 border rounded-xl px-3 py-2"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={editId ? 'Изменить сообщение...' : 'Напишите сообщение...'}
        />
        <button
          type="submit"
          disabled={isSending || !text.trim()}
          className="bg-[#00694F] text-white px-4 py-2 rounded-xl disabled:opacity-50"
        >
          {editId ? 'Сохранить' : 'Отправить'}
        </button>
      </form>
    </div>
  );
}

