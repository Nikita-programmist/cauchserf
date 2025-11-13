-- Ensure applications table exists with required columns
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null,
  guest_id uuid not null,
  listing_id uuid,
  start_date date,
  end_date date,
  message text,
  status text not null default 'pending' check (status in ('pending','accepted','declined','cancelled')),
  room_id uuid,
  created_at timestamptz default now()
);

alter table public.applications
  add column if not exists host_id uuid;
alter table public.applications
  alter column host_id set not null;
alter table public.applications
  add column if not exists guest_id uuid;
alter table public.applications
  alter column guest_id set not null;
alter table public.applications
  add column if not exists listing_id uuid;
alter table public.applications
  add column if not exists start_date date;
alter table public.applications
  add column if not exists end_date date;
alter table public.applications
  add column if not exists message text;
alter table public.applications
  add column if not exists status text;
alter table public.applications
  alter column status set default 'pending';
alter table public.applications
  alter column status set not null;
alter table public.applications
  add constraint if not exists applications_status_check
  check (status in ('pending','accepted','declined','cancelled'));
alter table public.applications
  add column if not exists room_id uuid;
alter table public.applications
  add constraint if not exists applications_room_id_fkey
  foreign key (room_id) references public.rooms(id) on delete set null;
alter table public.applications
  add column if not exists created_at timestamptz;
alter table public.applications
  alter column created_at set default now();

create index if not exists applications_host_idx
  on public.applications(host_id, created_at desc);
create index if not exists applications_guest_idx
  on public.applications(guest_id, created_at desc);
create index if not exists applications_room_idx
  on public.applications(room_id);

-- Chat schema
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now()
);

create table if not exists public.room_members (
  room_id uuid references public.rooms(id) on delete cascade,
  user_id uuid not null,
  role text default 'member',
  primary key (room_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid,
  content text not null,
  created_at timestamptz default now()
);

create index if not exists messages_room_id_created_at_idx
  on public.messages(room_id, created_at desc);

-- Ensure realtime publication includes messages
DO $$
BEGIN
  EXECUTE 'alter publication supabase_realtime add table public.messages;';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Backwards compatibility view for stay_requests
create or replace view public.stay_requests as
  select
    id,
    host_id,
    guest_id as traveler_id,
    listing_id,
    start_date,
    end_date,
    message,
    status,
    room_id,
    created_at
  from public.applications;

-- Enable row level security
alter table public.rooms        enable row level security;
alter table public.room_members enable row level security;
alter table public.messages     enable row level security;
alter table public.applications enable row level security;

-- Policies for rooms/messages/applications
create policy if not exists "rooms:read" on public.rooms for select
  using (exists (
    select 1 from public.room_members m
    where m.room_id = rooms.id and m.user_id = auth.uid()
  ));

create policy if not exists "room_members:read" on public.room_members for select
  using (user_id = auth.uid());

create policy if not exists "room_members:join" on public.room_members for insert
  with check (true);

create policy if not exists "messages:read" on public.messages for select
  using (exists (
    select 1 from public.room_members m
    where m.room_id = messages.room_id and m.user_id = auth.uid()
  ));

create policy if not exists "messages:post" on public.messages for insert
  with check (exists (
    select 1 from public.room_members m
    where m.room_id = messages.room_id and m.user_id = auth.uid()
  ));

create policy if not exists "applications:read" on public.applications for select
  using (host_id = auth.uid() or guest_id = auth.uid());

create policy if not exists "applications:create" on public.applications for insert
  with check (guest_id = auth.uid());

create policy if not exists "applications:host-update" on public.applications for update
  using (host_id = auth.uid()) with check (host_id = auth.uid());

create policy if not exists "applications:guest-cancel" on public.applications for update
  using (guest_id = auth.uid()) with check (guest_id = auth.uid());
