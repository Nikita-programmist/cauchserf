-- Add enhanced metadata to conversations
alter table public.conversations
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists last_message_text text,
  add column if not exists last_message_at timestamptz;

-- Ensure updated_at refreshes on update
create or replace function public.set_conversation_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_set_conversation_updated_at on public.conversations;
create trigger trg_set_conversation_updated_at
before update on public.conversations
for each row
execute function public.set_conversation_updated_at();

-- Extend messages schema to support read receipts and align naming
alter table public.messages
  add column if not exists read_at timestamptz;

-- rename body column to text if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'messages'
      AND column_name = 'body'
  ) THEN
    alter table public.messages rename column body to text;
  END IF;
END
$$;

-- Indexes for faster lookups
create index if not exists messages_conversation_created_idx on public.messages (conversation_id, created_at);
create index if not exists conversations_traveler_idx on public.conversations (traveler_id);
create index if not exists conversations_host_idx on public.conversations (host_id);
create index if not exists conversations_last_message_idx on public.conversations (last_message_at desc);

-- Conversation/bookings bridge
create table if not exists public.conversation_bookings (
  booking_id uuid primary key references public.stay_requests(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.conversation_bookings enable row level security;

drop policy if exists "select_conversation_bookings_participant" on public.conversation_bookings;
create policy "select_conversation_bookings_participant"
  on public.conversation_bookings
  for select
  using (
    exists (
      select 1
      from public.stay_requests sr
      where sr.id = conversation_bookings.booking_id
        and (sr.traveler_id = auth.uid() or sr.host_id = auth.uid())
    )
  );

-- Trigger to keep conversation metadata in sync with new messages
create or replace function public.update_conversation_after_message()
returns trigger
language plpgsql
as $$
begin
  update public.conversations
    set
      updated_at = now(),
      last_message_text = new.text,
      last_message_at = new.created_at
    where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists trg_update_conversation_after_message on public.messages;
create trigger trg_update_conversation_after_message
after insert on public.messages
for each row
execute function public.update_conversation_after_message();

-- Refresh RLS policies to match new rules
drop policy if exists "conv select own" on public.conversations;
drop policy if exists "conv insert own" on public.conversations;
drop policy if exists "select_own_conversations" on public.conversations;
create policy "select_own_conversations"
  on public.conversations
  for select
  using (
    auth.uid() = traveler_id or auth.uid() = host_id
  );

drop policy if exists "msg select own" on public.messages;
drop policy if exists "select_messages_in_my_conversations" on public.messages;
create policy "select_messages_in_my_conversations"
  on public.messages
  for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.traveler_id = auth.uid() or c.host_id = auth.uid())
    )
  );

drop policy if exists "msg insert own" on public.messages;
drop policy if exists "insert_messages_if_participant" on public.messages;
create policy "insert_messages_if_participant"
  on public.messages
  for insert
  with check (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.traveler_id = auth.uid() or c.host_id = auth.uid())
    )
    and sender_id = auth.uid()
  );
