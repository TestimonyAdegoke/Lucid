# Tardemah · תַּרְדֵּמָה

Tardemah is a private, personal dream journal for web and mobile. The name is the Hebrew word for a deep sleep — the heavy, vision-filled sleep of the old stories.

The product is intentionally designed to feel like a journal first and software second: soft, tactile, customizable, intimate, and fast enough to use seconds after waking.

## Apps

- `apps/web` — Next.js web/PWA experience, API, account flows, voice transcription, analysis, and Dream Map
- `apps/mobile` — Expo / React Native mobile journal with offline-first dream sync and native voice recording
- `packages/domain` — shared vocabulary: appearance catalog (palettes, lettering, covers, papers), journal style templates, entry templates, roles and plan entitlements
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
- landing page at `/`; the journal lives at `/journal`
- Design Studio (full screen, live preview): 10 built-in styles as starting points, then free design — any colour for paper, ink, accent and cover; separate heading and body fonts (10 faces incl. typewriter and Hebrew-ready Frank Ruhl); text size and line spacing; cover texture, emblem and book title; ribbon, drop capitals, paper grain, corner shape; spread or single-page layout; the surface the book rests on; ornament sets; prompt voice. Looks can be saved as styles and shared within a book
- the journal renders as a physical book: cover wrap, page-stack edges, gutter fold, ribbon bookmark, bookplate, running heads, folios
- entry templates: 7 built-in capture templates plus custom templates with text, paragraph, 1–10 scale, choice and yes/no prompts. Templates are starting points — on any page you can skip questions, add your own (even with no template), and save the result as a new template. Answered questions are snapshotted with each dream
- free-text moods and tag chips
- multi-tenant dream books: a personal book per user plus shared books with owner/admin/member/reader roles, invitation links and per-page visibility
- monthly usage metering (voice transcription) per plan
- Markdown / JSON export of every page a user has written

Tardemah's analysis layer deliberately separates **observation** from **interpretation**. It can say that water, a person, a location, or a theme recurs. It does not declare that a dream has one authoritative meaning.

## Database: Neon

Tardemah uses **Neon Postgres** as its system of record.

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
- Tardemah still performs a deterministic surface-level fallback analysis
- Dream similarity still works from text, tags, moods, and extracted fallback entities
- voice recording cannot be transcribed server-side

Tardemah does **not** persist the uploaded voice recording in its own database or storage. The recording is used for transcription and the resulting text is retained in the journal.

## Rename from Lucid

The product was renamed from Lucid to Tardemah. Packages are now `@tardemah/*`, cookies `tardemah_session` / `tardemah_workspace`, and headers `x-tardemah-session` / `x-tardemah-client` / `x-tardemah-workspace`. For continuity:

- the server still accepts the legacy `lucid_*` cookies (migrating them on first visit) and `x-lucid-*` headers, so existing browsers and installed mobile builds keep their journals;
- the mobile app keeps its original AsyncStorage keys so offline dreams on existing installs aren't lost;
- the mobile `bundleIdentifier` / Android `package` (`com.lucid.dreamjournal`) and Expo `slug` are unchanged on purpose — changing them creates a different app in the stores. Change them deliberately if the app hasn't shipped yet.

## Mobile

The mobile app syncs through the web API. Copy `apps/mobile/.env.example` to `apps/mobile/.env` and set:

```env
EXPO_PUBLIC_API_URL=https://your-tardemah-web-domain.example
```

Typed mobile capture is offline-first. Dreams are written to device storage immediately, use a client-generated idempotency key, and sync to Neon when connectivity returns.

Voice transcription requires connectivity. If transcription fails while the capture page remains open, the native app keeps the recording URI available for retry.

## Identity model

A first-time browser or mobile installation receives a cryptographically random device session. The API hashes the token before storing it. On first use Tardemah creates:

1. an anonymous user
2. a personal workspace
3. an owner membership
4. journal preferences
5. a device session

This lets someone wake up and capture a dream before registration.

When Neon Auth is enabled, creating an account from that device claims the existing journal instead of starting a second empty journal. Signing into another device attaches that device to the same account-backed journal. Signing out revokes the current Tardemah device session.

## Tenancy model

Every user owns one **personal** dream book (workspace) and can create or join **shared** books.

- The active book comes from the `x-tardemah-workspace` header (mobile) or the `tardemah_workspace` cookie (web), and is only honoured when the caller is a member; otherwise the personal book is used.
- Every query is scoped by `workspaceId` from `getRequestContext` (`apps/web/lib/session.ts`); writes check the member's role (`requireRole` in `apps/web/lib/api.ts`).
- Pages are `PRIVATE` to their author by default. In a shared book an author can mark a page `WORKSPACE` so members can read it. Only authors edit their pages; owners/admins may remove shared pages.
- Dream connections are computed per author, so analysis never links to someone else's private page.
- Invitations are single-use, expire after 14 days, may be locked to an email, and store only a token hash.
- Templates, saved styles, tags and usage counters belong to a workspace. Appearance preferences belong to a (user, workspace) pair.
- Plans (`FREE`, `PLUS`, `STUDIO`) live on the workspace; limits are in `packages/domain/src/tenancy.ts`. Billing is not wired yet — set `Workspace.plan` directly until it is.

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
- `GET /api/me` — bootstrap: user, active book, all books, preferences, templates, styles, plan & usage
- `GET /api/dreams?q=` — list pages visible in the active book (optional search)
- `POST /api/dreams` — create a dream (`templateId`, optional per-page `prompts`, `fields`, `visibility`, `tags`, `dreamedAt`, …)
- `GET /api/dreams/:id` — open a dream
- `PATCH /api/dreams/:id` — update a dream
- `DELETE /api/dreams/:id` — delete a dream
- `POST /api/dreams/:id/analyze` — manually refresh one dream's structural analysis
- `POST /api/transcribe` — transcribe a temporary voice recording
- `GET /api/graph` — Dream Map graph data
- `GET/PATCH /api/preferences` — appearance (any field of the open design model, or `styleKey` to apply a style), default entry template, display name
- `GET/POST /api/templates`, `PATCH/DELETE /api/templates/:id` — custom entry templates (delete archives)
- `GET/POST /api/styles`, `DELETE /api/styles/:id` — saved journal styles
- `GET/POST /api/workspaces`, `PATCH/DELETE /api/workspaces/:id` — dream books
- `POST /api/workspaces/active` — switch the active book (web)
- `GET /api/workspaces/:id/members`, `PATCH/DELETE /api/workspaces/:id/members/:memberId` — roles, removal, leaving
- `GET/POST /api/workspaces/:id/invitations`, `DELETE …/invitations/:inviteId` — invitation links
- `GET/POST /api/invitations/:token` — preview / accept an invitation
- `GET /api/export?format=markdown|json` — export every page the caller wrote
- `/api/auth/*` — Neon Managed Better Auth proxy routes

## Validation

GitHub Actions currently checks:

- dependency installation
- Prisma client generation
- Prisma schema validation
- mobile TypeScript
- web TypeScript
- Next.js production build

## Product principles

1. Capture before complexity — a half-awake user should be able to record a dream immediately.
2. Journal, not dashboard — paper-like surfaces, personal covers, handwriting-inspired accents, memories over metrics.
3. Private by default — dreams belong to the user.
4. Customizable — themes, covers, typography, density, prompts, and reflection modes can fit different personalities.
5. AI assists memory and reflection; it does not declare a single authoritative meaning for a dream.
6. Web and mobile should feel like the same journal, not two separate products.
