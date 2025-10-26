import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { supabase } from '../../lib/supabaseClient';
import BackToHome from '../../components/BackToHome';
import AvatarUploader from '../../components/AvatarUploader';

const genderOptions = [
  { value: '', label: 'Выберите пол' },
  { value: 'male', label: 'Мужской' },
  { value: 'female', label: 'Женский' },
  { value: 'other', label: 'Другое' }
];

export default function HostOnboardingPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [city, setCity] = useState('');
  const [bio, setBio] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [beds, setBeds] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [existingAvatarUrl, setExistingAvatarUrl] = useState('');

  useEffect(() => {
    let isActive = true;

    const fetchProfile = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!isActive) return;

      if (!user) {
        router.replace('/login');
        return;
      }

      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (!isActive) return;

      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }

      if (data?.role && data.role !== 'host') {
        router.replace('/profile');
        return;
      }

      if (data) {
        setFirstName(data.first_name ?? '');
        setLastName(data.last_name ?? '');
        setCity(data.city ?? '');
        setBio(data.bio ?? '');
        setAge(data.age ? String(data.age) : '');
        setGender(data.gender ?? '');
        setBeds(data.beds ? String(data.beds) : '');
        setExistingAvatarUrl(data.avatar_url ?? '');
      }

      setLoading(false);
    };

    fetchProfile();

    return () => {
      isActive = false;
    };
  }, [router]);

  const handleFileChange = (file) => {
    setAvatarFile(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSaving(true);

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      setSaving(false);
      router.replace('/login');
      return;
    }

    let avatarUrl = existingAvatarUrl || null;

    if (avatarFile) {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${Date.now()}_avatar.${fileExt || 'jpg'}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, avatarFile, {
        upsert: false
      });

      if (uploadError) {
        setError(uploadError.message);
        setSaving(false);
        return;
      }

      const {
        data: { publicUrl }
      } = supabase.storage.from('avatars').getPublicUrl(filePath);

      avatarUrl = publicUrl;
    }

    const updates = {
      id: user.id,
      role: 'host',
      first_name: firstName.trim() || null,
      last_name: lastName.trim() || null,
      city: city.trim() || null,
      bio: bio.trim() || null,
      age: age ? Number(age) : null,
      gender: gender || null,
      avatar_url: avatarUrl,
      beds: beds ? Number(beds) : null
    };

    const { error: upsertError } = await supabase.from('profiles').upsert(updates);

    if (upsertError) {
      setError(upsertError.message);
      setSaving(false);
      return;
    }

    const { error: metadataError } = await supabase.auth.updateUser({ data: { role: 'host' } });

    if (metadataError) {
      console.error(metadataError);
    }

    setSaving(false);
    router.replace('/profile');
  };

  if (loading) {
    return (
      <main className="mx-auto mt-16 flex w-full max-w-2xl flex-col gap-6 px-6">
        <BackToHome className="self-start" />
        <div className="glass px-8 py-10 text-center text-sm text-fg/70">Загружаем…</div>
      </main>
    );
  }

  return (
    <>
      <Head>
        <title>Анкета хозяина — Домик</title>
      </Head>
      <main className="mx-auto mt-16 flex w-full max-w-2xl flex-col gap-6 px-6">
        <BackToHome className="self-start" />
        <div className="glass flex flex-col gap-6 px-8 py-10">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-fg/60">Шаг 2</p>
            <h1 className="mt-2 text-2xl font-semibold text-fg">Расскажите о себе и своём доме</h1>
            <p className="text-sm text-fg/70">Эта информация поможет путешественникам понять, подходит ли им ваш дом.</p>
          </div>
          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-4 md:flex-row">
              <label className="flex flex-1 flex-col gap-2 text-sm text-fg/80">
                Имя
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  placeholder="Например, Анна"
                  className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm text-fg placeholder:text-fg/40 focus:border-white/60 focus:outline-none"
                />
              </label>
              <label className="flex flex-1 flex-col gap-2 text-sm text-fg/80">
                Фамилия
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  placeholder="Например, Смирнова"
                  className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm text-fg placeholder:text-fg/40 focus:border-white/60 focus:outline-none"
                />
              </label>
            </div>
            <label className="flex flex-col gap-2 text-sm text-fg/80">
              Город
              <input
                type="text"
                required
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="Например, Сочи"
                className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm text-fg placeholder:text-fg/40 focus:border-white/60 focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-fg/80">
              Возраст
              <input
                type="number"
                min="0"
                required
                value={age}
                onChange={(event) => setAge(event.target.value)}
                placeholder="35"
                className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm text-fg placeholder:text-fg/40 focus:border-white/60 focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-fg/80">
              Пол
              <select
                required
                value={gender}
                onChange={(event) => setGender(event.target.value)}
                className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm text-fg focus:border-white/60 focus:outline-none"
              >
                {genderOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm text-fg/80">
              О себе
              <textarea
                required
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                rows={4}
                placeholder="Расскажите, что делает ваш дом особенным"
                className="w-full rounded-2xl border border-white/20 bg-white/5 px-3 py-3 text-sm text-fg placeholder:text-fg/40 focus:border-white/60 focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-fg/80">
              Спальных мест
              <input
                type="number"
                min="0"
                required
                value={beds}
                onChange={(event) => setBeds(event.target.value)}
                placeholder="Например, 2"
                className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm text-fg placeholder:text-fg/40 focus:border-white/60 focus:outline-none"
              />
            </label>
            <div className="flex flex-col gap-2 text-sm text-fg/80">
              <span>Аватар</span>
              <AvatarUploader initialPreviewUrl={existingAvatarUrl} onFileChange={handleFileChange} />
            </div>
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            <button
              type="submit"
              disabled={saving}
              className="self-start rounded-xl bg-white/80 px-6 py-2 text-sm font-semibold text-slate-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? 'Сохраняем…' : 'Продолжить'}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
