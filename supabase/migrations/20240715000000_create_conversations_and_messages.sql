create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles(id) on delete cascade,
  traveler_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint conversations_host_traveler_listing_key unique (host_id, traveler_id, listing_id)
);

create index if not exists conversations_host_id_idx on public.conversations (host_id);
create index if not exists conversations_traveler_id_idx on public.conversations (traveler_id);
create index if not exists conversations_listing_id_idx on public.conversations (listing_id);

alter table public.conversations enable row level security;

create policy "conversations access own"
  on public.conversations
  for select
  to authenticated
  using (auth.uid() = host_id or auth.uid() = traveler_id);

create policy "conversations insert own"
  on public.conversations
  for insert
  to authenticated
  with check (auth.uid() = host_id or auth.uid() = traveler_id);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

create index if not exists messages_conversation_id_idx on public.messages (conversation_id);
create index if not exists messages_sender_id_idx on public.messages (sender_id);

alter table public.messages enable row level security;

create policy "messages read own conversation"
  on public.messages
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.conversations c
      where c.id = conversation_id
        and (c.host_id = auth.uid() or c.traveler_id = auth.uid())
    )
  );

create policy "messages insert own conversation"
  on public.messages
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.conversations c
      where c.id = conversation_id
        and (c.host_id = auth.uid() or c.traveler_id = auth.uid())
    )
    and sender_id = auth.uid()
  );

alter table public.stay_requests
  add column if not exists conversation_id uuid references public.conversations(id) on delete set null;

create index if not exists stay_requests_conversation_id_idx on public.stay_requests (conversation_id);
