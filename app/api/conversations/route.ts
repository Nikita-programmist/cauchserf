import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { listConversationsForUser } from '@/lib/chatService';
import type { Database } from '@/lib/supabase/types';

export const runtime = 'nodejs';

async function getAuthUser() {
  const client = createRouteHandlerClient<Database>({ cookies });

  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

// GET /api/conversations
export async function GET() {
  const user = await getAuthUser();

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
