import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
});

export type ProfileInput = z.infer<typeof profileSchema>;
