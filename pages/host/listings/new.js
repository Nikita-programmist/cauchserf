import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import BackToHomeLink from '../../../components/BackToHomeLink';
import { useAuth } from '../../../components/AuthProvider';
import { apiClient } from '../../../lib/apiClient';

const initialFormState = {
  title: '',
  description: '',
  city: '',
  country: '',
  address: '',
  capacity: 1,
  pricePerNight: ''
};

export default function NewListingPage() {
  const router = useRouter();
  const { token, loading: authLoading, refreshUser } = useAuth();

  const [form, setForm] = useState(initialFormState);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      router.replace('/login');
      return;
    }

    const checkRole = async () => {
      try {
        const profile = await refreshUser();
        if (!profile) {
          router.replace('/login');
          return;
        }
        if (profile.role !== 'HOST') {
          setError('Создавать объявления могут только хосты.');
        }
      } catch (err) {
        setError(err?.message || 'Не удалось проверить доступ');
      }
    };

    checkRole();
  }, [authLoading, token, refreshUser, router]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCapacityChange = (event) => {
    const value = Number(event.target.value) || 1;
    setForm((prev) => ({ ...prev, capacity: Math.max(1, value) }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.title.trim() || !form.city.trim() || !form.country.trim()) {
      setError('Название, город и страна обязательны.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        city: form.city.trim(),
        country: form.country.trim(),
        address: form.address.trim() || undefined,
        capacity: form.capacity || undefined,
        pricePerNight: form.pricePerNight ? Number(form.pricePerNight) : undefined
      };
      const created = await apiClient.post('/places', payload);
      if (created?.id) {
        router.replace(`/listings/${created.id}`);
      } else {
        setError('Не удалось сохранить объявление');
      }
    } catch (err) {
      setError(err?.message || 'Не удалось сохранить объявление');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Новое объявление — Домик</title>
      </Head>
      <main className="mx-auto mt-16 flex w-full max-w-3xl flex-col gap-6 px-6 pb-16">
        <BackToHomeLink className="self-start" />
        <section className="glass flex flex-col gap-6 px-8 py-10">
          <div>
            <h1 className="text-3xl font-semibold text-fg">Создайте объявление</h1>
            <p className="mt-2 text-sm text-fg/70">Заполните данные о вашем жилье, чтобы гости могли вас найти.</p>
          </div>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <label className="flex flex-col gap-2 text-sm text-fg/80">
              Название
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm text-fg placeholder:text-fg/40 focus:border-white/60 focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-fg/80">
              Описание
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm text-fg placeholder:text-fg/40 focus:border-white/60 focus:outline-none"
              />
            </label>
            <div className="flex flex-col gap-3 md:flex-row">
              <label className="flex flex-1 flex-col gap-2 text-sm text-fg/80">
                Город
                <input
                  type="text"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm text-fg placeholder:text-fg/40 focus:border-white/60 focus:outline-none"
                />
              </label>
              <label className="flex flex-1 flex-col gap-2 text-sm text-fg/80">
                Страна
                <input
                  type="text"
                  name="country"
                  value={form.country}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm text-fg placeholder:text-fg/40 focus:border-white/60 focus:outline-none"
                />
              </label>
            </div>
            <label className="flex flex-col gap-2 text-sm text-fg/80">
              Адрес (по желанию)
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={handleChange}
                className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm text-fg placeholder:text-fg/40 focus:border-white/60 focus:outline-none"
              />
            </label>
            <div className="flex flex-col gap-3 md:flex-row">
              <label className="flex flex-1 flex-col gap-2 text-sm text-fg/80">
                Вместимость
                <input
                  type="number"
                  min="1"
                  name="capacity"
                  value={form.capacity}
                  onChange={handleCapacityChange}
                  className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm text-fg placeholder:text-fg/40 focus:border-white/60 focus:outline-none"
                />
              </label>
              <label className="flex flex-1 flex-col gap-2 text-sm text-fg/80">
                Цена за ночь (₽)
                <input
                  type="number"
                  min="0"
                  name="pricePerNight"
                  value={form.pricePerNight}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm text-fg placeholder:text-fg/40 focus:border-white/60 focus:outline-none"
                />
              </label>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => router.push('/host/listings')}
                className="rounded-xl border border-white/30 px-5 py-2 text-sm font-semibold text-fg transition hover:border-white/60 hover:bg-white/10"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-white/80 px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? 'Сохраняем…' : 'Сохранить'}
              </button>
            </div>
          </form>
        </section>
      </main>
    </>
  );
}
