import { z } from "zod";

export const createPostSchema = z
  .object({
    content: z
      .string()
      .max(2000, "Post must be 2000 characters or less")
      .trim(),
    image_url: z.string().url().optional().nullable(),
    media_type: z.enum(["text", "image", "video", "gif", "poll", "link"]).optional().nullable(),
  })
  .refine((data) => data.content.length > 0 || !!data.image_url, {
    message: "Post must contain text or media.",
  });

export const updatePostSchema = createPostSchema;

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
