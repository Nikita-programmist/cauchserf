create table if not exists public.stay_requests (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null,
  host_id uuid not null,
  traveler_id uuid not null,
  start_date date not null,
  end_date date not null,
  message text,
  status text default 'pending',
  created_at timestamp with time zone default now()
);

alter table public.stay_requests
  add constraint stay_requests_listing_id_fkey
  foreign key (listing_id)
  references public.listings (id)
  on delete cascade;

alter table public.stay_requests enable row level security;

create index if not exists stay_requests_listing_id_idx on public.stay_requests (listing_id);
create index if not exists stay_requests_host_id_idx on public.stay_requests (host_id);
create index if not exists stay_requests_traveler_id_idx on public.stay_requests (traveler_id);

create policy "traveler can insert own stay request"
  on public.stay_requests
  for insert
  to authenticated
  with check (auth.uid() = traveler_id);

create policy "participant can select stay request"
  on public.stay_requests
  for select
  to authenticated
  using (auth.uid() = traveler_id or auth.uid() = host_id);

create policy "host can update stay request status"
  on public.stay_requests
  for update
  to authenticated
  using (auth.uid() = host_id)
  with check (auth.uid() = host_id);
