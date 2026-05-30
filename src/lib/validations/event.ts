import { z } from "zod";

export const eventVisibility = z.enum(["public", "followers", "private"]);

export const createEventSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(120, "Title must be 120 characters or less"),
    description: z.string().trim().max(2000).optional().nullable(),
    location: z.string().trim().max(300).optional().nullable(),
    starts_at: z.string().min(1, "Start time is required"),
    ends_at: z.string().optional().nullable(),
    visibility: eventVisibility.default("followers"),
  })
  .refine(
    (d) => !d.ends_at || new Date(d.ends_at) >= new Date(d.starts_at),
    { message: "End time must be after start time.", path: ["ends_at"] },
  );

export const updateEventSchema = createEventSchema;

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type EventVisibility = z.infer<typeof eventVisibility>;
