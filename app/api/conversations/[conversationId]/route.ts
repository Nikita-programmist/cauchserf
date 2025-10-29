import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabaseServer';
import { getConversationWithMessages } from '@/lib/chatService';

export async function GET(
  req: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const data = await getConversationWithMessages(
      params.conversationId,
      user.id
    );
    return NextResponse.json(data);
  } catch (err: any) {
    if (err.message === 'forbidden') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
