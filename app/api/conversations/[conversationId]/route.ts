import { NextRequest, NextResponse } from 'next/server';
import { getConversationWithMessages, ChatServiceError } from '../../../../lib/chatService';

export async function GET(req: NextRequest, { params }: { params: { conversationId: string } }) {
  try {
    const conversationId = params.conversationId;
    const payload = await getConversationWithMessages(req, conversationId);
    return NextResponse.json(payload);
  } catch (error) {
    if (error instanceof ChatServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Failed to load conversation', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
