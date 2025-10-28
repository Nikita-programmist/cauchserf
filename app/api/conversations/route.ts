import { NextRequest, NextResponse } from 'next/server';
import { listConversationsForUser, ChatServiceError } from '../../../lib/chatService';

export async function GET(req: NextRequest) {
  try {
    const conversations = await listConversationsForUser(req);
    return NextResponse.json(conversations);
  } catch (error) {
    if (error instanceof ChatServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Failed to list conversations', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
