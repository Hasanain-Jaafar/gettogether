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
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          Share more about yourself to help others connect with you.
        </p>
      </div>
      <ProfileForm
        userId={user.id}
        email={user.email}
        initialName={profile?.name ?? null}
        initialBio={profile?.bio ?? null}
        initialAvatarUrl={profile?.avatar_url ?? null}
        initialLocation={profile?.location ?? null}
        initialPronouns={profile?.pronouns ?? null}
        initialInterests={profile?.interests ?? null}
        initialWebsite={profile?.website ?? null}
        initialBirthday={profile?.birthday ?? null}
        initialRelationshipStatus={profile?.relationship_status ?? null}
        initialShowBirthday={profile?.show_birthday ?? null}
        initialShowAge={profile?.show_age ?? null}
        initialShowLocation={profile?.show_location ?? null}
      />
    </div>
  );
}
