# Lucid

Lucid is a private, personal dream journal for web and mobile.

The product is intentionally designed to feel like a journal first and software second: soft, tactile, customizable, intimate, and fast enough to use seconds after waking.

## Apps

- `apps/web` — Next.js web/PWA experience and API
- `apps/mobile` — Expo / React Native mobile app
- `packages/domain` — shared dream types and domain vocabulary
- `packages/database` — Neon PostgreSQL / Prisma schema and client

## Database: Neon

Lucid uses **Neon Postgres** as its system of record.

Create or select a Neon project and copy both connection strings from **Neon Console → Connect**:

- `DATABASE_URL`: pooled connection (hostname contains `-pooler`) for application queries
- `DATABASE_URL_UNPOOLED`: direct connection for Prisma migrations/schema operations

Copy `apps/web/.env.example` to `apps/web/.env.local`, fill in both values, then run:

```bash
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm dev:web
```

The mobile app syncs through the web API. Copy `apps/mobile/.env.example` to `apps/mobile/.env` and set `EXPO_PUBLIC_API_URL` to the deployed web URL.

## Persistence model

A first-time browser or mobile installation receives a cryptographically random device session. The API hashes the token before storing it. On first use Lucid creates:

1. an anonymous user
2. a personal workspace
3. an owner membership
4. journal preferences
5. a device session

This makes Lucid usable before account creation while keeping the data model ready for Neon Auth. A future authenticated account can claim the existing user/workspace instead of creating a second journal.

Mobile capture is offline-first. Dreams are written to device storage immediately, use a client-generated idempotency key, and sync to Neon when connectivity returns.

## API

- `GET /api/health` — Neon connectivity
- `GET /api/dreams` — list the active journal
- `POST /api/dreams` — create a dream
- `GET /api/dreams/:id` — open a dream
- `PATCH /api/dreams/:id` — update a dream
- `DELETE /api/dreams/:id` — delete a dream
- `GET/PATCH /api/preferences` — journal personalization

## Product principles

1. Capture before complexity — a half-awake user should be able to record a dream immediately.
2. Journal, not dashboard — paper-like surfaces, personal covers, handwriting-inspired accents, memories over metrics.
3. Private by default — dreams belong to the user.
4. Customizable — themes, covers, typography, density, prompts, and reflection modes can fit different personalities.
5. AI assists reflection; it does not declare a single authoritative meaning for a dream.
6. Web and mobile should feel like the same journal, not two separate products.
