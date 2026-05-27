"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { profileSchema, type ProfileInput } from "@/lib/validations/profile";

export type ProfileActionResult =
  | { success: true }
  | { success: false; error: string };

export async function updateProfile(
  input: ProfileInput & { avatar_url?: string | null }
): Promise<ProfileActionResult> {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    const firstFieldError = Object.values(flat.fieldErrors).flat()[0];
    const firstFormError = flat.formErrors?.[0];
    const msg = firstFieldError ?? firstFormError ?? "Validation failed.";
    return { success: false, error: msg };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated." };
  }

  const d = parsed.data;
  const updates: Record<string, unknown> = {
    name: d.name ?? null,
    bio: d.bio ?? null,
    location: d.location ?? null,
    pronouns: d.pronouns ?? null,
    interests: d.interests ?? [],
    website: d.website ? d.website : null,
    birthday: d.birthday ? d.birthday : null,
    relationship_status: d.relationship_status ?? null,
    show_birthday: d.show_birthday ?? true,
    show_age: d.show_age ?? true,
    show_location: d.show_location ?? true,
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
  revalidatePath(`/u/${user.id}`);
  return { success: true };
}
