# Lucid

Lucid is a private, personal dream journal for web and mobile.

The product is intentionally designed to feel like a journal first and software second: soft, tactile, customizable, intimate, and fast enough to use seconds after waking.

## Apps

- `apps/web` — Next.js web/PWA experience
- `apps/mobile` — Expo / React Native mobile app
- `packages/domain` — shared dream types and domain vocabulary
- `packages/database` — PostgreSQL / Prisma schema

## Product principles

1. Capture before complexity — a half-awake user should be able to record a dream immediately.
2. Journal, not dashboard — paper-like surfaces, personal covers, handwriting-inspired accents, memories over metrics.
3. Private by default — dreams belong to the user.
4. Customizable — themes, covers, typography, density, prompts, and reflection modes can fit different personalities.
5. AI assists reflection; it does not declare a single authoritative meaning for a dream.
6. Web and mobile should feel like the same journal, not two separate products.

## First milestone

The first milestone establishes the visual language and working capture loop across web and mobile, plus the initial multi-tenant-ready data model.
