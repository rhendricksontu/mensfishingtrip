"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAttendee } from "@/lib/attendee";
import { getAdminUser } from "@/lib/auth";

type Role = "breakfast_cook" | "coffee_maker" | "guide_lunch";
type DB = ReturnType<typeof createAdminClient>;

// True if `attendeeId` is the assigned leader for this role + day.
async function isLeaderOf(
  db: DB,
  attendeeId: string | undefined,
  role: Role,
  trip_day: string
): Promise<boolean> {
  if (!attendeeId) return false;
  const { data } = await db
    .from("signup_leaders")
    .select("attendee_id")
    .eq("role", role)
    .eq("trip_day", trip_day)
    .maybeSingle();
  return data?.attendee_id === attendeeId;
}

// The instance's leader (or an organizer) can add a helper (any member).
export async function assignHelper(
  role: Role,
  trip_day: string,
  attendeeId: string
): Promise<{ ok: boolean; error?: string }> {
  const [me, admin] = await Promise.all([getCurrentAttendee(), getAdminUser()]);
  const db = createAdminClient();
  if (!admin && !(await isLeaderOf(db, me?.id, role, trip_day))) {
    return { ok: false, error: "Only the leader or an organizer can assign volunteers." };
  }

  const { data: member } = await db
    .from("attendees")
    .select("id, name")
    .eq("id", attendeeId)
    .maybeSingle();
  if (!member) return { ok: false, error: "Member not found." };

  // Don't add the same person to an instance twice.
  const { data: existing } = await db
    .from("signups")
    .select("id")
    .eq("role", role)
    .eq("trip_day", trip_day)
    .eq("attendee_id", attendeeId)
    .limit(1);
  if (existing && existing.length) return { ok: true };

  const { error } = await db.from("signups").insert({
    role,
    trip_day,
    name: member.name,
    attendee_id: attendeeId,
  });
  if (error) return { ok: false, error: "Could not add the volunteer." };

  revalidatePath("/signups");
  return { ok: true };
}

// The instance's leader (or an organizer) can remove a helper.
export async function removeSignup(id: string): Promise<{ ok: boolean; error?: string }> {
  const db = createAdminClient();
  const { data: row } = await db
    .from("signups")
    .select("role, trip_day")
    .eq("id", id)
    .maybeSingle();
  if (!row) {
    revalidatePath("/signups");
    return { ok: true }; // already gone
  }

  const [me, admin] = await Promise.all([getCurrentAttendee(), getAdminUser()]);
  if (!admin && !(await isLeaderOf(db, me?.id, row.role as Role, row.trip_day))) {
    return { ok: false, error: "Only the leader or an organizer can remove volunteers." };
  }

  await db.from("signups").delete().eq("id", id);
  revalidatePath("/signups");
  return { ok: true };
}

// Admin: set (or clear) the leader for a signup instance (role + day).
export async function setSignupLeader(
  role: Role,
  trip_day: string,
  attendee_id: string | null
): Promise<{ ok: boolean; error?: string }> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "Organizers only." };

  const db = createAdminClient();
  if (attendee_id) {
    const { error } = await db
      .from("signup_leaders")
      .upsert({ role, trip_day, attendee_id }, { onConflict: "role,trip_day" });
    if (error) return { ok: false, error: "Could not set the leader." };
  } else {
    await db.from("signup_leaders").delete().eq("role", role).eq("trip_day", trip_day);
  }
  revalidatePath("/signups");
  return { ok: true };
}
