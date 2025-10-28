import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabaseServer';
import { ChatServiceError, sendMessage } from '@/lib/chatService';

export async function POST(
  req: Request,
  { params }: { params: { conversationId: string } }
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const text = typeof body?.text === 'string' ? body.text : '';

  try {
    const message = await sendMessage(params.conversationId, user.id, text);
    return NextResponse.json(message);
  } catch (error) {
    if (error instanceof ChatServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Failed to send message', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
