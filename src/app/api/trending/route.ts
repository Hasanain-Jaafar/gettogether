import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTrendingTopics } from "@/app/(dashboard)/actions/hashtags";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ topics: [] });
  }

  const topics = await getTrendingTopics(5);
  return NextResponse.json({ topics });
}
