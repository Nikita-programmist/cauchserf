import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 1. сервисный supabase-клиент (обходит RLS, не требует куки)
function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

// 2. собираем payload в том формате, который ждёт фронт (ChatWindow)
function buildChatPayload({
  conversationId,
  me,
  otherUser,
  messages,
}: {
  conversationId: string;
  me: { id: string; name: string; avatarUrl: string | null };
  otherUser: { id: string; name: string; avatarUrl: string | null };
  messages: {
    id: string;
    senderId: string;
    text: string;
    createdAt: string;
    readAt: string | null;
  }[];
}) {
  return {
    conversationId,
    me,
    otherUser,
    messages,
  };
}

// вспомогалка: достаём профиль по user_id
async function fetchProfile(supabase: any, userId: string) {
  if (!userId) return null;
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .eq('id', userId)
    .single();
  return data || null;
}

// основная ручка GET /api/conversations/:conversationId
export async function GET(
  _req: Request,
  ctx: { params: { conversationId: string } }
) {
  const conversationId = ctx.params.conversationId;
  const supabase = getServiceSupabase();

  //
  // A. Пытаемся прочитать НОРМАЛЬНЫЙ чат из таблицы conversations + messages
  //
  const { data: conversation, error: convoErr } = await supabase
    .from('conversations')
    .select('id, traveler_id, host_id')
    .eq('id', conversationId)
    .single();

  if (conversation && !convoErr) {
    const { data: travelerProfile } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .eq('id', conversation.traveler_id)
      .single();

    const { data: hostProfile } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .eq('id', conversation.host_id)
      .single();

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

    const meUser = {
      id: travelerProfile?.id ?? conversation.traveler_id,
      name: travelerProfile?.full_name ?? 'Путешественник',
      avatarUrl: travelerProfile?.avatar_url ?? null,
    };

    const otherUser = {
      id: hostProfile?.id ?? conversation.host_id,
      name: hostProfile?.full_name ?? 'Хост',
      avatarUrl: hostProfile?.avatar_url ?? null,
    };

    const normalizedMessages = (messages ?? []).map((m: any) => ({
      id: m.id,
      senderId: m.sender_id,
      text: m.text,
      createdAt: m.created_at,
      readAt: m.read_at,
    }));

    return NextResponse.json(
      buildChatPayload({
        conversationId: conversation.id,
        me: meUser,
        otherUser,
        messages: normalizedMessages,
      })
    );
  }

  //
  // B. Если в таблице conversations нет — пробуем трактовать этот ID
  // как "заявку на проживание" (stay_requests).
  // Мы делаем вид, что это чат с первым сообщением.
  //
  const { data: requestRow, error: reqErr } = await supabase
    .from('stay_requests')
    .select('id, traveler_id, host_id, message, created_at')
    .eq('id', conversationId)
    .single();

  if (requestRow && !reqErr) {
    // профили отправителя и получателя
    const travelerProfile = await fetchProfile(
      supabase,
      requestRow.traveler_id
    );
    const hostProfile = await fetchProfile(supabase, requestRow.host_id);

    // делаем вид, что это наш первый "месседж"
    const firstText =
      requestRow.message && requestRow.message.trim().length > 0
        ? requestRow.message
        : 'Гость не оставил сообщение.';

    const fakeMessage = {
      id: `initial-${requestRow.id}`,
      senderId: requestRow.traveler_id,
      text: firstText,
      createdAt: requestRow.created_at,
      readAt: null,
    };

    const meUser = {
      id: travelerProfile?.id ?? requestRow.traveler_id,
      name: travelerProfile?.full_name ?? 'Путешественник',
      avatarUrl: travelerProfile?.avatar_url ?? null,
    };

    const otherUser = {
      id: hostProfile?.id ?? requestRow.host_id,
      name: hostProfile?.full_name ?? 'Хост',
      avatarUrl: hostProfile?.avatar_url ?? null,
    };

    return NextResponse.json(
      buildChatPayload({
        conversationId: requestRow.id,
        me: meUser,
        otherUser,
        messages: [fakeMessage],
      })
    );
  }

  //
  // C. Ни такого разговора, ни такой заявки — реально нет
  //
  return NextResponse.json(
    { error: 'conversation_not_found' },
    { status: 404 }
  );
}

// POST пока блочим (нет авторизованного sender_id)
export async function POST() {
  return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
}
