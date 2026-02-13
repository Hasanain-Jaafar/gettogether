import { createClient } from "@/lib/supabase/server";
import { createTestNotification } from "./actions/test-notifications";
import { redirect } from "next/navigation";

export default async function TestNotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <div>Please log in first</div>;
  }

  // Create 3 test notifications
  await createTestNotification(user.id);
  await createTestNotification(user.id);
  await createTestNotification(user.id);

  redirect("/notifications");
}
