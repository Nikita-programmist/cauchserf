"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import ChatWindow from "@/components/chat/ChatWindow";
import ConversationList from "@/components/chat/ConversationList";
import { useAuth } from "@/components/AuthProvider";
import { listRoomsForUser, type RoomListItem } from "@/lib/chatService";
import { cn } from "@/lib/utils";

type AuthContext = {
  user: { id: string } | null;
  loading: boolean;
};

type ChatPageClientProps = {
  className?: string;
  activeRoomId?: string | null;
};

export default function ChatPageClient({ className, activeRoomId }: ChatPageClientProps) {
  const router = useRouter();
  const { user, loading } = useAuth() as AuthContext;
  const [items, setItems] = useState<RoomListItem[]>([]);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent("/chat")}`);
      return;
    }

    let active = true;
    setFetching(true);
    setError(null);

    listRoomsForUser(user.id)
      .then((rooms) => {
        if (!active) return;
        setItems(rooms ?? []);
      })
      .catch((err) => {
        console.error(err);
        if (active) {
          setError("Не удалось загрузить список диалогов.");
        }
      })
      .finally(() => {
        if (active) setFetching(false);
      });

    return () => {
      active = false;
    };
  }, [loading, router, user]);

  const firstRoom = useMemo(
    () => items.find((item) => item.roomId) ?? null,
    [items]
  );
  const selectedRoomId = activeRoomId ?? firstRoom?.roomId ?? null;
  const selectedRoom = items.find((item) => item.roomId === selectedRoomId) ?? null;
  const primaryPeer = selectedRoom?.peers?.[0] ?? null;

  if (loading || fetching) {
    return (
      <div className="flex h-full items-center justify-center rounded-3xl bg-white/70 text-sm text-neutral-500">
        Загружаем ваши диалоги…
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center rounded-3xl bg-white/70 text-sm text-neutral-500">
        {error}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex h-full min-h-[360px] overflow-hidden rounded-3xl border border-white/10 bg-white/70 shadow-inner backdrop-blur",
        className
      )}
    >
      <ConversationList items={items} selectedRoomId={selectedRoomId} />
      <div className="flex flex-1 flex-col">
        {selectedRoomId ? (
          <ChatWindow
            roomId={selectedRoomId ?? null}
            currentUserId={user.id}
            header={
              selectedRoom && primaryPeer ? (
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-neutral-200 text-sm font-semibold text-neutral-600">
                    {primaryPeer.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={primaryPeer.avatarUrl}
                        alt={primaryPeer.name ?? "Собеседник"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span>
                        {primaryPeer.name?.charAt(0)?.toUpperCase() ?? "U"}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-neutral-900">
                      {primaryPeer.name ?? "Собеседник"}
                    </span>
                  </div>
                </div>
              ) : undefined
            }
          />
        ) : (
          <div className="flex flex-1 items-center justify-center bg-white/60 text-sm text-neutral-500">
            Выберите чат, чтобы начать переписку
          </div>
        )}
      </div>
    </div>
  );
}
