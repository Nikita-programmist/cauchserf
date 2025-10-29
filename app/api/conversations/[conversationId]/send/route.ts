import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabaseServer';
import { sendMessage } from '@/lib/chatService';

export async function POST(
  req: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const text = body?.text ?? '';

  try {
    const msg = await sendMessage(params.conversationId, user.id, text);
    return NextResponse.json(msg);
  } catch (err: any) {
    if (err.message === 'forbidden') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
    if (err.message === 'empty') {
      return NextResponse.json({ error: 'empty' }, { status: 400 });
    }
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
