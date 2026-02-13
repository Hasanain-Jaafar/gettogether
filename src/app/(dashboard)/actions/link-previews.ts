"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type LinkPreview = {
  id: string;
  url: string;
  title: string | null;
  description: string | null;
  image_url: string | null;
  favicon_url: string | null;
  site_name: string | null;
  created_at: string;
  updated_at: string;
};

export type FetchPreviewResult =
  | { success: true; preview: LinkPreview }
  | { success: false; error: string };

// Cache duration in seconds (24 hours)
const CACHE_DURATION = 86400;

export async function fetchLinkPreview(url: string): Promise<FetchPreviewResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  // Validate URL
  try {
    new URL(url);
  } catch {
    return { success: false, error: "Invalid URL." };
  }

  // Check if we have a cached preview that's still valid
  const { data: existing, error: existingError } = await supabase
    .from("link_previews")
    .select("*")
    .eq("url", url)
    .single();

  if (existing && !existingError) {
    const cacheAge = Math.floor(
      (new Date().getTime() - new Date(existing.updated_at).getTime()) / 1000
    );

    if (cacheAge < CACHE_DURATION) {
      return { success: true, preview: existing };
    }
  }

  // Fetch preview data
  let previewData: Partial<LinkPreview> = { url };

  try {
    // In a real implementation, you'd use a library like 'link-preview-js' or make HTTP requests
    // For now, we'll just create a stub preview with the URL
    previewData = {
      url,
      title: extractDomain(url),
      description: null,
      image_url: null,
      favicon_url: null,
      site_name: extractDomain(url),
    };

    // Insert or update the preview
    const { data, error } = await supabase
      .from("link_previews")
      .upsert({
        url,
        title: previewData.title,
        description: previewData.description,
        image_url: previewData.image_url,
        favicon_url: previewData.favicon_url,
        site_name: previewData.site_name,
      })
      .select("*")
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath("/dashboard");

    return { success: true, preview: data };
  } catch (error) {
    console.error("Error fetching link preview:", error);
    // Create a minimal preview with just the URL
    const { data, error: insertError } = await supabase
      .from("link_previews")
      .upsert({
        url,
        title: extractDomain(url),
      })
      .select("*")
      .single();

    if (insertError) return { success: false, error: insertError.message };

    return { success: true, preview: data };
  }
}

function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace("www.", "");
  } catch {
    return url;
  }
}

export async function getLinkPreview(url: string): Promise<LinkPreview | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("link_previews")
    .select("*")
    .eq("url", url)
    .single();

  if (error || !data) return null;

  return data;
}

export async function extractLinksFromPost(content: string): Promise<string[]> {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls: string[] = [];
  let match;
  while ((match = urlRegex.exec(content)) !== null) {
    try {
      new URL(match[1]); // Validate URL
      urls.push(match[1]);
    } catch {
      // Invalid URL, skip
    }
  }
  return [...new Set(urls)]; // Remove duplicates
}

export async function updatePostsWithLinkPreviews(
  postId: string,
  content: string
): Promise<{ success: boolean; previews?: LinkPreview[]; error?: string }> {
  const urls = await extractLinksFromPost(content);

  if (urls.length === 0) {
    return { success: true, previews: [] };
  }

  const previews: LinkPreview[] = [];

  for (const url of urls) {
    const result = await fetchLinkPreview(url);
    if (result.success) {
      previews.push(result.preview);
    }
  }

  return { success: true, previews };
}
