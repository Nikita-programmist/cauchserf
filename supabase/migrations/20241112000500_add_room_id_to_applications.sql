alter table public.applications
  add column if not exists room_id uuid references public.rooms(id) on delete set null;

create index if not exists applications_room_idx on public.applications(room_id);
