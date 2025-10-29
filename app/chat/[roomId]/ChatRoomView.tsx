'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEventHandler,
  type KeyboardEventHandler,
} from 'react';
import { useChatRoom } from '@/hooks/useChatRoom';
import type { ProfileSummary } from '@/lib/chatRooms';

type ChatRoomViewProps = {
  roomId: string;
  currentUser: ProfileSummary;
  otherUser: ProfileSummary;
};

function getInitials(name: string | null) {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0]!.charAt(0)?.toUpperCase() ?? '';
  return (
    (parts[0]?.charAt(0) ?? '') + (parts[parts.length - 1]?.charAt(0) ?? '')
  ).toUpperCase();
}

function formatLastSeen(lastSeen: number, now: number) {
  const diffMs = Math.max(0, now - lastSeen);
  const diffSeconds = Math.round(diffMs / 1000);
  if (diffSeconds < 10) return 'был(а) в сети только что';
  if (diffSeconds < 60) return `был(а) в сети ${diffSeconds} сек. назад`;
  const diffMinutes = Math.round(diffSeconds / 60);
  if (diffMinutes < 60) return `был(а) в сети ${diffMinutes} мин. назад`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `был(а) в сети ${diffHours} ч. назад`;
  const diffDays = Math.round(diffHours / 24);
  return `был(а) в сети ${diffDays} дн. назад`;
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export default function ChatRoomView({
  roomId,
  currentUser,
  otherUser,
}: ChatRoomViewProps) {
  const { messages, sendMessage, isTypingMap, setTyping, presenceState } =
    useChatRoom(roomId);
  const [inputValue, setInputValue] = useState('');
  const [now, setNow] = useState(() => Date.now());
  const [isSending, setIsSending] = useState(false);
  const messageListRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const otherPresence = presenceState[otherUser.id];
  const isOtherTyping = Boolean(isTypingMap[otherUser.id]);
  const isOtherOnline = Boolean(
    otherPresence && now - otherPresence.lastSeen < 30_000
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 30_000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  const scrollToBottom = useCallback(() => {
    const container = messageListRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    el.style.height = 'auto';
    const maxHeight = 4 * 24;
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  }, [inputValue]);

  useEffect(() => {
    return () => {
      setTyping(false);
    };
  }, [setTyping]);

  const handleSend = useCallback(async () => {
    if (!inputValue.trim()) return;
    try {
      setIsSending(true);
      await sendMessage(inputValue);
      setInputValue('');
      setTyping(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      scrollToBottom();
    } catch (error) {
      console.error('Failed to send message', error);
    } finally {
      setIsSending(false);
    }
  }, [inputValue, scrollToBottom, sendMessage, setTyping]);

  const handleInputChange = useCallback<ChangeEventHandler<HTMLTextAreaElement>>(
    (event) => {
      setInputValue(event.target.value);
      setTyping(true);
    },
    [setTyping]
  );

  const handleKeyDown = useCallback<KeyboardEventHandler<HTMLTextAreaElement>>(
    (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        void handleSend();
      }
    },
    [handleSend]
  );

  const otherStatusText = useMemo(() => {
    if (isOtherTyping) {
      const name = otherUser.display_name ?? 'Пользователь';
      return `${name} печатает...`;
    }
    if (isOtherOnline) {
      return 'В сети';
    }
    if (otherPresence?.lastSeen) {
      return formatLastSeen(otherPresence.lastSeen, now);
    }
    return 'Не в сети';
  }, [isOtherOnline, isOtherTyping, now, otherPresence?.lastSeen, otherUser.display_name]);

  const timeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      }),
    []
  );

  return (
    <div className="flex min-h-screen flex-col bg-neutral-100">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6">
        <div className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white px-5 py-4 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-neutral-200 text-lg font-semibold text-neutral-600">
            {otherUser.avatar_url ? (
              <img
                src={otherUser.avatar_url}
                alt={otherUser.display_name ?? 'Аватар'}
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{getInitials(otherUser.display_name)}</span>
            )}
          </div>
          <div>
            <div className="text-lg font-semibold text-neutral-900">
              {otherUser.display_name ?? 'Без имени'}
            </div>
            <div className="text-sm text-neutral-500">{otherStatusText}</div>
          </div>
        </div>

        <div className="mt-4 flex-1 overflow-hidden">
          <div
            ref={messageListRef}
            className="flex h-full flex-col justify-end overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
          >
            <div className="mt-auto flex flex-col gap-3">
              {messages.map((message) => {
                const isOwn = message.sender_id === currentUser.id;
                const timestamp = timeFormatter.format(new Date(message.created_at));
                const bubbleClasses = cn(
                  'max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm',
                  isOwn
                    ? 'ml-auto rounded-br-sm bg-blue-600 text-white'
                    : 'mr-auto rounded-bl-sm bg-neutral-200 text-neutral-900'
                );

                return (
                  <div key={message.id} className="flex flex-col">
                    <div className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
                      <div className={bubbleClasses}>
                        {!isOwn && (
                          <div className="mb-1 text-xs font-semibold text-neutral-600">
                            {message.sender?.display_name ?? 'Гость'}
                          </div>
                        )}
                        <div className="whitespace-pre-line break-words">
                          {message.body}
                        </div>
                        <div
                          className={cn(
                            'mt-1 text-[11px]',
                            isOwn ? 'text-white/70' : 'text-neutral-500'
                          )}
                        >
                          {timestamp}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 mt-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <form
            className="flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              void handleSend();
            }}
          >
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onBlur={() => setTyping(false)}
              rows={1}
              className="max-h-40 w-full resize-none rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Напишите сообщение..."
            />
            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={isSending || inputValue.trim().length === 0}
                className="inline-flex items-center rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                Отправить
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
