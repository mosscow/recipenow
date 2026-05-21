# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # prisma generate && next build
npm run lint         # ESLint
npm run seed         # Import recipes from examples/ into the DB
```

No test suite exists yet.

## Environment

Copy `.env` and set:
- `DATABASE_URL` — Neon PostgreSQL connection string (`postgresql://...?sslmode=require`)
- `ADMIN_PASSWORD` — password for the admin cookie session
- `ANTHROPIC_API_KEY` — required only for `npm run seed` (JPG image extraction)

## Architecture

**Stack:** Next.js 16 App Router · Prisma v7 · PostgreSQL (Neon) · Tailwind CSS v4

### Prisma v7 — critical differences from v5/v6

- `url` is **not** in `prisma/schema.prisma` — the datasource URL lives in `prisma.config.ts`
- The client **must** be constructed with an explicit adapter — bare `new PrismaClient()` errors
- Client is generated to `src/generated/prisma/` (not `node_modules`); import from `@/generated/prisma/client`
- `prisma generate` must run before `next build` — the generated client is not committed

```ts
// src/lib/prisma.ts — singleton pattern
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
return new PrismaClient({ adapter } as never);
```

After any schema change: `npx prisma migrate dev --name <description>`

### Auth

Two separate auth systems coexist:
1. **Admin auth** (`src/lib/auth.ts`) — cookie `admin_session=1`, checked against `ADMIN_PASSWORD` env var. Controls recipe deletion only.
2. **User auth** — not yet implemented; planned with Auth.js v5.

### Data model

`Recipe` ↔ `RecipeTag` ↔ `Tag` (many-to-many join table). Ingredients and instructions are stored as newline-delimited strings, split on `\n` for display.

### Server Actions

All mutations go through `src/app/actions.ts` (Next.js Server Actions). The pattern for tags is upsert-then-connect: delete existing `RecipeTag` rows, then re-create from the comma-separated tag input.

### API Routes

- `POST /api/upload` — accepts `.docx` files, parses with `mammoth`, extracts Ingredients/Instructions sections by heading
- `GET /api/recipes/[id]/export?format=pdf|docx` — generates PDF (`pdf-lib`) or Word (`docx` package) on the fly

### Seed script

`prisma/seed.ts` recursively scans `examples/`. Subfolder name becomes a tag. `.docx` files parsed with `mammoth`; `.jpg`/`.png` files sent to Claude vision API (`claude-opus-4-7`) for recipe extraction. Requires `DATABASE_URL` and `ANTHROPIC_API_KEY` in env.

### Styling

Tailwind CSS v4 — no `tailwind.config.js`; config is in `postcss.config.mjs`. Colour palette is amber-based throughout.
