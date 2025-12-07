# Домик

Современный стеклянный интерфейс сервиса для каучсерфинга.

## Запуск

```bash
npm install
npm run dev
```

## Backend

```bash
cd backend
npm install
npm run start:dev
```

### Переменные окружения для backend (`backend/.env`)

- `DATABASE_URL` — строка подключения к PostgreSQL.
- `JWT_SECRET` — секрет для подписи JWT.
- `PORT` — порт, на котором слушает backend.
- `FRONTEND_URL` — домен фронтенда в продакшене (для CORS).
- `FRONTEND_URL_LOCAL` — локальный адрес фронтенда (для CORS в dev).

### Переменные окружения для фронтенда

- `NEXT_PUBLIC_API_URL` — базовый URL backend (например, `http://localhost:3001`).

## Backend deploy to Koyeb

Для деплоя backend-а на Koyeb используется каталог `backend` с NestJS-приложением. Koyeb задаёт переменную `PORT` автоматически, приложение слушает её (fallback — `8000`) и биндуется на `0.0.0.0`.

Необходимые переменные окружения:

- `DATABASE_URL`
- `JWT_SECRET`
- `FRONTEND_URL`
- `FRONTEND_URL_LOCAL`
- `NODE_ENV`
- `PORT` (передаётся Koyeb автоматически)

Локальный запуск, имитирующий сборку/запуск на Koyeb:

```bash
npm run build:koyeb && npm run start:koyeb
```

## Design System

Домик использует стеклянную тему поверх Tailwind и shadcn/ui компонентов.

- **Токены** — базовые цвета объявлены в `styles/theme.css` (`--bg`, `--fg`, `--muted`, `--primary`, `--accent`, `--border`, `--ring`). Tailwind подтягивает их как `bg`, `fg`, `muted`, `primary`, `accent`, `border`, `ring`.
- **Стеклянные утилиты** — классы `.glass`, `.glass-strong`, `.glass-card` доступны из `@layer utilities`. Они добавляют прозрачный фон, размытие, бордер и ring. На мобильных устройствах размытие автоматически слабее.
- **Кнопки** — `.btn-solid`, `.btn-ghost`, `.btn-glass` покрывают основные состояния. Используйте `.btn-solid` для CTA, `.btn-glass` внутри стеклянных блоков, `.btn-ghost` для вторичных действий.
- **Карточки и диалоги** — компоненты из `components/ui` по умолчанию применяют стеклянные классы.
- **Fallback** — если `backdrop-filter` недоступен, фон становится менее прозрачным для сохранения читабельности.

Подробнее — см. [`docs/UX.md`](docs/UX.md).

## Supabase

- Все изменения схемы оформляются миграциями в `supabase/migrations`. Для применения их локально используйте [Supabase CLI](https://supabase.com/docs/guides/cli). После установки выполните:

  ```bash
  npm run db:push
  ```

- В CI настроен workflow `.github/workflows/supabase.yml`, который запускает `npx supabase db push` c секретами `SUPABASE_PROJECT_ID` и `SUPABASE_ACCESS_TOKEN`.

- Минимальный набор переменных окружения для Next.js храните в `.env.local`:

  ```env
  NEXT_PUBLIC_SUPABASE_URL=...
  NEXT_PUBLIC_SUPABASE_ANON_KEY=...
  SUPABASE_SERVICE_ROLE_KEY=... # только для серверных обработчиков
  ```

  `SUPABASE_SERVICE_ROLE_KEY` не должен попадать в браузерные бандлы или edge-функции.

## Проверка функциональности

1. Создайте двух пользователей в Supabase (хост и гость) и авторизуйтесь в разных браузерах.
2. Гость отправляет заявку через `POST /api/applications` или через UI `/applications` во вкладке «Как гость».
3. Хост открывает `/applications`, видит входящую заявку и может `Принять`/`Отклонить`.
   - При принятии создаётся комната, оба участника получают доступ к чату и происходит редирект в `/chat/<roomId>`.
   - При отклонении статус становится `Отклонена`.
4. Гость может отменить свою заявку до решения хоста.
5. В `/chat/<roomId>` сообщения загружаются через `/api/rooms/[roomId]/messages`, новые сообщения отправляются в realtime и появляются без перезагрузки.

## Тесты

```bash
npm test
```

В тестах `tests/applications.test.ts` покрыты сценарии загрузки заявок и принятия заявки с созданием комнаты.
