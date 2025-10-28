import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { useAuth } from '../../../components/AuthProvider';
import UploadField from '../../../components/UploadField';
import { Button } from '../../../components/ui/button';

const initialFormState = {
  title: '',
  city: '',
  description: '',
  guests: 1
};

export default function NewListingPage() {
  const router = useRouter();
  const { supabase, hasSupabaseEnv } = useAuth();

  const [form, setForm] = useState(initialFormState);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [profileRole, setProfileRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [checkingAccess, setCheckingAccess] = useState(true);

  useEffect(() => {
    if (!supabase || !hasSupabaseEnv) {
      setError('Подключение к Supabase недоступно.');
      setCheckingAccess(false);
      return;
    }

    let active = true;

    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!active) return;

      const currentUser = data?.user;
      if (!currentUser) {
        router.replace('/login');
        return;
      }

      setUserId(currentUser.id);

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (!active) return;

      const role = profile?.role ?? null;
      setProfileRole(role);

      if (role !== 'host') {
        router.replace('/profile');
      }

      setCheckingAccess(false);
    };

    loadUser();

    return () => {
      active = false;
    };
  }, [supabase, hasSupabaseEnv, router]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleGuestsChange = (event) => {
    const value = Number(event.target.value);
    setForm((prev) => ({ ...prev, guests: Math.min(10, Math.max(1, value || 1)) }));
  };

  const handlePhotosChange = (files) => {
    if (!Array.isArray(files)) {
      setPhotoFiles([]);
      return;
    }
    setPhotoFiles(files.slice(0, 4));
  };

  const uploadPhotos = async (userIdValue) => {
    if (!photoFiles.length) return [];

    const uploadedUrls = [];

    for (const [index, file] of photoFiles.entries()) {
      const hasExtension = file.name.includes('.');
      const extension = hasExtension ? file.name.split('.').pop() : '';
      const safeExtension = extension ? `.${extension}` : '';
      const filePath = `${userIdValue}/${Date.now()}_${index}${safeExtension}`;
      const { error: uploadError } = await supabase.storage.from('listings').upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicData } = supabase.storage.from('listings').getPublicUrl(filePath);
      if (publicData?.publicUrl) {
        uploadedUrls.push(publicData.publicUrl);
      }
    }

    return uploadedUrls;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!supabase || !hasSupabaseEnv) {
      setError('Нет подключения к Supabase. Попробуйте позже.');
      return;
    }

    if (!userId) {
      setError('Не удалось определить пользователя.');
      return;
    }

    if (profileRole !== 'host') {
      setError('Создавать объявления могут только хозяева.');
      return;
    }

    const trimmedTitle = form.title.trim();
    const trimmedCity = form.city.trim();

    if (!trimmedTitle || !trimmedCity) {
      setError('Название и город обязательны.');
      return;
    }

    setSubmitting(true);
    setError('');

    let photoUrls = [];

    try {
      photoUrls = await uploadPhotos(userId);
    } catch (uploadError) {
      console.error(uploadError);
      alert('Не удалось загрузить фотографии. Попробуйте ещё раз.');
      setSubmitting(false);
      return;
    }

    const { data, error: insertError } = await supabase
      .from('listings')
      .insert({
        host_id: userId,
        city: trimmedCity,
        title: trimmedTitle,
        description: form.description,
        guests: form.guests,
        photos: photoUrls
      })
      .select('id')
      .maybeSingle();

    setSubmitting(false);

    if (insertError || !data) {
      console.error(insertError);
      setError(insertError?.message || 'Не удалось сохранить объявление.');
      return;
    }

    router.push(`/listings/${data.id}`);
  };

  return (
    <>
      <Head>
        <title>Новое объявление — Домик</title>
      </Head>
      <main className="mx-auto mt-16 flex w-full max-w-3xl flex-col gap-6 px-6 pb-16">
        <section className="glass flex flex-col gap-6 px-8 py-10">
          <div>
            <h1 className="text-3xl font-semibold text-fg">Создайте объявление</h1>
            <p className="mt-2 text-sm text-fg/70">
              Поделитесь своим пространством с путешественниками Домика.
            </p>
          </div>
          {checkingAccess ? (
            <p className="text-sm text-fg/70">Проверяем доступ…</p>
          ) : null}
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            <label className="flex flex-col gap-2 text-sm text-fg/80">
              <span>Название *</span>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Например, Уютная студия у моря"
                className="rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-fg placeholder:text-fg/40 focus:border-white/60 focus:outline-none"
                required
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-fg/80">
              <span>Город *</span>
              <input
                type="text"
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="Где находится жильё?"
                className="rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-fg placeholder:text-fg/40 focus:border-white/60 focus:outline-none"
                required
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-fg/80">
              <span>Описание</span>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={5}
                placeholder="Расскажите о жилье, особенностях и правилах"
                className="rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-fg placeholder:text-fg/40 focus:border-white/60 focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-fg/80">
              <span>Гостей</span>
              <input
                type="number"
                name="guests"
                value={form.guests}
                onChange={handleGuestsChange}
                min={1}
                max={10}
                className="w-28 rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-fg focus:border-white/60 focus:outline-none"
              />
            </label>
            <div className="flex flex-col gap-2 text-sm text-fg/80">
              <span>Фотографии (до 4)</span>
              <UploadField
                multiple
                maxFiles={4}
                onFilesChange={handlePhotosChange}
                onLimitExceeded={() => alert('Можно загрузить не более 4 фотографий.')}
                helperText="Можно загрузить до 4 фотографий."
              />
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={submitting || checkingAccess}>
                {submitting ? 'Сохраняем…' : 'Опубликовать'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => router.back()} disabled={submitting}>
                Отмена
              </Button>
            </div>
          </form>
        </section>
      </main>
    </>
  );
}
