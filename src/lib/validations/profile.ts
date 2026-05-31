import { z } from "zod";

const PRONOUNS = [
  "she/her",
  "he/him",
  "they/them",
  "any pronouns",
  "prefer not to say",
] as const;

const RELATIONSHIP_STATUS = [
  "single",
  "in a relationship",
  "it's complicated",
  "married",
  "prefer not to say",
] as const;

export const profileSchema = z.object({
  name: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  pronouns: z.enum([...PRONOUNS]).optional(),
  interests: z.array(z.string().max(30)).max(10).optional(),
  birthday: z.string().optional().refine((val) => {
    if (!val) return true;
    const date = new Date(val);
    if (Number.isNaN(date.getTime())) return false;
    const today = new Date();
    const oldestAllowed = new Date();
    oldestAllowed.setFullYear(today.getFullYear() - 120);
    const youngestAllowed = new Date();
    youngestAllowed.setFullYear(today.getFullYear() - 13);
    return date >= oldestAllowed && date <= youngestAllowed;
  }, "You must be between 13 and 120 years old"),
  relationship_status: z.enum([...RELATIONSHIP_STATUS]).optional(),
  show_birthday: z.boolean().optional(),
  show_age: z.boolean().optional(),
  show_location: z.boolean().optional(),
});

export type ProfileInput = z.infer<typeof profileSchema>;
