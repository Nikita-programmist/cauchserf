import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// сервисный клиент Supabase, без куки, с правами читать всё
function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

// утилита: достать профиль юзера (имя, аватар)
async function fetchProfile(supabase: any, userId: string) {
  if (!userId) return null;
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .eq('id', userId)
    .single();
  return data || null;
}

// GET /api/conversations
// возвращаем массив "диалогов", чтобы ConversationList отрисовал список
export async function GET() {
  const supabase = getServiceSupabase();

  // 1. реальные беседы (conversations)
  const { data: convos } = await supabase
    .from('conversations')
    .select('id, traveler_id, host_id');

  let conversationItems: any[] = [];

  if (convos && convos.length > 0) {
    for (const convo of convos) {
      const { data: lastMsgRows } = await supabase
        .from('messages')
        .select('text, created_at, sender_id')
        .eq('conversation_id', convo.id)
        .order('created_at', { ascending: false })
        .limit(1);

      const lastMsg = lastMsgRows && lastMsgRows[0];

      const travelerProfile = await fetchProfile(
        supabase,
        convo.traveler_id
      );
      const hostProfile = await fetchProfile(
        supabase,
        convo.host_id
      );

      // показываем другого участника (пока считаем, что это host)
      const otherUser = {
        id: hostProfile?.id ?? convo.host_id,
        name: hostProfile?.full_name ?? 'Хост',
        avatarUrl: hostProfile?.avatar_url ?? null,
      };

      conversationItems.push({
        id: convo.id, // это conversationId
        otherUser,
        lastMessageText: lastMsg ? lastMsg.text : 'Без сообщений',
        lastMessageAt: lastMsg ? lastMsg.created_at : null,
      });
    }
  }

  // 2. заявки (stay_requests) = чаты до создания conversations
  const { data: requests } = await supabase
    .from('stay_requests')
    .select('id, traveler_id, host_id, message, created_at')
    .order('created_at', { ascending: false });

  if (requests && requests.length > 0) {
    for (const req of requests) {
      const travelerProfile = await fetchProfile(
        supabase,
        req.traveler_id
      );
      const hostProfile = await fetchProfile(
        supabase,
        req.host_id
      );

      const otherUser = {
        id: travelerProfile?.id ?? req.traveler_id,
        name: travelerProfile?.full_name ?? 'Путешественник',
        avatarUrl: travelerProfile?.avatar_url ?? null,
      };

      const text =
        req.message && req.message.trim().length > 0
          ? req.message
          : 'Гость не оставил сообщение.';

      conversationItems.push({
        id: req.id, // тут id из заявки, не из conversations
        otherUser,
        lastMessageText: text,
        lastMessageAt: req.created_at,
      });
    }
  }

  // 3. сортируем по последнему сообщению (новые выше)
  conversationItems.sort((a, b) => {
    const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    return tb - ta;
  });

  return NextResponse.json(conversationItems);
}
