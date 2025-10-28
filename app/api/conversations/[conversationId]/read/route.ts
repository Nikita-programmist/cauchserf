import { NextRequest, NextResponse } from 'next/server';
import { markConversationRead, ChatServiceError } from '../../../../../lib/chatService';

export async function POST(req: NextRequest, { params }: { params: { conversationId: string } }) {
  try {
    const result = await markConversationRead(req, params.conversationId);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ChatServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Failed to mark conversation as read', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
