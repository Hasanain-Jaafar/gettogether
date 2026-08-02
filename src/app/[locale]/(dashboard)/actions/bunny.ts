"use server";

import { createHash } from "crypto";
import { createClient } from "@/lib/supabase/server";

const BUNNY_API_BASE = "https://video.bunnycdn.com";
const BUNNY_TUS_ENDPOINT = "https://video.bunnycdn.com/tusupload";
const UPLOAD_WINDOW_SECONDS = 60 * 60 * 12; // 12h to finish an upload (up to 8GB files on slow connections)

export type BunnyUploadTicket = {
  uploadEndpoint: string;
  videoId: string;
  libraryId: string;
  expiration: number;
  signature: string;
};

export async function createBunnyUploadTicket(
  title: string
): Promise<{ success: true; ticket: BunnyUploadTicket } | { success: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID;
  const apiKey = process.env.BUNNY_STREAM_API_KEY;
  if (!libraryId || !apiKey) {
    return { success: false, error: "Video upload is not configured." };
  }

  const createRes = await fetch(`${BUNNY_API_BASE}/library/${libraryId}/videos`, {
    method: "POST",
    headers: {
      AccessKey: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title: title.slice(0, 200) || "Untitled" }),
  });

  if (!createRes.ok) {
    return { success: false, error: `Video upload failed to start (${createRes.status}).` };
  }

  const created = (await createRes.json()) as { guid?: string };
  const videoId = created.guid;
  if (!videoId) {
    return { success: false, error: "Video upload failed to start." };
  }

  const expiration = Math.floor(Date.now() / 1000) + UPLOAD_WINDOW_SECONDS;
  const signature = createHash("sha256")
    .update(`${libraryId}${apiKey}${expiration}${videoId}`)
    .digest("hex");

  return {
    success: true,
    ticket: {
      uploadEndpoint: BUNNY_TUS_ENDPOINT,
      videoId,
      libraryId,
      expiration,
      signature,
    },
  };
}
