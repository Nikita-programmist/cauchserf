# Домик

Современный стеклянный интерфейс сервиса для каучсерфинга.

## Запуск

```bash
npm install
npm run dev
```

## Design System

Домик использует стеклянную тему поверх Tailwind и shadcn/ui компонентов.

- **Токены** — базовые цвета объявлены в `styles/theme.css` (`--bg`, `--fg`, `--muted`, `--primary`, `--accent`, `--border`, `--ring`). Tailwind подтягивает их как `bg`, `fg`, `muted`, `primary`, `accent`, `border`, `ring`.
- **Стеклянные утилиты** — классы `.glass`, `.glass-strong`, `.glass-card` доступны из `@layer utilities`. Они добавляют прозрачный фон, размытие, бордер и ring. На мобильных устройствах размытие автоматически слабее.
- **Кнопки** — `.btn-solid`, `.btn-ghost`, `.btn-glass` покрывают основные состояния. Используйте `.btn-solid` для CTA, `.btn-glass` внутри стеклянных блоков, `.btn-ghost` для вторичных действий.
- **Карточки и диалоги** — компоненты из `components/ui` по умолчанию применяют стеклянные классы.
- **Fallback** — если `backdrop-filter` недоступен, фон становится менее прозрачным для сохранения читабельности.

Подробнее — см. [`docs/UX.md`](docs/UX.md).

## CHAT SETUP

### Database SQL

В Supabase SQL Editor выполните следующий скрипт (адаптируйте имена таблиц, если у вас другой бэкенд бронирований):

```sql
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  traveler_id uuid not null,
  host_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_message_text text,
  last_message_at timestamptz
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null,
  text text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create table if not exists public.conversation_bookings (
  booking_id uuid primary key references public.stay_requests(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists messages_conversation_created_idx on public.messages (conversation_id, created_at);
create index if not exists conversations_traveler_idx on public.conversations (traveler_id);
create index if not exists conversations_host_idx on public.conversations (host_id);
create index if not exists conversations_last_message_idx on public.conversations (last_message_at desc);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.conversation_bookings enable row level security;

drop policy if exists "select_own_conversations" on public.conversations;
create policy "select_own_conversations"
  on public.conversations
  for select
  using (auth.uid() = traveler_id or auth.uid() = host_id);

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

drop policy if exists "select_conversation_bookings_participant" on public.conversation_bookings;
create policy "select_conversation_bookings_participant"
  on public.conversation_bookings
  for select
  using (
    exists (
      select 1 from public.stay_requests sr
      where sr.id = conversation_bookings.booking_id
        and (sr.traveler_id = auth.uid() or sr.host_id = auth.uid())
    )
  );

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
```

### Environment

Добавьте в `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### Локальный запуск и проверка

1. `npm install` и `npm run dev`.
2. В Supabase создайте двух тестовых пользователей (Traveler и Host).
3. Добавьте запись в `stay_requests` с `traveler_id` и `host_id` тестовых пользователей и статусом `pending`.
4. Вызовите `getOrCreateConversationForBooking(bookingId)` (через API/скрипт) один раз, чтобы связать бронирование и чат.
5. Авторизуйтесь в двух браузерах разными пользователями, откройте `/chat/<conversationId>`.
6. Отправляйте сообщения и убедитесь, что они появляются в реальном времени без перезагрузки.
