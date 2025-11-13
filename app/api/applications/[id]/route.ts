import { NextResponse } from 'next/server';
import {
  type ApplicationsCtx,
  enrichApplications,
  resolveApplicationsCtx,
  type ApplicationRow,
} from '@/app/api/applications/utils';
import { getAdminSupabase } from '@/lib/supabaseAdmin';
import type { Database } from '@/lib/supabase/types';

type RoomRole = Database['public']['Enums']['room_role'];
type RouteClient = ApplicationsCtx['supabase'];

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function loadApplication(supabase: RouteClient, id: string) {
  return supabase
    .from('applications')
    .select('id, host_id, guest_id, listing_id, start_date, end_date, message, status, created_at, room_id')
    .eq('id', id)
    .maybeSingle();
}

async function ensureRoomMember(roomId: string, userId: string, role: RoomRole) {
  const admin = getAdminSupabase();
  const rows = [
    { room_id: roomId, user_id: userId, role },
  ] satisfies Database['public']['Tables']['room_members']['Insert'][];

  const { error } = await admin
    .from('room_members')
    .upsert(rows, { onConflict: 'room_id,user_id' });

  if (error) {
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

  if (!roomId) {
    throw new Error('room_resolve_failed');
  }

  const ensuredRoomId = roomId;

  await ensureRoomMember(ensuredRoomId, application.host_id, 'host');
  await ensureRoomMember(ensuredRoomId, application.guest_id, 'guest');

  const { error: updateError } = await admin
    .from('applications')
    .update({ status: 'accepted', room_id: ensuredRoomId })
    .eq('id', application.id);

  if (updateError) {
    throw updateError;
  }

  const { data: refreshed, error: refreshError } = await loadApplication(supabase, application.id);

  if (refreshError || !refreshed) {
    throw refreshError ?? new Error('application_update_failed');
  }

  return { ...refreshed, room_id: ensuredRoomId } as ApplicationRow;
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { supabase, user } = await resolveApplicationsCtx();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { data, error } = await loadApplication(supabase, params.id);

  if (error) {
    console.error('[applications] failed to load', error);
    return NextResponse.json({ error: 'failed_to_load' }, { status: 500 });
  }

  const applicationRow = data as ApplicationRow | null;

  if (!applicationRow) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  if (applicationRow.host_id !== user.id && applicationRow.guest_id !== user.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const [application] = await enrichApplications(supabase, [applicationRow]);
  return NextResponse.json({ application });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { supabase, user } = await resolveApplicationsCtx();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const actionRaw = typeof payload?.action === 'string' ? payload.action.trim().toLowerCase() : '';

  if (!['accept', 'decline', 'cancel'].includes(actionRaw)) {
    return NextResponse.json({ error: 'invalid_action' }, { status: 400 });
  }

  const { data, error } = await loadApplication(supabase, params.id);

  if (error) {
    console.error('[applications] failed to load for update', error);
    return NextResponse.json({ error: 'failed_to_load' }, { status: 500 });
  }

  const applicationRow = data as ApplicationRow | null;

  if (!applicationRow) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const isHost = applicationRow.host_id === user.id;
  const isGuest = applicationRow.guest_id === user.id;

  if (!isHost && !isGuest) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  try {
    let updated: ApplicationRow = applicationRow;

    if (actionRaw === 'accept') {
      if (!isHost) {
        return NextResponse.json({ error: 'forbidden' }, { status: 403 });
      }
      if (applicationRow.status === 'accepted' && applicationRow.room_id) {
        await ensureRoomMember(applicationRow.room_id, applicationRow.host_id, 'host');
        await ensureRoomMember(applicationRow.room_id, applicationRow.guest_id, 'guest');
        updated = applicationRow;
      } else {
        updated = await acceptApplication(supabase, applicationRow);
      }
    } else if (actionRaw === 'decline') {
      if (!isHost) {
        return NextResponse.json({ error: 'forbidden' }, { status: 403 });
      }
      const { data: declined, error: declineError } = await supabase
        .from('applications')
        .update({ status: 'declined' })
        .eq('id', applicationRow.id)
        .select('id, host_id, guest_id, listing_id, start_date, end_date, message, status, created_at, room_id')
        .single();
      if (declineError || !declined) {
        throw declineError ?? new Error('decline_failed');
      }
      updated = declined as ApplicationRow;
    } else if (actionRaw === 'cancel') {
      if (!isGuest) {
        return NextResponse.json({ error: 'forbidden' }, { status: 403 });
      }
      const { data: cancelled, error: cancelError } = await supabase
        .from('applications')
        .update({ status: 'cancelled' })
        .eq('id', applicationRow.id)
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
