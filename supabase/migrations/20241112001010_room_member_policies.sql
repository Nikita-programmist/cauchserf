create policy if not exists "rooms:create" on public.rooms for insert
  with check (auth.role() = 'authenticated');

create policy if not exists "room_members:link-applications" on public.room_members for insert
  with check (
    room_members.user_id = auth.uid()
    or exists (
      select 1
      from public.applications a
      where a.room_id = room_members.room_id
        and a.status = 'accepted'
        and (
          (a.host_id = auth.uid() and a.guest_id = room_members.user_id)
          or (a.guest_id = auth.uid() and a.host_id = room_members.user_id)
        )
    )
  );
