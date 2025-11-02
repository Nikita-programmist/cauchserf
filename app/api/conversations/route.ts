import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabaseServer';
import { listConversationsForUser } from '@/lib/chatService';

// GET /api/conversations
export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const conversations = await listConversationsForUser(user.id);
    return NextResponse.json({ conversations }, { status: 200 });
  } catch (err) {
    console.error('GET /api/conversations error:', err);
    return NextResponse.json({ conversations: [] }, { status: 200 });
  }
}

// Говорим Next.js не кешировать это навечно
export const dynamic = 'force-dynamic';
