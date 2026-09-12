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

// getUser() revalidates the session with a network round-trip to Supabase
// Auth on every call. React's cache() dedupes calls made with the same
// arguments within a single request/render, so a layout and page that both
// need the user only pay for one round-trip instead of one each.
export const getUser = cache(async () => {
  const supabase = await createClient();
  return supabase.auth.getUser();
});
