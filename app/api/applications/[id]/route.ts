import { NextResponse } from 'next/server';

import {
  enrichApplications,
  getAuthClient,
  type ApplicationRow,
  type RouteClient,
} from '@/app/api/applications/utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function loadApplication(supabase: RouteClient, id: string) {
  return supabase
    .from('applications')
    .select('id, host_id, guest_id, listing_id, message, status, created_at, room_id')
    .eq('id', id)
    .maybeSingle();
}

async function ensureRoomMember(supabase: RouteClient, roomId: string, userId: string) {
  const { error } = await supabase
    .from('room_members')
    .insert({ room_id: roomId, user_id: userId })
    .select('room_id, user_id')
    .single();

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
  let roomId = application.room_id;

  if (!roomId) {
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .insert({})
      .select('id')
      .single();

    if (roomError || !roomData) {
      throw roomError ?? new Error('room_create_failed');
    }

    roomId = roomData.id;
  }

  const { data: updatedApplication, error: updateError } = await supabase
    .from('applications')
    .update({ status: 'accepted', room_id: roomId })
    .eq('id', application.id)
    .select('id, host_id, guest_id, listing_id, message, status, created_at, room_id')
    .single();

  if (updateError || !updatedApplication) {
    throw updateError ?? new Error('application_update_failed');
  }

  await ensureRoomMember(supabase, roomId, updatedApplication.host_id);
  await ensureRoomMember(supabase, roomId, updatedApplication.guest_id);

  return updatedApplication as ApplicationRow;
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
  const nextStatusRaw = typeof payload?.status === 'string' ? payload.status.trim().toLowerCase() : '';

  if (!['accepted', 'declined', 'cancelled'].includes(nextStatusRaw)) {
    return NextResponse.json({ error: 'invalid_status' }, { status: 400 });
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

    if (nextStatusRaw === 'accepted') {
      if (!isHost) {
        return NextResponse.json({ error: 'forbidden' }, { status: 403 });
      }
      if (data.status === 'accepted' && data.room_id) {
        await ensureRoomMember(supabase, data.room_id, data.host_id);
        await ensureRoomMember(supabase, data.room_id, data.guest_id);
        updated = data as ApplicationRow;
      } else {
        updated = await acceptApplication(supabase, data as ApplicationRow);
      }
    } else if (nextStatusRaw === 'declined') {
      if (!isHost) {
        return NextResponse.json({ error: 'forbidden' }, { status: 403 });
      }
      const { data: declined, error: declineError } = await supabase
        .from('applications')
        .update({ status: 'declined' })
        .eq('id', data.id)
        .select('id, host_id, guest_id, listing_id, message, status, created_at, room_id')
        .single();
      if (declineError || !declined) {
        throw declineError ?? new Error('decline_failed');
      }
      updated = declined as ApplicationRow;
    } else if (nextStatusRaw === 'cancelled') {
      if (!isGuest) {
        return NextResponse.json({ error: 'forbidden' }, { status: 403 });
      }
      const { data: cancelled, error: cancelError } = await supabase
        .from('applications')
        .update({ status: 'cancelled' })
        .eq('id', data.id)
        .select('id, host_id, guest_id, listing_id, message, status, created_at, room_id')
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
