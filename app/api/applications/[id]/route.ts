import { NextResponse } from 'next/server';

import {
  enrichApplications,
  getAuthClient,
  type ApplicationRow,
  type RouteClient,
} from '@/app/api/applications/utils';
import { getAdminSupabase } from '@/lib/supabaseAdmin';
import type { Database } from '@/lib/supabase/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function loadApplication(supabase: RouteClient, id: string) {
  return supabase
    .from('applications')
    .select('id, host_id, guest_id, listing_id, start_date, end_date, message, status, created_at, room_id')
    .eq('id', id)
    .maybeSingle();
}

async function ensureRoomMember(
  _supabase: RouteClient,
  roomId: string,
  userId: string,
  role: 'host' | 'guest'
) {
  const admin = getAdminSupabase();
  const { error } = await admin
    .from('room_members')
    .upsert(
      [{ room_id: roomId, user_id: userId, role }] as Database['public']['Tables']['room_members']['Insert'][],
      { onConflict: 'room_id,user_id' } as never
    );

  if (error) {
    if (error.code === '23505') {
      return;
    }
    if (error.message?.includes('duplicate key')) {
      return;
    }
    throw error;
  }
}

async function acceptApplication(
  supabase: RouteClient,
  application: ApplicationRow
): Promise<ApplicationRow> {
  const admin = getAdminSupabase();
  let roomId = application.room_id;

  if (!roomId) {
    const { data: roomData, error: roomError } = await admin
      .from('rooms')
      .insert({})
      .select('id')
      .single();

    if (roomError || !roomData) {
      throw roomError ?? new Error('room_create_failed');
    }

    roomId = roomData.id;
  }

  await ensureRoomMember(supabase, roomId, application.host_id, 'host');
  await ensureRoomMember(supabase, roomId, application.guest_id, 'guest');

  const { error: updateError } = await admin
    .from('applications')
    .update({ status: 'accepted', room_id: roomId })
    .eq('id', application.id);

  if (updateError) {
    throw updateError;
  }

  const { data: refreshed, error: refreshError } = await loadApplication(supabase, application.id);

  if (refreshError || !refreshed) {
    throw refreshError ?? new Error('application_update_failed');
  }

  return refreshed as ApplicationRow;
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { supabase, user } = await getAuthClient();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { data, error } = await loadApplication(supabase, params.id);

  if (error) {
    console.error('[applications] failed to load', error);
    return NextResponse.json({ error: 'failed_to_load' }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  if (data.host_id !== user.id && data.guest_id !== user.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const [application] = await enrichApplications(supabase, [data as ApplicationRow]);
  return NextResponse.json({ application });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { supabase, user } = await getAuthClient();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const actionRaw = typeof payload?.action === 'string' ? payload.action.trim().toLowerCase() : '';
  const statusRaw = typeof payload?.status === 'string' ? payload.status.trim().toLowerCase() : '';

  const resolvedAction =
    actionRaw ||
    (statusRaw === 'accepted'
      ? 'accept'
      : statusRaw === 'declined'
      ? 'decline'
      : statusRaw === 'cancelled'
      ? 'cancel'
      : '');

  if (!['accept', 'decline', 'cancel'].includes(resolvedAction)) {
    return NextResponse.json({ error: 'invalid_action' }, { status: 400 });
  }

  const { data, error } = await loadApplication(supabase, params.id);

  if (error) {
    console.error('[applications] failed to load for update', error);
    return NextResponse.json({ error: 'failed_to_load' }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const isHost = data.host_id === user.id;
  const isGuest = data.guest_id === user.id;

  if (!isHost && !isGuest) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  try {
    let updated: ApplicationRow = data as ApplicationRow;

    if (resolvedAction === 'accept') {
      if (!isHost) {
        return NextResponse.json({ error: 'forbidden' }, { status: 403 });
      }
      if (data.status === 'accepted' && data.room_id) {
        await ensureRoomMember(supabase, data.room_id, data.host_id, 'host');
        await ensureRoomMember(supabase, data.room_id, data.guest_id, 'guest');
        updated = data as ApplicationRow;
      } else {
        updated = await acceptApplication(supabase, data as ApplicationRow);
      }
    } else if (resolvedAction === 'decline') {
      if (!isHost) {
        return NextResponse.json({ error: 'forbidden' }, { status: 403 });
      }
      const { data: declined, error: declineError } = await supabase
        .from('applications')
        .update({ status: 'declined' })
        .eq('id', data.id)
        .select('id, host_id, guest_id, listing_id, start_date, end_date, message, status, created_at, room_id')
        .single();
      if (declineError || !declined) {
        throw declineError ?? new Error('decline_failed');
      }
      updated = declined as ApplicationRow;
    } else if (resolvedAction === 'cancel') {
      if (!isGuest) {
        return NextResponse.json({ error: 'forbidden' }, { status: 403 });
      }
      const { data: cancelled, error: cancelError } = await supabase
        .from('applications')
        .update({ status: 'cancelled' })
        .eq('id', data.id)
        .select('id, host_id, guest_id, listing_id, start_date, end_date, message, status, created_at, room_id')
        .single();
      if (cancelError || !cancelled) {
        throw cancelError ?? new Error('cancel_failed');
      }
      updated = cancelled as ApplicationRow;
    }

    const [application] = await enrichApplications(supabase, [updated]);
    return NextResponse.json({ application, room_id: application.room_id ?? null });
  } catch (err) {
    console.error('[applications] failed to update status', err);
    return NextResponse.json({ error: 'failed_to_update' }, { status: 500 });
  }
}
