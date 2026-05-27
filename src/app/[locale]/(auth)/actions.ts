"use server";

import { createClient } from "@/lib/supabase/server";

export async function resolveLoginIdentifier(
  identifier: string
): Promise<{ email: string | null }> {
  const trimmed = identifier.trim();
  if (!trimmed) return { email: null };

  // Already an email
  if (trimmed.includes("@")) {
    return { email: trimmed };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_email_by_username", {
    p_username: trimmed,
  });

  if (error || typeof data !== "string") {
    return { email: null };
  }
  return { email: data };
}
