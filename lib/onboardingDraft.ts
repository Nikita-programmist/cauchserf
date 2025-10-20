export type OnboardingRole = 'host' | 'traveler' | null;

export interface HostMeta {
  maxGuests?: number;
  amenities?: string[];
  rules?: string;
}

export interface TravelerMeta {
  interests?: string[];
  aboutTrip?: string;
}

export interface OnboardingDraft {
  role: OnboardingRole;
  display_name: string;
  city: string;
  languages: string[];
  bio: string;
  avatar_url: string;
  host_meta: HostMeta;
  traveler_meta: TravelerMeta;
}

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

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function ensureDraftShape(raw: unknown): OnboardingDraft {
  if (!raw || typeof raw !== 'object') {
    return { ...defaultDraft };
  }

  const value = raw as Partial<OnboardingDraft>;

  return {
    role: value.role === 'host' || value.role === 'traveler' ? value.role : null,
    display_name: typeof value.display_name === 'string' ? value.display_name : '',
    city: typeof value.city === 'string' ? value.city : '',
    languages: Array.isArray(value.languages) ? value.languages.filter((item) => typeof item === 'string') : [],
    bio: typeof value.bio === 'string' ? value.bio : '',
    avatar_url: typeof value.avatar_url === 'string' ? value.avatar_url : '',
    host_meta: {
      ...(typeof value.host_meta === 'object' && value.host_meta ? value.host_meta : {})
    },
    traveler_meta: {
      ...(typeof value.traveler_meta === 'object' && value.traveler_meta ? value.traveler_meta : {})
    }
  } as OnboardingDraft;
}

export function loadDraft(): OnboardingDraft {
  if (!isBrowser()) {
    return { ...defaultDraft };
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { ...defaultDraft };
    }

    const parsed = JSON.parse(stored);
    const ensured = ensureDraftShape(parsed);
    return {
      ...defaultDraft,
      ...ensured,
      languages: ensured.languages ?? [],
      host_meta: ensured.host_meta ?? {},
      traveler_meta: ensured.traveler_meta ?? {}
    };
  } catch (error) {
    console.warn('Failed to load onboarding draft', error);
    return { ...defaultDraft };
  }
}

function mergeDraft(base: OnboardingDraft, update: Partial<OnboardingDraft>): OnboardingDraft {
  return {
    ...base,
    ...update,
    languages: update.languages ?? base.languages,
    host_meta: {
      ...base.host_meta,
      ...(update.host_meta ?? {})
    },
    traveler_meta: {
      ...base.traveler_meta,
      ...(update.traveler_meta ?? {})
    }
  };
}

export function saveDraft(update: Partial<OnboardingDraft>): void {
  if (!isBrowser()) {
    return;
  }

  const current = loadDraft();
  const next = mergeDraft(current, update);

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (error) {
    console.warn('Failed to save onboarding draft', error);
  }
}

export function clearDraft(): void {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear onboarding draft', error);
  }
}
