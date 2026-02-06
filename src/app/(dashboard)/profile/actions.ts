"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { profileSchema, type ProfileInput } from "@/lib/validations/profile";

export type ProfileActionResult = { success: true } | { success: false; error: string };

export async function updateProfile(
  input: ProfileInput & { avatar_url?: string | null }
): Promise<ProfileActionResult> {
  const parsed = profileSchema.safeParse({
    name: input.name,
    bio: input.bio,
  });
  if (!parsed.success) {
    const msg = parsed.error.flatten().formErrors?.[0] ?? parsed.error.message;
    return { success: false, error: typeof msg === "string" ? msg : "Validation failed." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated." };
  }

  const updates: { name?: string; bio?: string; avatar_url?: string | null } = {
    ...(parsed.data.name !== undefined && { name: parsed.data.name }),
    ...(parsed.data.bio !== undefined && { bio: parsed.data.bio }),
  };
  if (input.avatar_url !== undefined) {
    updates.avatar_url = input.avatar_url;
  }

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { success: true };
}
