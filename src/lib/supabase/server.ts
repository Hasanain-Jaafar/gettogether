import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from Server Component; ignore
          }
        },
      },
    }
  );
}

// The signed-in user, read from the session's JWT claims.
//
// getClaims() verifies the token's signature locally against the project's
// published signing keys instead of calling Supabase Auth on every page load,
// which saves a network round trip per request. (With legacy symmetric JWT
// secrets it falls back to a server call, so it's never slower than getUser().)
// Server actions that mutate data still call supabase.auth.getUser() directly.
//
// React's cache() dedupes calls within a single request/render, so a layout
// and page that both need the user only verify once.
export const getUser = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const user = claims
    ? {
        id: claims.sub,
        email: claims.email,
        user_metadata: claims.user_metadata as { name?: string; full_name?: string } | undefined,
      }
    : null;
  return { data: { user } };
});
