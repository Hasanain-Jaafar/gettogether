import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile/profile-form";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, bio, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          Manage your profile and preferences.
        </p>
      </div>
      <ProfileForm
        userId={user.id}
        email={user.email}
        initialName={profile?.name ?? null}
        initialBio={profile?.bio ?? null}
        initialAvatarUrl={profile?.avatar_url ?? null}
      />
    </div>
  );
}
