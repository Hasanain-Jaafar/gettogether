import { z } from "zod";
import { POST_CATEGORIES } from "@/lib/post-categories";

const basePostFields = {
  content: z
    .string()
    .max(2000, "Post must be 2000 characters or less")
    .trim(),
  image_url: z.string().url().optional().nullable(),
  video_url: z.string().url().optional().nullable(),
  media_type: z.enum(["text", "image", "video", "gif", "poll", "link"]).optional().nullable(),
  category: z.enum(POST_CATEGORIES, { message: "Select a category." }),
};

const hasContentOrMedia = (data: { content: string; image_url?: string | null; video_url?: string | null }) =>
  data.content.length > 0 || !!data.image_url || !!data.video_url;

export const createPostSchema = z
  .object(basePostFields)
  .refine(hasContentOrMedia, { message: "Post must contain text or media." });

export const updatePostSchema = z
  .object(basePostFields)
  .refine(hasContentOrMedia, { message: "Post must contain text or media." });

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
