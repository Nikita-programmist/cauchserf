import { describe, expect, it, beforeEach, vi } from 'vitest';

vi.mock('@/app/api/applications/utils', async () => {
  const actual = await vi.importActual<typeof import('@/app/api/applications/utils')>(
    '@/app/api/applications/utils'
  );
  return {
    ...actual,
    getAuthClient: vi.fn(),
    enrichApplications: vi.fn(),
    parsePagination: vi.fn(),
  };
});

vi.mock('@/lib/supabaseAdmin', () => ({
  getAdminSupabase: vi.fn(),
}));

import { GET as listApplications } from '@/app/api/applications/route';
import { PATCH as updateApplication } from '@/app/api/applications/[id]/route';
import {
  enrichApplications,
  getAuthClient,
  parsePagination,
  type ApplicationRow,
} from '@/app/api/applications/utils';
import { getAdminSupabase } from '@/lib/supabaseAdmin';

const mockedGetAuthClient = getAuthClient as unknown as vi.Mock;
const mockedEnrichApplications = enrichApplications as unknown as vi.Mock;
const mockedParsePagination = parsePagination as unknown as vi.Mock;
const mockedGetAdminSupabase = getAdminSupabase as unknown as vi.Mock;

describe('applications API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns applications for the host role', async () => {
    const rawRow: ApplicationRow = {
      id: 'app-1',
      host_id: 'host-1',
      guest_id: 'guest-1',
      listing_id: null,
      start_date: null,
      end_date: null,
      message: 'Привет',
      status: 'pending',
      created_at: '2024-01-01T00:00:00Z',
      room_id: null,
    };

    const rangeMock = vi.fn().mockResolvedValue({
      data: [rawRow],
      error: null,
      count: 1,
    });
    const orderMock = vi.fn().mockReturnValue({ range: rangeMock });
    const eqMock = vi.fn().mockReturnValue({ order: orderMock });
    const selectMock = vi.fn().mockReturnValue({ eq: eqMock });

    const supabase = {
      from: vi.fn().mockReturnValue({ select: selectMock }),
    } as any;

    mockedGetAuthClient.mockResolvedValue({ supabase, user: { id: 'host-1' } });
    mockedParsePagination.mockReturnValue({ limit: 20, page: 1, from: 0, to: 19 });
    mockedEnrichApplications.mockResolvedValue([
      {
        ...rawRow,
        host: null,
        guest: null,
      },
    ]);

    const response = await listApplications(new Request('http://localhost/api/applications?role=host'));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.role).toBe('host');
    expect(body.items).toHaveLength(1);
    expect(mockedEnrichApplications).toHaveBeenCalledWith(supabase, [rawRow]);
    expect(selectMock).toHaveBeenCalled();
    expect(eqMock).toHaveBeenCalledWith('host_id', 'host-1');
  });

  it('accepts an application and returns room id', async () => {
    const baseRow: ApplicationRow = {
      id: 'app-2',
      host_id: 'host-2',
      guest_id: 'guest-2',
      listing_id: null,
      start_date: null,
      end_date: null,
      message: null,
      status: 'pending',
      created_at: '2024-02-01T00:00:00Z',
      room_id: null,
    };

    const updatedRow: ApplicationRow = {
      ...baseRow,
      status: 'accepted',
      room_id: 'room-123',
    };

    const selectSingleMock = vi
      .fn()
      .mockResolvedValueOnce({ data: baseRow, error: null })
      .mockResolvedValueOnce({ data: updatedRow, error: null });
    const applicationsSelectMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({ maybeSingle: selectSingleMock }),
    });

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'applications') {
          return {
            select: applicationsSelectMock,
          } as any;
        }
        throw new Error(`Unexpected table ${table}`);
      }),
    } as any;

    const adminSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'rooms') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: 'room-123' }, error: null }),
              }),
            }),
          } as any;
        }
        if (table === 'room_members') {
          return {
            upsert: vi.fn().mockResolvedValue({ error: null }),
          } as any;
        }
        if (table === 'applications') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          } as any;
        }
        throw new Error(`Unexpected admin table ${table}`);
      }),
    } as any;

    mockedGetAuthClient.mockResolvedValue({ supabase, user: { id: 'host-2' } });
    mockedGetAdminSupabase.mockReturnValue(adminSupabase);
    mockedEnrichApplications.mockResolvedValue([
      { ...updatedRow, host: null, guest: null },
    ]);

    const response = await updateApplication(
      new Request('http://localhost/api/applications/app-2', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'accept' }),
      }),
      { params: { id: 'app-2' } }
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.room_id).toBe('room-123');
    expect(mockedEnrichApplications).toHaveBeenCalledWith(supabase, [updatedRow]);
    expect(mockedGetAdminSupabase).toHaveBeenCalled();
  });
});
