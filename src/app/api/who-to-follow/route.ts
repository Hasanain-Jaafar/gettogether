import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWhoToFollow } from "@/app/(dashboard)/actions/follows";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ users: [] });
  }

  const users = await getWhoToFollow(user.id, 3);
  return NextResponse.json({ users });
}
