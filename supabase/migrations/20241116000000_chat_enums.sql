-- Ensure chat-related enums exist and columns use them
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'room_role') THEN
    CREATE TYPE public.room_role AS ENUM ('member', 'host', 'guest', 'traveler');
  END IF;
END
$$;

ALTER TABLE public.room_members
  ALTER COLUMN role DROP DEFAULT,
  ALTER COLUMN role TYPE public.room_role USING (
    CASE
      WHEN role IN ('host', 'guest', 'member', 'traveler') THEN role::public.room_role
      ELSE 'member'::public.room_role
    END
  ),
  ALTER COLUMN role SET DEFAULT 'member'::public.room_role,
  ALTER COLUMN role SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'application_status') THEN
    CREATE TYPE public.application_status AS ENUM ('pending', 'accepted', 'declined', 'cancelled');
  END IF;
END
$$;

ALTER TABLE public.applications
  DROP CONSTRAINT IF EXISTS applications_status_check,
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE public.application_status USING (
    CASE status
      WHEN 'accepted' THEN 'accepted'::public.application_status
      WHEN 'declined' THEN 'declined'::public.application_status
      WHEN 'cancelled' THEN 'cancelled'::public.application_status
      ELSE 'pending'::public.application_status
    END
  ),
  ALTER COLUMN status SET DEFAULT 'pending'::public.application_status,
  ALTER COLUMN status SET NOT NULL;
