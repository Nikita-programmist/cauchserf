import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabaseServer';
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

    return NextResponse.json(result);
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
