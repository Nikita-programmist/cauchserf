import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabaseServer';
import { ChatServiceError, listConversationsForUser } from '@/lib/chatService';

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const conversations = await listConversationsForUser(user.id);
    return NextResponse.json(conversations);
  } catch (error) {
    if (error instanceof ChatServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Failed to list conversations', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
