import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabaseServer';
import { ChatServiceError, markConversationRead } from '@/lib/chatService';

export async function POST(
  _req: Request,
  { params }: { params: { conversationId: string } }
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await markConversationRead(params.conversationId, user.id);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ChatServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Failed to mark conversation read', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
