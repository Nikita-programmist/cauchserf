export type OnboardingRole = 'host' | 'traveler' | null;

export type HostMeta = {
  maxGuests?: number;
  amenities?: string[];
  rules?: string;
};

export type TravelerMeta = {
  interests?: string[];
  aboutTrip?: string;
};

export type OnboardingDraft = {
  role: OnboardingRole;
  display_name: string;
  city: string;
  languages: string[];
  bio: string;
  avatar_url: string;
  host_meta: HostMeta;
  traveler_meta: TravelerMeta;
};

const STORAGE_KEY = 'domik:onboarding';

const defaultDraft: OnboardingDraft = {
  role: null,
  display_name: '',
  city: '',
  languages: [],
  bio: '',
  avatar_url: '',
  host_meta: {},
  traveler_meta: {}
};

function getStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage;
  } catch (error) {
    return null;
  }
}

export function loadDraft(): OnboardingDraft {
  const storage = getStorage();
  if (!storage) {
    return { ...defaultDraft };
  }

  try {
    const rawValue = storage.getItem(STORAGE_KEY);
    if (!rawValue) {
      return { ...defaultDraft };
    }

    const parsed = JSON.parse(rawValue);

    const role: OnboardingRole = parsed.role === 'host' || parsed.role === 'traveler' ? parsed.role : null;

    const languages = Array.isArray(parsed.languages)
      ? parsed.languages.filter((item: unknown): item is string => typeof item === 'string')
      : [];

    const hostMeta =
      parsed.host_meta && typeof parsed.host_meta === 'object'
        ? { ...parsed.host_meta }
        : {};

    const travelerMeta =
      parsed.traveler_meta && typeof parsed.traveler_meta === 'object'
        ? { ...parsed.traveler_meta }
        : {};

    return {
      ...defaultDraft,
      ...parsed,
      role,
      languages,
      host_meta: hostMeta,
      traveler_meta: travelerMeta
    };
  } catch (error) {
    return { ...defaultDraft };
  }
}

export function saveDraft(partial: Partial<OnboardingDraft>): OnboardingDraft {
  const storage = getStorage();
  const current = loadDraft();

  const nextLanguages = Array.isArray(partial.languages)
    ? Array.from(new Set(partial.languages.filter((item): item is string => typeof item === 'string')))
    : current.languages;

  let nextHostMeta = current.host_meta;
  if ('host_meta' in partial) {
    const incoming = partial.host_meta;
    nextHostMeta = incoming && typeof incoming === 'object' ? { ...current.host_meta, ...incoming } : {};
  }

  let nextTravelerMeta = current.traveler_meta;
  if ('traveler_meta' in partial) {
    const incoming = partial.traveler_meta;
    nextTravelerMeta = incoming && typeof incoming === 'object' ? { ...current.traveler_meta, ...incoming } : {};
  }

  const nextDraft: OnboardingDraft = {
    ...current,
    ...partial,
    role:
      partial.role === 'host' || partial.role === 'traveler'
        ? partial.role
        : partial.role === null
        ? null
        : current.role,
    languages: nextLanguages,
    host_meta: nextHostMeta,
    traveler_meta: nextTravelerMeta
  };

  if (storage) {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(nextDraft));
    } catch (error) {
      // Swallow write errors (e.g., storage quota) to keep UI responsive.
    }
  }

  return nextDraft;
}

export function clearDraft(): void {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  try {
    storage.removeItem(STORAGE_KEY);
  } catch (error) {
    // Ignore storage errors.
  }
}
