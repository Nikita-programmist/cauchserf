'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import useSWR from 'swr';

type Role = 'guest' | 'host';

type ProfileSummary = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  city: string | null;
  role: string | null;
};

type ApplicationItem = {
  id: string;
  host_id: string;
  guest_id: string;
  listing_id: string | null;
  message: string | null;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  created_at: string | null;
  room_id: string | null;
  host: ProfileSummary | null;
  guest: ProfileSummary | null;
};

type ApplicationsResponse = {
  role: Role;
  items: ApplicationItem[];
  pagination: {
    limit: number;
    page: number;
    total: number;
  };
};

const fetcher = async ([_key, role]: [string, Role]): Promise<ApplicationsResponse> => {
  const response = await fetch(`/api/applications?role=${role}`, {
    credentials: 'include',
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const message = typeof data?.error === 'string' ? data.error : 'failed_to_load';
    throw new Error(message);
  }
  return response.json();
};

const statusLabels: Record<ApplicationItem['status'], string> = {
  pending: 'В обработке',
  accepted: 'Принята',
  declined: 'Отклонена',
  cancelled: 'Отменена',
};

function formatDate(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export default function ApplicationsPageClient() {
  const router = useRouter();
  const [activeRole, setActiveRole] = useState<Role>('guest');
  const [actionError, setActionError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { data, error, isLoading, mutate } = useSWR<ApplicationsResponse, Error>(
    ['applications', activeRole],
    fetcher,
    {
      revalidateOnFocus: false,
      keepPreviousData: true,
    }
  );

  const applications = data?.items ?? [];

  const handleRoleChange = useCallback((role: Role) => {
    setActiveRole(role);
    setActionError('');
  }, []);

  const handleAction = useCallback(
    async (id: string, status: 'accepted' | 'declined' | 'cancelled') => {
      setActionError('');
      setActionLoading(`${id}:${status}`);
      try {
        const response = await fetch(`/api/applications/${id}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status }),
        });

        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          const message = typeof payload?.error === 'string' ? payload.error : 'Не удалось обновить статус';
          throw new Error(message);
        }

        await mutate();

        if (status === 'accepted' && typeof payload?.room_id === 'string' && payload.room_id) {
          router.push(`/chat/${payload.room_id}`);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Произошла ошибка';
        setActionError(message);
      } finally {
        setActionLoading(null);
      }
    },
    [mutate, router]
  );

  const listContent = useMemo(() => {
    if (isLoading) {
      return <div className="rounded-3xl border border-white/15 bg-white/5 px-8 py-12 text-sm text-fg/70">Загружаем заявки…</div>;
    }

    if (error) {
      return (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-8 py-12 text-sm text-red-600">
          Не удалось загрузить заявки: {error.message}
        </div>
      );
    }

    if (applications.length === 0) {
      return (
        <div className="rounded-3xl border border-white/15 bg-white/5 px-8 py-12 text-center text-sm text-fg/70">
          <p className="text-base font-medium text-fg">Пока нет заявок</p>
          <p className="mt-2 text-sm text-fg/60">
            {activeRole === 'host'
              ? 'Когда гости отправят запросы на проживание, они появятся здесь.'
              : 'Вы ещё не отправляли заявок хозяевам. Найдите интересное жильё и попробуйте!'}
          </p>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-6">
        {applications.map((application) => {
          const counterpart = activeRole === 'host' ? application.guest : application.host;
          const counterpartName = `${counterpart?.first_name ?? ''} ${counterpart?.last_name ?? ''}`.trim() ||
            (activeRole === 'host' ? 'Гость' : 'Хозяин');
          const canAccept = activeRole === 'host' && application.status === 'pending';
          const canDecline = activeRole === 'host' && application.status === 'pending';
          const canCancel = activeRole === 'guest' && application.status === 'pending';
          const canOpenChat = application.status === 'accepted' && Boolean(application.room_id);

          return (
            <article
              key={application.id}
              className="rounded-3xl border border-white/15 bg-white/5 px-6 py-6 shadow-lg shadow-slate-900/5"
            >
              <div className="flex flex-col gap-6 sm:flex-row sm:gap-8">
                <div className="flex-shrink-0">
                  <div className="h-20 w-20 overflow-hidden rounded-2xl border border-white/20 bg-white/5">
                    {counterpart?.avatar_url ? (
                      <img
                        src={counterpart.avatar_url}
                        alt={counterpartName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-fg/60">Нет фото</div>
                    )}
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-4 text-sm text-fg/80">
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-lg font-semibold text-fg">{counterpartName}</h2>
                      <span className="rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-[0.18em] text-fg/70">
                        {statusLabels[application.status]}
                      </span>
                    </div>
                    <p className="text-xs text-fg/60">Отправлена {formatDate(application.created_at)}</p>
                    {counterpart?.city ? (
                      <p className="text-sm text-fg/70">{counterpart.city}</p>
                    ) : null}
                  </div>
                  {application.message ? (
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-fg/60">Сообщение</p>
                      <p className="mt-2 whitespace-pre-line text-sm text-fg/80">{application.message}</p>
                    </div>
                  ) : null}
                  <div className="flex flex-wrap gap-3 pt-2">
                    {canAccept ? (
                      <button
                        type="button"
                        onClick={() => handleAction(application.id, 'accepted')}
                        disabled={actionLoading === `${application.id}:accepted`}
                        className="inline-flex items-center justify-center rounded-full border border-[#003B32]/50 bg-[#003B32]/10 px-4 py-2 text-sm font-medium text-[#003B32] transition hover:border-[#003B32]/70 hover:bg-[#003B32]/20 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {actionLoading === `${application.id}:accepted` ? 'Принимаем…' : 'Принять и открыть чат'}
                      </button>
                    ) : null}
                    {canDecline ? (
                      <button
                        type="button"
                        onClick={() => handleAction(application.id, 'declined')}
                        disabled={actionLoading === `${application.id}:declined`}
                        className="inline-flex items-center justify-center rounded-full border border-white/30 px-4 py-2 text-sm font-medium text-fg/80 transition hover:border-white/60 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {actionLoading === `${application.id}:declined` ? 'Отклоняем…' : 'Отклонить'}
                      </button>
                    ) : null}
                    {canCancel ? (
                      <button
                        type="button"
                        onClick={() => handleAction(application.id, 'cancelled')}
                        disabled={actionLoading === `${application.id}:cancelled`}
                        className="inline-flex items-center justify-center rounded-full border border-white/30 px-4 py-2 text-sm font-medium text-fg/80 transition hover:border-white/60 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {actionLoading === `${application.id}:cancelled` ? 'Отменяем…' : 'Отменить'}
                      </button>
                    ) : null}
                    {canOpenChat ? (
                      <button
                        type="button"
                        onClick={() => router.push(`/chat/${application.room_id}`)}
                        className="inline-flex items-center justify-center rounded-full border border-white/30 px-4 py-2 text-sm font-medium text-fg/80 transition hover:border-white/60 hover:bg-white/10"
                      >
                        Открыть чат
                      </button>
                    ) : null}
                    <Link
                      href={activeRole === 'host' ? `/profile/${application.guest_id}` : `/profile/${application.host_id}`}
                      className="inline-flex items-center justify-center rounded-full border border-white/30 px-4 py-2 text-sm font-medium text-fg/80 transition hover:border-white/60 hover:bg-white/10"
                    >
                      Профиль {activeRole === 'host' ? 'гостя' : 'хозяина'}
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    );
  }, [applications, activeRole, actionLoading, error, handleAction, isLoading, router]);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-12">
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.28em] text-fg/60">Заявки</p>
        <h1 className="text-3xl font-semibold text-fg">Общение с хозяевами и гостями</h1>
        <p className="text-sm text-fg/70">
          Управляйте заявками, принимайте гостей и переходите в чат, чтобы обсудить детали поездки.
        </p>
      </div>

      <div className="flex gap-3 rounded-full border border-white/15 bg-white/5 p-1 text-sm text-fg/70">
        <button
          type="button"
          onClick={() => handleRoleChange('guest')}
          className={`flex-1 rounded-full px-4 py-2 font-medium transition ${
            activeRole === 'guest'
              ? 'bg-white/90 text-[#0B3D3A] shadow'
              : 'hover:bg-white/10 hover:text-fg'
          }`}
        >
          Как гость
        </button>
        <button
          type="button"
          onClick={() => handleRoleChange('host')}
          className={`flex-1 rounded-full px-4 py-2 font-medium transition ${
            activeRole === 'host'
              ? 'bg-white/90 text-[#0B3D3A] shadow'
              : 'hover:bg-white/10 hover:text-fg'
          }`}
        >
          Как хост
        </button>
      </div>

      {actionError ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-6 py-3 text-sm text-red-600">
          {actionError}
        </div>
      ) : null}

      {listContent}
    </div>
  );
}
