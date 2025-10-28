import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabaseServer';
import { ChatServiceError, getConversationWithMessages } from '@/lib/chatService';

export async function GET(
  _req: Request,
  { params }: { params: { conversationId: string } }
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = await getConversationWithMessages(params.conversationId, user.id);
    return NextResponse.json(payload);
  } catch (error) {
    if (error instanceof ChatServiceError) {
      const status = error.status === 400 ? 400 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }

    console.error('Failed to fetch conversation', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
