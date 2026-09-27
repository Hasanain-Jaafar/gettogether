import { Music, BookOpen, ImageIcon } from "lucide-react";

export const POST_CATEGORIES = ["songs", "diaries", "images"] as const;

export type PostCategory = (typeof POST_CATEGORIES)[number];

export const CATEGORY_COLORS: Record<PostCategory, string> = {
  songs: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  diaries: "bg-sky-500/10 text-sky-600 border-sky-500/20",
  images: "bg-violet-500/10 text-violet-600 border-violet-500/20",
};

// Solid, high-contrast variant for filter chips when selected.
export const CATEGORY_SOLID: Record<PostCategory, string> = {
  songs: "bg-rose-500 text-white shadow-md shadow-rose-500/25",
  diaries: "bg-sky-500 text-white shadow-md shadow-sky-500/25",
  images: "bg-violet-500 text-white shadow-md shadow-violet-500/25",
};

export const CATEGORY_ICONS: Record<PostCategory, typeof Music> = {
  songs: Music,
  diaries: BookOpen,
  images: ImageIcon,
};

export function isPostCategory(value: string | null | undefined): value is PostCategory {
  return !!value && (POST_CATEGORIES as readonly string[]).includes(value);
}
