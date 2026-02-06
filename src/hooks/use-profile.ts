"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type Profile = {
  id: string;
  name: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
};

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(!!userId);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const supabase = createClient();
    supabase
      .from("profiles")
      .select("id, name, bio, avatar_url, created_at")
      .eq("id", userId)
      .single()
      .then(({ data, error }) => {
        if (!error) setProfile(data as Profile);
        setLoading(false);
      });
  }, [userId]);

  return { profile, loading };
}
