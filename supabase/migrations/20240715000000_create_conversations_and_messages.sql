-- беседа между конкретным гостем (traveler) и конкретным хостом (host)
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles(id) on delete cascade,
  traveler_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- сообщения внутри беседы
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

-- RLS (политики безопасности), чтобы участники беседы могли читать и писать
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- Только сам участник (host или traveler) может видеть эту conversation
drop policy if exists "conv select own" on public.conversations;
create policy "conv select own"
on public.conversations
for select
to authenticated
using (
  auth.uid() = host_id
  or auth.uid() = traveler_id
);

-- Только участник может вставлять (мы создаём диалог для себя и другой стороны)
drop policy if exists "conv insert own" on public.conversations;
create policy "conv insert own"
on public.conversations
for insert
to authenticated
with check (
  auth.uid() = host_id
  or auth.uid() = traveler_id
);

-- сообщения можно читать только если я состою в беседе
drop policy if exists "msg select own" on public.messages;
create policy "msg select own"
on public.messages
for select
to authenticated
using (
  exists (
    select 1
    from public.conversations c
    where c.id = conversation_id
      and (
        c.host_id = auth.uid()
        or c.traveler_id = auth.uid()
      )
  )
);

-- сообщения можно отправлять только в беседу, где я участник
drop policy if exists "msg insert own" on public.messages;
create policy "msg insert own"
on public.messages
for insert
to authenticated
with check (
  exists (
    select 1
    from public.conversations c
    where c.id = conversation_id
      and (
        c.host_id = auth.uid()
        or c.traveler_id = auth.uid()
      )
  )
  and sender_id = auth.uid()
);

alter table public.stay_requests
add column if not exists conversation_id uuid
  references public.conversations(id) on delete set null;
