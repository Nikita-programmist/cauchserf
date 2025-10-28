import { useEffect, useRef } from 'react';

import { cn } from '../lib/utils';

const defaultFormatTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
};

export function ChatMessageList({
  messages = [],
  currentUserId,
  loading = false,
  emptyText = 'Сообщений пока нет. Напишите первым!',
  className,
  formatTimestamp
}) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = formatTimestamp ?? defaultFormatTime;

  return (
    <div className={cn('flex min-h-[300px] flex-col gap-4 overflow-y-auto pr-2', className)}>
      {loading ? (
        <p className="text-sm text-fg/70">Загружаем сообщения…</p>
      ) : messages.length === 0 ? (
        <p className="text-sm text-fg/70">{emptyText}</p>
      ) : (
        messages.map((message) => {
          const isOwn = message.sender_id === currentUserId;
          const content = message.body ?? message.text ?? '';
          return (
            <div key={message.id} className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'max-w-[80%] rounded-3xl px-4 py-3 text-sm leading-relaxed shadow transition',
                  isOwn
                    ? 'bg-emerald-600 text-white shadow-emerald-900/20'
                    : 'border border-white/20 bg-white/10 text-fg shadow-slate-900/10'
                )}
              >
                <p className="whitespace-pre-line break-words">{content}</p>
                <span className={cn('mt-2 block text-right text-xs', isOwn ? 'text-white/70' : 'text-fg/50')}>
                  {formatTime(message.created_at)}
                </span>
              </div>
            </div>
          );
        })
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}

export default ChatMessageList;
