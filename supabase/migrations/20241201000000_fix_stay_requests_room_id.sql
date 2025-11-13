-- Ensure enums exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'application_status' AND typnamespace = 'public'::regnamespace
  ) THEN
    CREATE TYPE public.application_status AS ENUM ('pending', 'accepted', 'declined', 'cancelled');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'room_role' AND typnamespace = 'public'::regnamespace
  ) THEN
    CREATE TYPE public.room_role AS ENUM ('member', 'host', 'guest', 'traveler');
  END IF;
END
$$;

-- Ensure core chat tables exist
CREATE TABLE IF NOT EXISTS public.rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.room_members (
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.room_role NOT NULL DEFAULT 'member',
  PRIMARY KEY (room_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid NOT NULL,
  guest_id uuid NOT NULL,
  listing_id uuid,
  start_date date,
  end_date date,
  message text,
  status public.application_status NOT NULL DEFAULT 'pending',
  room_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Bring existing applications columns into alignment
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS host_id uuid;
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS guest_id uuid;
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS listing_id uuid;
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS start_date date;
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS end_date date;
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS message text;
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS status public.application_status;
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS room_id uuid;
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS created_at timestamptz;
ALTER TABLE public.applications
  ALTER COLUMN created_at SET DEFAULT now();

UPDATE public.applications
SET created_at = now()
WHERE created_at IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'applications'
      AND column_name = 'status'
      AND data_type <> 'USER-DEFINED'
  ) THEN
    UPDATE public.applications
    SET status = COALESCE(status, 'pending')
    WHERE status IS NULL;

    UPDATE public.applications
    SET status = 'pending'
    WHERE status NOT IN ('pending', 'accepted', 'declined', 'cancelled');

    ALTER TABLE public.applications
      ALTER COLUMN status TYPE public.application_status
      USING (status::text::public.application_status);
  END IF;
END
$$;

ALTER TABLE public.applications
  ALTER COLUMN status SET DEFAULT 'pending'::public.application_status;

UPDATE public.applications
SET status = 'pending'::public.application_status
WHERE status IS NULL;

ALTER TABLE public.applications
  ALTER COLUMN status SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.applications
    WHERE host_id IS NULL
  ) THEN
    EXECUTE 'ALTER TABLE public.applications ALTER COLUMN host_id SET NOT NULL';
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.applications
    WHERE guest_id IS NULL
  ) THEN
    EXECUTE 'ALTER TABLE public.applications ALTER COLUMN guest_id SET NOT NULL';
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.applications
    WHERE created_at IS NULL
  ) THEN
    EXECUTE 'ALTER TABLE public.applications ALTER COLUMN created_at SET NOT NULL';
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'applications_room_id_fkey'
      AND conrelid = 'public.applications'::regclass
  ) THEN
    ALTER TABLE public.applications
      ADD CONSTRAINT applications_room_id_fkey
      FOREIGN KEY (room_id)
      REFERENCES public.rooms(id)
      ON DELETE SET NULL;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS applications_host_idx
  ON public.applications(host_id, created_at DESC);
CREATE INDEX IF NOT EXISTS applications_guest_idx
  ON public.applications(guest_id, created_at DESC);
CREATE INDEX IF NOT EXISTS applications_room_idx
  ON public.applications(room_id);

-- Ensure messages optional FK exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'messages_user_id_fkey'
      AND conrelid = 'public.messages'::regclass
  ) THEN
    ALTER TABLE public.messages
      ADD CONSTRAINT messages_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES auth.users(id)
      ON DELETE SET NULL;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS messages_room_id_created_at_idx
  ON public.messages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS room_members_room_idx
  ON public.room_members(room_id);
CREATE INDEX IF NOT EXISTS room_members_user_idx
  ON public.room_members(user_id);

-- Ensure room member roles use the enum type
UPDATE public.room_members
SET role = 'member'
WHERE role IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'room_members'
      AND column_name = 'role'
      AND data_type <> 'USER-DEFINED'
  ) THEN
    ALTER TABLE public.room_members
      ALTER COLUMN role TYPE public.room_role
      USING (
        CASE
          WHEN role IN ('member', 'host', 'guest', 'traveler') THEN role::public.room_role
          ELSE 'member'::public.room_role
        END
      );
  END IF;
END
$$;

ALTER TABLE public.room_members
  ALTER COLUMN role SET DEFAULT 'member'::public.room_role;

UPDATE public.room_members
SET role = 'member'::public.room_role
WHERE role IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_attribute
    WHERE attrelid = 'public.room_members'::regclass
      AND attname = 'role'
      AND attnotnull = false
  ) THEN
    EXECUTE 'ALTER TABLE public.room_members ALTER COLUMN role SET NOT NULL';
  END IF;
END
$$;

-- Ensure stay_requests exposes room_id regardless of legacy schema
DO $$
DECLARE
  stay_requests_is_table boolean;
  stay_requests_is_view boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'stay_requests'
  ) INTO stay_requests_is_table;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.views
    WHERE table_schema = 'public' AND table_name = 'stay_requests'
  ) INTO stay_requests_is_view;

  IF stay_requests_is_table THEN
    EXECUTE 'ALTER TABLE public.stay_requests ADD COLUMN IF NOT EXISTS room_id uuid';

    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'stay_requests_room_id_fkey'
        AND conrelid = 'public.stay_requests'::regclass
    ) THEN
      EXECUTE 'ALTER TABLE public.stay_requests
        ADD CONSTRAINT stay_requests_room_id_fkey
        FOREIGN KEY (room_id)
        REFERENCES public.rooms(id)
        ON DELETE SET NULL';
    END IF;

    EXECUTE 'CREATE INDEX IF NOT EXISTS stay_requests_room_id_idx
      ON public.stay_requests(room_id)';
  END IF;

  IF stay_requests_is_view OR NOT stay_requests_is_table THEN
    EXECUTE $$
      CREATE OR REPLACE VIEW public.stay_requests AS
      SELECT
        a.id,
        a.host_id,
        a.guest_id AS traveler_id,
        a.listing_id,
        a.start_date,
        a.end_date,
        a.message,
        a.status,
        a.room_id,
        a.created_at
      FROM public.applications a
    $$;
  END IF;
END
$$;

-- Ensure RLS is enabled on core tables (safe to rerun)
ALTER TABLE public.rooms        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
