# Deployment Guide (Netlify)

## Prerequisites

- A [Supabase](https://supabase.com) project
- A [Netlify](https://netlify.com) account
- Git repository (e.g. GitHub) with this code

---

## 1. Supabase Setup

1. Create a new project at [Supabase Dashboard](https://supabase.com/dashboard).
2. In **Project Settings → API**, copy:
   - **Project URL** → use as `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → use as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. In **SQL Editor**, run the contents of [`supabase/schema.sql`](supabase/schema.sql) to create the `profiles` table, RLS policies, and the sign-up trigger.
4. In **Storage**, create the `avatars` bucket and policies as described in [`supabase/STORAGE.md`](supabase/STORAGE.md).
5. In **Authentication → URL Configuration**, set:
   - **Site URL**: your production URL (e.g. `https://your-site.netlify.app`)
   - **Redirect URLs**: add:
     - `https://your-site.netlify.app/api/auth/callback`
     - `http://localhost:3000/api/auth/callback` (for local dev)

---

## 2. Deploy to Netlify

1. Push your code to GitHub (or GitLab/Bitbucket).
2. In [Netlify](https://app.netlify.com): **Add new site → Import an existing project**.
3. Connect your Git provider and select this repository.
4. Netlify will detect Next.js; the build settings are read from `netlify.toml`:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next` (handled by `@netlify/plugin-nextjs`)
5. In **Site settings → Environment variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key
6. Trigger a deploy (e.g. **Deploy site** or push a new commit).

---

## 3. After First Deploy

1. Note your site URL (e.g. `https://random-name-123.netlify.app`).
2. In Supabase **Authentication → URL Configuration**, add to **Redirect URLs**:
   - `https://random-name-123.netlify.app/api/auth/callback`
3. Set **Site URL** to your Netlify URL if you haven’t already.
4. Redeploy on Netlify if you changed env vars so they are applied.

---

## 4. Local Development

1. Copy `.env.example` to `.env.local`.
2. Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Run `npm run dev` and open [http://localhost:3000](http://localhost:3000).
4. Use `http://localhost:3000/api/auth/callback` in Supabase redirect URLs for local auth.

---

## Node Version

Use Node 18 or 20. You can set `NODE_VERSION=20` in Netlify environment variables or add a `.nvmrc` file with `20` in the project root.
