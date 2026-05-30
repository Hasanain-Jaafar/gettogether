# GetTogether

A full-stack social community app built with Next.js (App Router), Supabase (Auth + Postgres + Storage), and ShadCN UI.

## Stack

- **Next.js 16** (App Router, TypeScript, React 19)
- **Tailwind CSS v4** + **ShadCN UI** (Radix primitives)
- **Supabase** (Authentication, PostgreSQL with RLS, Storage, Realtime)
- **next-intl** (i18n: English + Arabic with RTL)
- **Zustand** (state), **React Hook Form** + **Zod** (forms/validation)
- **Framer Motion** (animations), **Sonner** (toasts)

## Features

- Email/password sign up and sign in, protected routes, persistent sessions (Supabase SSR)
- Profiles with name, bio, avatar, username, level — auto-created on sign up
- **Feed**: posts with images / video URLs / polls / link previews, likes, reactions, threaded comments with replies and likes, reposts, bookmarks, hashtags with trending
- **Follows**: follow users, "Following" feed tab, who-to-follow suggestions
- **Public profiles** at `/u/[userId]` (or `/u/[username]`)
- **Direct messages** between users (follow-gated)
- **Notifications** with realtime updates
- **Events** (`/calendar`): publish events visible to followers, the public, or just you — RLS enforces visibility against the follows graph
- **Leaderboard, XP, levels, badges** (gamification)
- **Explore** page with trending hashtags and suggested people
- **i18n** with English/Arabic + RTL layout, dark mode, mobile-first responsive UI

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Create `.env.local` with:

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key

### 3. Supabase setup

1. Run [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL Editor.
2. Apply every migration in [`supabase/migrations/`](supabase/migrations/) in order (`002_community.sql` → `026_calendar_events.sql`). Either paste them into the SQL editor one by one or use the Supabase CLI (`supabase db push`).
3. Create the `avatars` and `post-images` storage buckets and apply the policies in [`supabase/STORAGE.md`](supabase/STORAGE.md) and [`supabase/storage-post-images.sql`](supabase/storage-post-images.sql).
4. In **Authentication → URL Configuration**, add redirect URL `http://localhost:3000/api/auth/callback`.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app auto-detects locale; visit `/ar` for the Arabic / RTL build.

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for step-by-step Netlify deployment and Supabase configuration.

## Project structure

```
src/
  app/
    [locale]/
      (auth)/        # sign in / sign up
      (marketing)/   # landing pages
      (dashboard)/   # authenticated app: feed, calendar, messages, etc.
  components/        # UI primitives + feature components
  i18n/              # next-intl routing + request config
  lib/               # supabase clients, validations, utils
  hooks/             # custom hooks
messages/            # en.json / ar.json translation strings
supabase/migrations/ # ordered SQL migrations
```

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run start` — start production server
- `npm run lint` — run ESLint
