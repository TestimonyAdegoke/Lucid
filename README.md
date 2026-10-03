# Lucid

Lucid is a private, personal dream journal for web and mobile.

The product is intentionally designed to feel like a journal first and software second: soft, tactile, customizable, intimate, and fast enough to use seconds after waking.

## Apps

- `apps/web` — Next.js web/PWA experience, API, account flows, voice transcription, analysis, and Dream Map
- `apps/mobile` — Expo / React Native mobile journal with offline-first dream sync and native voice recording
- `packages/domain` — shared dream types and domain vocabulary
- `packages/database` — Neon PostgreSQL / Prisma schema and client

## Current product capabilities

- anonymous-first private journal
- Neon-backed dream CRUD
- optional Neon Auth account claiming across devices
- web + native mobile journal experience
- offline-first mobile create/edit sync
- favorites, moods, vividness, lucid/nightmare flags, and tags
- voice capture on web and mobile
- server-side speech-to-text with temporary audio handling
- surface-level entity extraction for people, places, objects, symbols, and themes
- recurring-dream similarity scoring
- journal pattern summaries
- constellation-style Dream Map on web
- mobile Dream Map / recurring-connection view

Lucid's analysis layer deliberately separates **observation** from **interpretation**. It can say that water, a person, a location, or a theme recurs. It does not declare that a dream has one authoritative meaning.

## Database: Neon

Lucid uses **Neon Postgres** as its system of record.

Create or select a Neon project and copy both connection strings from **Neon Console → Connect**:

- `DATABASE_URL`: pooled connection (hostname contains `-pooler`) for application queries
- `DATABASE_URL_UNPOOLED`: direct connection for Prisma migrations/schema operations

Enable Neon Auth if cross-device accounts are required and copy:

- `NEON_AUTH_BASE_URL`
- `NEON_AUTH_COOKIE_SECRET`

Copy `apps/web/.env.example` to `apps/web/.env.local`, fill in the values, then run:

```bash
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm dev:web
```

## Voice + intelligence

Voice transcription and richer entity extraction use an optional OpenAI API key:

```env
OPENAI_API_KEY=
OPENAI_TRANSCRIPTION_MODEL=gpt-transcribe
OPENAI_ANALYSIS_MODEL=gpt-6-luna
```

If `OPENAI_API_KEY` is absent:

- typed dream capture continues to work
- Neon persistence continues to work
- Lucid still performs a deterministic surface-level fallback analysis
- Dream similarity still works from text, tags, moods, and extracted fallback entities
- voice recording cannot be transcribed server-side

Lucid does **not** persist the uploaded voice recording in its own database or storage. The recording is used for transcription and the resulting text is retained in the journal.

## Mobile

The mobile app syncs through the web API. Copy `apps/mobile/.env.example` to `apps/mobile/.env` and set:

```env
EXPO_PUBLIC_API_URL=https://your-lucid-web-domain.example
```

Typed mobile capture is offline-first. Dreams are written to device storage immediately, use a client-generated idempotency key, and sync to Neon when connectivity returns.

Voice transcription requires connectivity. If transcription fails while the capture page remains open, the native app keeps the recording URI available for retry.

## Identity model

A first-time browser or mobile installation receives a cryptographically random device session. The API hashes the token before storing it. On first use Lucid creates:

1. an anonymous user
2. a personal workspace
3. an owner membership
4. journal preferences
5. a device session

This lets someone wake up and capture a dream before registration.

When Neon Auth is enabled, creating an account from that device claims the existing journal instead of starting a second empty journal. Signing into another device attaches that device to the same account-backed journal. Signing out revokes the current Lucid device session.

## Dream intelligence pipeline

New and materially edited dreams are analyzed after the journal write completes:

```text
capture
  → save to Neon
  → extract surface entities
  → compare with prior dreams
  → store recurring-dream connections
  → expose graph/pattern data
```

The connection engine combines:

- recurring entities
- user tags
- repeated language
- matching moods

The score is descriptive similarity, not psychological or spiritual certainty.

## API

- `GET /api/health` — Neon connectivity
- `GET /api/dreams` — list the active journal
- `POST /api/dreams` — create a dream
- `GET /api/dreams/:id` — open a dream
- `PATCH /api/dreams/:id` — update a dream
- `DELETE /api/dreams/:id` — delete a dream
- `POST /api/dreams/:id/analyze` — manually refresh one dream's structural analysis
- `POST /api/transcribe` — transcribe a temporary voice recording
- `GET /api/graph` — Dream Map graph data
- `GET/PATCH /api/preferences` — journal personalization
- `/api/auth/*` — Neon Managed Better Auth proxy routes

## Validation

GitHub Actions currently checks:

- dependency installation
- Prisma client generation
- Prisma schema validation
- mobile TypeScript
- Next.js production build

## Product principles

1. Capture before complexity — a half-awake user should be able to record a dream immediately.
2. Journal, not dashboard — paper-like surfaces, personal covers, handwriting-inspired accents, memories over metrics.
3. Private by default — dreams belong to the user.
4. Customizable — themes, covers, typography, density, prompts, and reflection modes can fit different personalities.
5. AI assists memory and reflection; it does not declare a single authoritative meaning for a dream.
6. Web and mobile should feel like the same journal, not two separate products.
