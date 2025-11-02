alter table public.messages
  add column if not exists edited_at timestamptz null,
  add column if not exists deleted_at timestamptz null;

drop policy if exists "update_own_messages" on public.messages;
create policy "update_own_messages"
  on public.messages
  for update
  using (
    sender_id = auth.uid()
    and exists (
      select 1
      from public.conversations c
      where c.id = public.messages.conversation_id
        and (c.traveler_id = auth.uid() or c.host_id = auth.uid())
    )
  )
  with check (
    sender_id = auth.uid()
  );

drop policy if exists "delete_own_messages" on public.messages;
create policy "delete_own_messages"
  on public.messages
  for delete
  using (
    sender_id = auth.uid()
    and exists (
      select 1
      from public.conversations c
      where c.id = public.messages.conversation_id
        and (c.traveler_id = auth.uid() or c.host_id = auth.uid())
    )
  );
