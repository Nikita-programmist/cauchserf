
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabaseServer';
import { listConversationsForUser } from '@/lib/chatService';

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const list = await listConversationsForUser(user.id);
  return NextResponse.json(list);
}
