import { NextResponse } from 'next/server';

import {
  enrichApplications,
  getAuthClient,
  parsePagination,
  type ApplicationRow,
} from '@/app/api/applications/utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { supabase, user } = await getAuthClient();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const roleParam = searchParams.get('role');
  const role: 'host' | 'guest' = roleParam === 'host' ? 'host' : 'guest';
  const column = role === 'host' ? 'host_id' : 'guest_id';
  const { limit, page, from, to } = parsePagination(searchParams);

  try {
    const { data, error, count } = await supabase
      .from('applications')
      .select('id, host_id, guest_id, listing_id, message, status, created_at, room_id', {
        count: 'exact',
      })
      .eq(column, user.id)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('[applications] failed to load list', error);
      return NextResponse.json({ error: 'failed_to_load' }, { status: 500 });
    }

    const items = await enrichApplications(supabase, (data ?? []) as ApplicationRow[]);

    return NextResponse.json({
      role,
      items,
      pagination: {
        limit,
        page,
        total: count ?? items.length,
      },
    });
  } catch (err) {
    console.error('[applications] unexpected failure', err);
    return NextResponse.json({ error: 'unexpected_error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { supabase, user } = await getAuthClient();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const hostId = typeof payload?.host_id === 'string' ? payload.host_id.trim() : '';
  const listingId = typeof payload?.listing_id === 'string' ? payload.listing_id.trim() : '';
  const message = typeof payload?.message === 'string' ? payload.message.trim() : '';

  if (!hostId) {
    return NextResponse.json({ error: 'host_id_required' }, { status: 400 });
  }

  if (hostId === user.id) {
    return NextResponse.json({ error: 'cannot_request_self' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('applications')
      .insert({
        host_id: hostId,
        guest_id: user.id,
        listing_id: listingId || null,
        message: message || null,
        status: 'pending',
      })
      .select('id, host_id, guest_id, listing_id, message, status, created_at, room_id')
      .single();

    if (error || !data) {
      console.error('[applications] failed to create', error);
      return NextResponse.json({ error: 'failed_to_create' }, { status: 500 });
    }

    const [application] = await enrichApplications(supabase, [data as ApplicationRow]);
    return NextResponse.json({ application }, { status: 201 });
  } catch (err) {
    console.error('[applications] unexpected create failure', err);
    return NextResponse.json({ error: 'unexpected_error' }, { status: 500 });
  }
}
