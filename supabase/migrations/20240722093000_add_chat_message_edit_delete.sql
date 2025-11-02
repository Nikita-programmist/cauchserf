alter table public.chat_messages
  add column if not exists edited_at timestamptz null,
  add column if not exists deleted_at timestamptz null;

-- allow updating own messages
drop policy if exists "chat_messages_update_none" on public.chat_messages;
drop policy if exists "update_own_messages" on public.chat_messages;
create policy "update_own_messages"
on public.chat_messages
for update
using (
  sender_id = auth.uid()
  and exists (
    select 1 from public.chat_rooms r
    where r.id = chat_messages.room_id
      and (r.traveler_id = auth.uid() or r.host_id = auth.uid())
  )
)
with check (
  sender_id = auth.uid()
);

-- allow soft deleting own messages via update/delete
drop policy if exists "chat_messages_delete_none" on public.chat_messages;
drop policy if exists "delete_own_messages" on public.chat_messages;
create policy "delete_own_messages"
on public.chat_messages
for delete
using (
  sender_id = auth.uid()
  and exists (
    select 1 from public.chat_rooms r
    where r.id = chat_messages.room_id
      and (r.traveler_id = auth.uid() or r.host_id = auth.uid())
  )
);
