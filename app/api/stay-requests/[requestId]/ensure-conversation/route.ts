import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { ensureConversationForStayRequest } from '@/lib/chatService';
import { admin } from '@/lib/supabase/server';
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

export async function POST(
  _req: Request,
  { params }: { params: { requestId: string } }
) {
  const user = await getAuthUser();

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const result = await ensureConversationForStayRequest(
      params.requestId,
      user.id
    );

    const client = admin();
    const { data: requestRow } = await client
      .from('stay_requests')
      .select('traveler_id, host_id')
      .eq('id', params.requestId)
      .maybeSingle();

    const otherParticipantId =
      requestRow?.traveler_id === user.id
        ? requestRow?.host_id
        : requestRow?.traveler_id;

    let participant: {
      id: string;
      name: string;
      avatar_url: string | null;
    } | null = null;

    if (otherParticipantId) {
      const { data: profileRow } = await client
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .eq('id', otherParticipantId)
        .maybeSingle();

      const firstName =
        typeof profileRow?.first_name === 'string'
          ? profileRow.first_name.trim()
          : '';
      const lastName =
        typeof profileRow?.last_name === 'string'
          ? profileRow.last_name.trim()
          : '';
      const combinedName = `${firstName} ${lastName}`.trim();

      participant = {
        id: profileRow?.id ?? otherParticipantId,
        name: combinedName || 'Пользователь Домика',
        avatar_url: profileRow?.avatar_url ?? null,
      };
    }

    return NextResponse.json({
      conversationId: result.conversationId,
    });
  } catch (err: any) {
    if (err?.message === 'forbidden') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    if (err?.message === 'not_found') {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
