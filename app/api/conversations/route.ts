import { NextResponse } from 'next/server';
import { getCurrentUser, getServiceSupabase } from '@/lib/supabaseServer';
import { listConversationsForUser } from '@/lib/chatService';

function resolveProfileName(profile: any, fallback: string) {
  if (!profile) return fallback;

  const { full_name, first_name, last_name, name } = profile;

  if (full_name && full_name.trim().length > 0) {
    return full_name.trim();
  }

  const combined = [first_name, last_name]
    .filter((part: string | null | undefined) => part && part.trim().length > 0)
    .join(' ')
    .trim();

  if (combined.length > 0) {
    return combined;
  }

  if (name && name.trim().length > 0) {
    return name.trim();
  }

  return fallback;
}

function resolveAvatarUrl(profile: any) {
  return profile?.avatar_url ?? null;
}

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const [conversations, stayRequests] = await Promise.all([
    listConversationsForUser(user.id),
    fetchPendingRequests(user.id),
  ]);

  const combined = [...conversations, ...stayRequests].sort((a, b) => {
    const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    return tb - ta;
  });

  return NextResponse.json(combined);
}

async function fetchPendingRequests(userId: string) {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from('stay_requests')
    .select('id, traveler_id, host_id, message, created_at, conversation_id')
    .or(`traveler_id.eq.${userId},host_id.eq.${userId}`)
    .is('conversation_id', null)
    .order('created_at', { ascending: false });

  if (error || !data) {
    return [] as any[];
  }

  const profileCache = new Map<string, any>();

  async function getProfile(userIdToFetch: string) {
    if (profileCache.has(userIdToFetch)) {
      return profileCache.get(userIdToFetch);
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, first_name, last_name, name, avatar_url')
      .eq('id', userIdToFetch)
      .maybeSingle();

    profileCache.set(userIdToFetch, profile ?? null);
    return profile;
  }

  const items: any[] = [];

  for (const req of data) {
    const isTraveler = req.traveler_id === userId;
    const otherId = isTraveler ? req.host_id : req.traveler_id;
    const otherProfile = otherId ? await getProfile(otherId) : null;

    const previewText = req.message && req.message.trim().length > 0
      ? req.message
      : 'Гость не оставил сообщение.';

    items.push({
      id: req.id,
      type: 'stay_request',
      requestId: req.id,
      conversationId: req.conversation_id,
      otherUser: {
        id: otherId,
        name: resolveProfileName(
          otherProfile,
          isTraveler ? 'Хост' : 'Путешественник'
        ),
        avatarUrl: resolveAvatarUrl(otherProfile),
      },
      lastMessageText: previewText,
      lastMessageAt: req.created_at,
      unreadCount: 0,
    });
  }

  return items;
}
