import { NextRequest, NextResponse } from 'next/server';
import { sendMessage, ChatServiceError } from '../../../../../lib/chatService';

export async function POST(req: NextRequest, { params }: { params: { conversationId: string } }) {
  try {
    const body = await req.json();
    const text = typeof body?.text === 'string' ? body.text : '';
    const message = await sendMessage(req, params.conversationId, text);
    return NextResponse.json(message);
  } catch (error) {
    if (error instanceof ChatServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Failed to send message', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
