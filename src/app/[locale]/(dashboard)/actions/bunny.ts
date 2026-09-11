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

// When someone pastes a Bunny embed link directly (instead of uploading through
// the app), we have no client-side way to know if the source video is portrait
// or landscape. If the link points at our own library, ask Bunny for its real
// dimensions so the feed can size the embed correctly instead of always
// defaulting to a 16:9 box.
export async function getBunnyVideoOrientation(
  embedUrl: string
): Promise<"landscape" | "portrait" | null> {
  const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID;
  const apiKey = process.env.BUNNY_STREAM_API_KEY;
  if (!libraryId || !apiKey) return null;

  let url: URL;
  try {
    url = new URL(embedUrl);
  } catch {
    return null;
  }
  if (url.hostname !== "iframe.mediadelivery.net" && url.hostname !== "player.mediadelivery.net") {
    return null;
  }

  const match = url.pathname.match(/^\/embed\/([^/?#]+)\/([^/?#]+)/);
  if (!match) return null;
  const [, embeddedLibraryId, videoId] = match;
  if (embeddedLibraryId !== libraryId) return null;

  try {
    const res = await fetch(`${BUNNY_API_BASE}/library/${libraryId}/videos/${videoId}`, {
      headers: { AccessKey: apiKey },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { width?: number; height?: number; rotation?: number | null };
    if (!data.width || !data.height) return null;

    // width/height are the pre-rotation encoded resolution — a vertically
    // recorded phone video is often stored at its sensor's landscape resolution
    // with a 90/270 rotation flag saying "display this on its side". Swap the
    // comparison when that's the case, or every rotated portrait video reads
    // as landscape.
    const isSideways = Math.abs(data.rotation ?? 0) % 180 === 90;
    const displayWidth = isSideways ? data.height : data.width;
    const displayHeight = isSideways ? data.width : data.height;
    return displayHeight > displayWidth ? "portrait" : "landscape";
  } catch {
    return null;
  }
}
