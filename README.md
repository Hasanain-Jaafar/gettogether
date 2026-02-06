# GetTogether

A production-ready full-stack SaaS app with Next.js (App Router), Supabase (Auth + Postgres + Storage), ShadCN UI, and Netlify deployment.

## Stack

- **Next.js** (App Router, TypeScript)
- **Tailwind CSS** + **ShadCN UI**
- **Supabase** (Authentication, PostgreSQL, Storage)
- **Framer Motion** (animations)
- **Zod** (validation)
- **Sonner** (toasts)

## Features

- Email/password sign up and sign in
- Protected routes (middleware)
- Persistent sessions (Supabase SSR)
- Profiles (name, bio, avatar) with auto-creation on sign up
- Avatar upload to Supabase Storage
- **Community feed**: chronological posts, optional image, likes, flat comments
- **Public profiles**: view any user at `/u/[userId]`
- Rate-limited post creation; RLS on posts, likes, comments
- Dark mode; pink + white + soft gray visual identity
- Mobile-first responsive layout

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and set:

- `NEXT_PUBLIC_SUPABASE_URL` – Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` – Supabase anon key

### 3. Supabase setup

- Run the SQL in [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL Editor.
- Run the SQL in [`supabase/migrations/002_community.sql`](supabase/migrations/002_community.sql) (posts, likes, comments, profile read policy).
- Create the `avatars` and `post-images` storage buckets and policies as in [`supabase/STORAGE.md`](supabase/STORAGE.md) and [`supabase/storage-post-images.sql`](supabase/storage-post-images.sql).
- In Authentication → URL Configuration, add redirect URL: `http://localhost:3000/api/auth/callback`.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for step-by-step Netlify deployment and Supabase configuration.

## Project structure

```
src/
  app/           # App Router routes and layouts
  components/    # UI and feature components
  lib/           # Supabase clients, validations, utils
  hooks/         # (optional) custom hooks
```

## Scripts

- `npm run dev` – development server
- `npm run build` – production build
- `npm run start` – start production server
- `npm run lint` – run ESLint
