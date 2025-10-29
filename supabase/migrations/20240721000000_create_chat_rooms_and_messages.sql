-- Chat profiles table ensures alignment with auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text
);

alter table public.profiles
  alter column display_name drop not null;

-- Chat rooms mapping travelers and hosts
create table if not exists public.chat_rooms (
  id uuid primary key default gen_random_uuid(),
  traveler_id uuid not null references public.profiles(id) on delete cascade,
  host_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (traveler_id, host_id)
);

create index if not exists chat_rooms_traveler_idx on public.chat_rooms (traveler_id);
create index if not exists chat_rooms_host_idx on public.chat_rooms (host_id);

-- Individual messages
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.chat_rooms(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz null
);

create index if not exists chat_messages_room_created_idx
  on public.chat_messages (room_id, created_at desc);

-- Enable row level security
alter table public.chat_rooms enable row level security;
alter table public.chat_messages enable row level security;

-- Policies for chat_rooms
create policy if not exists "chat_rooms_select_own"
  on public.chat_rooms
  for select
  using (
    auth.uid() = traveler_id or auth.uid() = host_id
  );

create policy if not exists "chat_rooms_insert_participant"
  on public.chat_rooms
  for insert
  with check (
    auth.uid() = traveler_id or auth.uid() = host_id
  );

create policy if not exists "chat_rooms_update_none"
  on public.chat_rooms
  for update
  using (false)
  with check (false);

create policy if not exists "chat_rooms_delete_none"
  on public.chat_rooms
  for delete
  using (false);

-- Policies for chat_messages
create policy if not exists "chat_messages_select_own"
  on public.chat_messages
  for select
  using (
    exists (
      select 1
      from public.chat_rooms r
      where r.id = chat_messages.room_id
        and (r.traveler_id = auth.uid() or r.host_id = auth.uid())
    )
  );

create policy if not exists "chat_messages_insert_participant"
  on public.chat_messages
  for insert
  with check (
    exists (
      select 1
      from public.chat_rooms r
      where r.id = room_id
        and (r.traveler_id = auth.uid() or r.host_id = auth.uid())
    )
    and sender_id = auth.uid()
  );

create policy if not exists "chat_messages_update_none"
  on public.chat_messages
  for update
  using (false)
  with check (false);

create policy if not exists "chat_messages_delete_none"
  on public.chat_messages
  for delete
  using (false);

