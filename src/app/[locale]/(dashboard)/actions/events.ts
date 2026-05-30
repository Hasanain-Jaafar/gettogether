"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  createEventSchema,
  updateEventSchema,
  type CreateEventInput,
  type UpdateEventInput,
  type EventVisibility,
} from "@/lib/validations/event";

export type CalendarEvent = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
  visibility: EventVisibility;
  author: { id: string; name: string | null; avatar_url: string | null } | null;
};

export type EventActionResult =
  | { success: true; event: CalendarEvent }
  | { success: false; error: string };

export type SimpleResult =
  | { success: true }
  | { success: false; error: string };

export async function createEvent(input: CreateEventInput): Promise<EventActionResult> {
  const parsed = createEventSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const { data, error } = await supabase
    .from("calendar_events")
    .insert({
      user_id: user.id,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      location: parsed.data.location ?? null,
      starts_at: new Date(parsed.data.starts_at).toISOString(),
      ends_at: parsed.data.ends_at ? new Date(parsed.data.ends_at).toISOString() : null,
      visibility: parsed.data.visibility,
    })
    .select("id, user_id, title, description, location, starts_at, ends_at, visibility")
    .single();

  if (error || !data) return { success: false, error: error?.message ?? "Failed to create event" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  revalidatePath("/calendar");
  return {
    success: true,
    event: { ...(data as Omit<CalendarEvent, "author">), author: profile ?? null },
  };
}

export async function updateEvent(id: string, input: UpdateEventInput): Promise<EventActionResult> {
  const parsed = updateEventSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const { data, error } = await supabase
    .from("calendar_events")
    .update({
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      location: parsed.data.location ?? null,
      starts_at: new Date(parsed.data.starts_at).toISOString(),
      ends_at: parsed.data.ends_at ? new Date(parsed.data.ends_at).toISOString() : null,
      visibility: parsed.data.visibility,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id, user_id, title, description, location, starts_at, ends_at, visibility")
    .single();

  if (error || !data) return { success: false, error: error?.message ?? "Failed to update event" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  revalidatePath("/calendar");
  return {
    success: true,
    event: { ...(data as Omit<CalendarEvent, "author">), author: profile ?? null },
  };
}

export async function deleteEvent(id: string): Promise<SimpleResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const { error } = await supabase
    .from("calendar_events")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/calendar");
  return { success: true };
}

/**
 * Fetch events that intersect the given window. RLS restricts results to the
 * caller's own events plus public/followers events from people they follow.
 */
export async function getEventsInRange(rangeStart: Date, rangeEnd: Date): Promise<CalendarEvent[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: events, error } = await supabase
    .from("calendar_events")
    .select("id, user_id, title, description, location, starts_at, ends_at, visibility")
    .gte("starts_at", rangeStart.toISOString())
    .lt("starts_at", rangeEnd.toISOString())
    .order("starts_at", { ascending: true });

  if (error || !events?.length) return [];

  const authorIds = [...new Set(events.map((e) => e.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, avatar_url")
    .in("id", authorIds);

  const profileMap = new Map(profiles?.map((p) => [p.id, p]) ?? []);
  return events.map((e) => ({
    ...(e as Omit<CalendarEvent, "author">),
    author: profileMap.get(e.user_id) ?? null,
  }));
}
