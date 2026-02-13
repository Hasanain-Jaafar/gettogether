import { z } from "zod";

export const createPostSchema = z.object({
  content: z
    .string()
    .min(1, "Post cannot be empty")
    .max(2000, "Post must be 2000 characters or less")
    .trim(),
  image_url: z.string().url().optional().nullable(),
  media_type: z.enum(["text", "image", "video", "gif", "poll", "link"]).optional().nullable(),
});

export const updatePostSchema = createPostSchema;

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
