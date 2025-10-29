
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ⚠️ мини-хелпер: сервисный клиент, без RLS и без сессии пользователя.
// Да, это сервисный ключ. Да, это дырка, но нам сейчас нужно просто чтобы чат показывался.
function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  // persistSession:false => не пытаемся хранить сессию на сервере
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

// тип для ответа чата — то, что ожидает фронт (ChatWindow)
function buildChatPayload({
  conversation,
  travelerProfile,
  hostProfile,
  messages,
}: {
  conversation: any;
  travelerProfile: any;
  hostProfile: any;
  messages: any[];
}) {
  return {
    conversationId: conversation.id,
    // считаем что traveler = "я", host = "собеседник".
    // если ты зашёл как хост — роли могут быть перевёрнуты, но нам сейчас важно просто увидеть контент.
    me: {
      id: travelerProfile?.id ?? conversation.traveler_id,
      name: travelerProfile?.full_name ?? 'Путешественник',
      avatarUrl: travelerProfile?.avatar_url ?? null,
    },
    otherUser: {
      id: hostProfile?.id ?? conversation.host_id,
      name: hostProfile?.full_name ?? 'Хост',
      avatarUrl: hostProfile?.avatar_url ?? null,
    },
    messages: messages.map((m) => ({
      id: m.id,
      senderId: m.sender_id,
      text: m.text,
      createdAt: m.created_at,
      readAt: m.read_at,
    })),
  };
}

// GET /api/conversations/:conversationId
export async function GET(
  _req: Request,
  ctx: { params: { conversationId: string } }
) {
  const conversationId = ctx.params.conversationId;
  const supabase = getServiceSupabase();

  // 1. сама беседа
  const { data: conversation, error: convoErr } = await supabase
    .from('conversations')
    .select('id, traveler_id, host_id')
    .eq('id', conversationId)
    .single();

  if (convoErr || !conversation) {
    return NextResponse.json(
      { error: 'conversation_not_found' },
      { status: 404 }
    );
  }

  // 2. профиль путешественника
  const { data: travelerProfile } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .eq('id', conversation.traveler_id)
    .single();

  // 3. профиль хоста
  const { data: hostProfile } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .eq('id', conversation.host_id)
    .single();

  // 4. сообщения в беседе
  const { data: messages, error: msgErr } = await supabase
    .from('messages')
    .select('id, sender_id, text, created_at, read_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(100);

  if (msgErr) {
    return NextResponse.json(
      { error: 'messages_fetch_failed' },
      { status: 500 }
    );
  }

  // 5. финальный ответ в том формате,
  // который ждёт фронтовый ChatWindow (chat.me, chat.otherUser, chat.messages)
  const payload = buildChatPayload({
    conversation,
    travelerProfile,
    hostProfile,
    messages: messages ?? [],
  });

  return NextResponse.json(payload);
}

// POST пока просто не даём отправлять, потому что у нас нет авторизованного sender_id.
// Можно потом починить отдельно.
export async function POST() {
  return NextResponse.json(
    { error: 'unauthorized' },
    { status: 401 }
  );
}
