import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import BackToHomeLink from '../components/BackToHomeLink';
import { useAuth } from '../components/AuthProvider';
import { apiClient } from '../lib/apiClient';

const statusLabels = {
  PENDING: 'В ожидании',
  APPROVED: 'Подтверждена',
  REJECTED: 'Отклонена',
  CANCELLED: 'Отменена'
};

export default function RequestsPage() {
  const router = useRouter();
  const { token, loading: authLoading, refreshUser } = useAuth();

  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      router.replace('/login');
      return;
    }

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const profile = await refreshUser();
        if (!profile) {
          router.replace('/login');
          return;
        }
        if (profile.role !== 'HOST') {
          setError('Заявки доступны только хостам.');
          setLoading(false);
          return;
        }
        const data = await apiClient.get('/stays/host');
        setRequests(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err?.status === 401) {
          router.replace('/login');
          return;
        }
        setError(err?.message || 'Не удалось загрузить заявки');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [authLoading, token, refreshUser, router]);

  if (loading) {
    return (
      <main className="mx-auto mt-16 flex w-full max-w-3xl flex-col gap-6 px-6">
        <BackToHomeLink className="self-start" />
        <div className="glass px-8 py-10 text-center text-sm text-fg/70">Загружаем заявки…</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto mt-16 flex w-full max-w-3xl flex-col gap-6 px-6">
        <BackToHomeLink className="self-start" />
        <div className="glass px-8 py-10 text-center text-sm text-red-400">{error}</div>
      </main>
    );
  }

  return (
    <>
      <Head>
        <title>Заявки гостей — Домик</title>
      </Head>
      <main className="mx-auto mt-16 flex w-full max-w-4xl flex-col gap-6 px-6 pb-16">
        <BackToHomeLink className="self-start" />
        <section className="glass flex flex-col gap-4 px-8 py-10">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-fg/60">Заявки</p>
            <h1 className="text-2xl font-semibold text-fg">Запросы на проживание</h1>
            <p className="text-sm text-fg/70">Следите за входящими заявками от гостей.</p>
          </div>
          {requests.length === 0 ? (
            <p className="text-sm text-fg/70">Пока нет входящих заявок.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {requests.map((request) => (
                <div key={request.id} className="rounded-2xl border border-white/20 bg-white/5 px-5 py-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-fg">{request.place?.title || 'Без названия'}</p>
                      <p className="text-xs text-fg/60">
                        {request.guest?.name || 'Гость'} · {request.guest?.email || '—'}
                      </p>
                    </div>
                    <span className="rounded-full border border-white/30 px-3 py-1 text-xs uppercase tracking-[0.2em] text-fg/80">
                      {statusLabels[request.status] || request.status}
                    </span>
                  </div>
                  <div className="mt-3 text-sm text-fg/80">
                    {request.message || 'Без сообщения'}
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link href="/host/listings" className="text-sm font-medium text-fg hover:underline">
            Перейти к объявлениям
          </Link>
        </section>
      </main>
    </>
  );
}
