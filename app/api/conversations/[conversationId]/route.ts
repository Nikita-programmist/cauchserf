import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { admin } from '@/lib/supabase/server';
import { getConversationWithMessages } from '@/lib/chatService';
import type { Database } from '@/lib/supabase/types';

export const runtime = 'nodejs';

async function getAuthUser() {
  const client = createRouteHandlerClient<Database>({ cookies });

  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

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

export async function GET(
  _req: Request,
  ctx: { params: { conversationId: string } }
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const conversation = await getConversationWithMessages(
      ctx.params.conversationId,
      user.id
    );

    return NextResponse.json(conversation);
  } catch (err: any) {
    if (err?.message === 'forbidden') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    try {
      const fallback = await buildStayRequestConversation(
        ctx.params.conversationId,
        user.id
      );

      if (fallback) {
        return NextResponse.json(fallback);
      }

      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    } catch (fallbackError: any) {
      if (fallbackError?.message === 'forbidden') {
        return NextResponse.json({ error: 'forbidden' }, { status: 403 });
      }

      return NextResponse.json({ error: 'server_error' }, { status: 500 });
    }
  }
}

export async function POST() {
  return NextResponse.json({ error: 'method_not_allowed' }, { status: 405 });
}

async function buildStayRequestConversation(
  requestId: string,
  userId: string
) {
  const client = admin();

  const { data: request, error } = await client
    .from('stay_requests')
    .select('id, traveler_id, host_id, message, created_at')
    .eq('id', requestId)
    .maybeSingle();

  if (error || !request) {
    return null;
  }

  const participant =
    request.traveler_id === userId || request.host_id === userId;

  if (!participant) {
    throw new Error('forbidden');
  }

  const { data: travelerProfile } = await client
    .from('profiles')
    .select('id, full_name, first_name, last_name, name, avatar_url')
    .eq('id', request.traveler_id)
    .maybeSingle();

  const { data: hostProfile } = await client
    .from('profiles')
    .select('id, full_name, first_name, last_name, name, avatar_url')
    .eq('id', request.host_id)
    .maybeSingle();

  const messageText = request.message && request.message.trim().length > 0
    ? request.message
    : 'Гость не оставил сообщение.';

  const isTraveler = request.traveler_id === userId;

  const meProfile = isTraveler ? travelerProfile : hostProfile;
  const otherProfile = isTraveler ? hostProfile : travelerProfile;

  const meId = isTraveler ? request.traveler_id : request.host_id;
  const otherId = isTraveler ? request.host_id : request.traveler_id;

  return {
    conversationId: request.id,
    me: {
      id: meId,
      name: resolveProfileName(meProfile, isTraveler ? 'Путешественник' : 'Хост'),
      avatarUrl: resolveAvatarUrl(meProfile),
    },
    otherUser: {
      id: otherId,
      name: resolveProfileName(
        otherProfile,
        isTraveler ? 'Хост' : 'Путешественник'
      ),
      avatarUrl: resolveAvatarUrl(otherProfile),
    },
    messages: [
      {
        id: `initial-${request.id}`,
        senderId: request.traveler_id,
        text: messageText,
        createdAt: request.created_at,
        readAt: null,
      },
    ],
  };
}
