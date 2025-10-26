create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null,
  guest_id uuid not null,
  listing_title text,
  start_date date not null,
  end_date date not null,
  message text,
  created_at timestamp with time zone default now()
);

alter table public.requests enable row level security;

create index if not exists requests_host_id_idx on public.requests (host_id);
create index if not exists requests_guest_id_idx on public.requests (guest_id);

create policy "requests insert own"
  on public.requests
  for insert
  to authenticated
  with check (auth.uid() = guest_id);

create policy "requests select host or guest"
  on public.requests
  for select
  to authenticated
  using (auth.uid() = guest_id or auth.uid() = host_id);
