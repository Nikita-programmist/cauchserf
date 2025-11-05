alter table if exists public.messages disable row level security;

drop policy if exists "select_messages_in_my_conversations" on public.messages;
drop policy if exists "insert_messages_if_participant" on public.messages;
drop policy if exists "update_own_messages" on public.messages;
drop policy if exists "delete_own_messages" on public.messages;
drop policy if exists "msg select own" on public.messages;
drop policy if exists "msg insert own" on public.messages;
