import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/auth";
import type { Attendee } from "@/lib/types";

// The logged-in attendee's RSVP row, or null if not logged in / no RSVP.
// Cached per request so layout + page share one auth + DB lookup.
export const getCurrentAttendee = cache(async function getCurrentAttendee(): Promise<Attendee | null> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    !process.env.SUPABASE_SECRET_KEY
  ) {
    return null;
  }

  try {
    // Reuse the one cached session lookup so a render doesn't fire several
    // concurrent getUser() calls that race to rotate the refresh token.
    const user = await getSessionUser();
    if (!user) return null;

    const db = createAdminClient();
    const { data } = await db
      .from("attendees")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    return (data as Attendee) ?? null;
  } catch {
    return null;
  }
});

// Require a logged-in attendee; send them to the home page otherwise.
export async function requireAttendee(): Promise<Attendee> {
  const attendee = await getCurrentAttendee();
  if (!attendee) redirect("/");
  return attendee;
}
