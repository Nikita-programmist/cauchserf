import { NextResponse } from 'next/server';
import { getCurrentUser, getServiceSupabase } from '@/lib/supabaseServer';
import { ensureConversationForStayRequest } from '@/lib/chatService';

export async function POST(
  _req: Request,
  { params }: { params: { requestId: string } }
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const result = await ensureConversationForStayRequest(
      params.requestId,
      user.id
    );

    const supabase = getServiceSupabase();
    const { data: requestRow } = await supabase
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
      const { data: profileRow } = await supabase
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
      participant,
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
