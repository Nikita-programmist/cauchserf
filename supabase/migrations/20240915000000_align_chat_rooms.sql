-- Align chat schema to rooms/room_members/messages structure
-- Drop legacy chat tables if they exist
DROP TABLE IF EXISTS public.conversation_bookings CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;
DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.chat_rooms CASCADE;

-- Core chat tables
CREATE TABLE public.rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.room_members (
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  PRIMARY KEY (room_id, user_id)
);

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_room_id_created_at_idx
  ON public.messages (room_id, created_at DESC);

-- realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Row Level Security
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policies for rooms
CREATE POLICY "read own rooms" ON public.rooms
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.room_members m
      WHERE m.room_id = rooms.id
        AND m.user_id = auth.uid()
    )
  );

-- Policies for room_members
CREATE POLICY "read own membership" ON public.room_members
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "join room" ON public.room_members
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policies for messages
CREATE POLICY "read room messages" ON public.messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.room_members m
      WHERE m.room_id = messages.room_id
        AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "post if member" ON public.messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.room_members m
      WHERE m.room_id = messages.room_id
        AND m.user_id = auth.uid()
    )
  );

-- Stay request linkage
ALTER TABLE public.stay_requests
  DROP COLUMN IF EXISTS conversation_id;

ALTER TABLE public.stay_requests
  ADD COLUMN IF NOT EXISTS room_id uuid REFERENCES public.rooms(id) ON DELETE SET NULL;
