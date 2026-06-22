"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/require-admin";
import type { FishingSession, RideDirection } from "@/lib/types";

// ---- Attendee assignment / payment updates --------------------------------

interface AttendeePatch {
  cabin_id?: string | null;
  is_cabin_host?: boolean;
  fishing_group_id?: string | null;
  assigned_session?: FishingSession | null;
  paid?: boolean;
  payment_note?: string | null;
}

export async function updateAttendee(id: string, patch: AttendeePatch) {
  await requireAdmin();
  const db = createAdminClient();

  const update: Record<string, unknown> = { ...patch };
  // Stamp paid_at when payment status flips.
  if (patch.paid === true) update.paid_at = new Date().toISOString();
  if (patch.paid === false) update.paid_at = null;

  const { error } = await db.from("attendees").update(update).eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin");
  revalidatePath("/admin/roster");
  revalidatePath("/admin/cabins");
  revalidatePath("/admin/fishing");
  return { ok: true };
}

export async function deleteAttendee(id: string) {
  await requireAdmin();
  const db = createAdminClient();
  // Remove their login account too, if any.
  const { data } = await db.from("attendees").select("user_id").eq("id", id).maybeSingle();
  if (data?.user_id) {
    await db.auth.admin.deleteUser(data.user_id).catch(() => {});
  }
  await db.from("attendees").delete().eq("id", id);
  revalidatePath("/admin/roster");
}

// Promote/demote a member to/from organizer (admin).
export async function setAttendeeRole(attendeeId: string, role: "member" | "admin") {
  await requireAdmin();
  const db = createAdminClient();
  const { error } = await db
    .from("attendees")
    .update({ role })
    .eq("id", attendeeId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/roster");
  return { ok: true };
}

// Organizer resets an attendee's login password.
export async function setAttendeePassword(attendeeId: string, password: string) {
  await requireAdmin();
  if (!password || password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }
  const db = createAdminClient();
  const { data } = await db
    .from("attendees")
    .select("user_id")
    .eq("id", attendeeId)
    .maybeSingle();
  if (!data?.user_id) {
    return { ok: false, error: "This person doesn't have a login account." };
  }
  const { error } = await db.auth.admin.updateUserById(data.user_id, { password });
  if (error) return { ok: false, error: "Could not reset the password." };
  return { ok: true };
}

// ---- Cabins ----------------------------------------------------------------

interface CabinAddress {
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
}

export async function createCabin(
  name: string,
  capacity: number,
  address?: CabinAddress
) {
  await requireAdmin();
  const db = createAdminClient();
  await db.from("cabins").insert({ name, capacity, ...(address ?? {}) });
  revalidatePath("/admin/cabins");
}

export async function updateCabin(
  id: string,
  patch: { name?: string; capacity?: number } & CabinAddress
) {
  await requireAdmin();
  const db = createAdminClient();
  await db.from("cabins").update(patch).eq("id", id);
  revalidatePath("/admin/cabins");
}

// A cabin has at most one host. Marking a new host clears any existing one.
export async function setCabinHost(attendeeId: string, makeHost: boolean) {
  await requireAdmin();
  const db = createAdminClient();

  if (makeHost) {
    const { data } = await db
      .from("attendees")
      .select("cabin_id")
      .eq("id", attendeeId)
      .maybeSingle();
    if (data?.cabin_id) {
      await db.from("attendees").update({ is_cabin_host: false }).eq("cabin_id", data.cabin_id);
    }
    await db.from("attendees").update({ is_cabin_host: true }).eq("id", attendeeId);
  } else {
    await db.from("attendees").update({ is_cabin_host: false }).eq("id", attendeeId);
  }

  revalidatePath("/admin/cabins");
}

export async function deleteCabin(id: string) {
  await requireAdmin();
  const db = createAdminClient();
  // attendees.cabin_id is ON DELETE SET NULL, so occupants are auto-unassigned.
  await db.from("cabins").delete().eq("id", id);
  revalidatePath("/admin/cabins");
}

// ---- Fishing groups --------------------------------------------------------

export async function createFishingGroup(
  name: string,
  session: FishingSession,
  guide_name: string,
  capacity: number,
  guide_phone?: string
) {
  await requireAdmin();
  const db = createAdminClient();
  await db
    .from("fishing_groups")
    .insert({ name, session, guide_name, capacity, guide_phone: guide_phone || null });
  revalidatePath("/admin/fishing");
}

export async function updateFishingGroup(
  id: string,
  patch: { guide_name?: string; guide_phone?: string | null; capacity?: number; name?: string }
) {
  await requireAdmin();
  const db = createAdminClient();
  await db.from("fishing_groups").update(patch).eq("id", id);
  revalidatePath("/admin/fishing");
}

export async function deleteFishingGroup(id: string) {
  await requireAdmin();
  const db = createAdminClient();
  // attendees.fishing_group_id is ON DELETE SET NULL.
  await db.from("fishing_groups").delete().eq("id", id);
  revalidatePath("/admin/fishing");
}

// ---- Rides -----------------------------------------------------------------

export async function createRide(driver_id: string, direction: RideDirection) {
  await requireAdmin();
  const db = createAdminClient();
  await db.from("rides").insert({ driver_id, direction });
  revalidatePath("/admin/rides");
}

export async function updateRide(
  id: string,
  patch: { depart_time?: string | null; arrive_time?: string | null; notes?: string | null }
) {
  await requireAdmin();
  const db = createAdminClient();
  await db.from("rides").update(patch).eq("id", id);
  revalidatePath("/admin/rides");
}

export async function deleteRide(id: string) {
  await requireAdmin();
  const db = createAdminClient();
  await db.from("rides").delete().eq("id", id);
  revalidatePath("/admin/rides");
}

export async function addPassenger(ride_id: string, attendee_id: string) {
  await requireAdmin();
  const db = createAdminClient();
  await db
    .from("ride_passengers")
    .upsert({ ride_id, attendee_id }, { onConflict: "ride_id,attendee_id" });
  revalidatePath("/admin/rides");
}

export async function removePassenger(ride_id: string, attendee_id: string) {
  await requireAdmin();
  const db = createAdminClient();
  await db
    .from("ride_passengers")
    .delete()
    .eq("ride_id", ride_id)
    .eq("attendee_id", attendee_id);
  revalidatePath("/admin/rides");
}

// Driver-centric helpers: the ride row is created on demand for a
// driver + direction so the admin just assigns passengers / times.
type DB = ReturnType<typeof createAdminClient>;
async function getOrCreateRideId(
  db: DB,
  driver_id: string,
  direction: RideDirection
): Promise<string> {
  const { data } = await db
    .from("rides")
    .select("id")
    .eq("driver_id", driver_id)
    .eq("direction", direction)
    .maybeSingle();
  if (data) return data.id as string;
  const { data: created } = await db
    .from("rides")
    .insert({ driver_id, direction })
    .select("id")
    .single();
  return created!.id as string;
}

export async function assignPassenger(
  driver_id: string,
  direction: RideDirection,
  attendee_id: string
) {
  await requireAdmin();
  const db = createAdminClient();
  const rideId = await getOrCreateRideId(db, driver_id, direction);
  await db
    .from("ride_passengers")
    .upsert({ ride_id: rideId, attendee_id }, { onConflict: "ride_id,attendee_id" });

  // Default: riding down with a driver also means riding home with them.
  if (direction === "to_trip") {
    const homeId = await getOrCreateRideId(db, driver_id, "from_trip");
    await db
      .from("ride_passengers")
      .upsert({ ride_id: homeId, attendee_id }, { onConflict: "ride_id,attendee_id" });
  }

  revalidatePath("/admin/rides");
}

// Remove a passenger from a driver's ride for a direction. Coming-home that's
// still inheriting the down ride is materialized first so the others stay.
export async function unassignPassenger(
  driver_id: string,
  direction: RideDirection,
  attendee_id: string
) {
  await requireAdmin();
  const db = createAdminClient();

  if (direction === "from_trip") {
    const { data: existing } = await db
      .from("rides")
      .select("id")
      .eq("driver_id", driver_id)
      .eq("direction", "from_trip")
      .maybeSingle();
    if (!existing) await seedReturnFromDown(driver_id);
  }

  const rideId = await getOrCreateRideId(db, driver_id, direction);
  await db
    .from("ride_passengers")
    .delete()
    .eq("ride_id", rideId)
    .eq("attendee_id", attendee_id);
  revalidatePath("/admin/rides");
}

export async function setRideField(
  driver_id: string,
  direction: RideDirection,
  patch: { depart_time?: string | null; arrive_time?: string | null; notes?: string | null }
) {
  await requireAdmin();
  const db = createAdminClient();
  const rideId = await getOrCreateRideId(db, driver_id, direction);
  await db.from("rides").update(patch).eq("id", rideId);
  revalidatePath("/admin/rides");
}

// Coming-home defaults to the same passengers as the ride down. This makes the
// return ride explicit by copying the driver's "to_trip" passengers into it,
// so the organizer can then customize.
export async function seedReturnFromDown(driver_id: string) {
  await requireAdmin();
  const db = createAdminClient();
  const fromId = await getOrCreateRideId(db, driver_id, "from_trip");
  const { data: toRide } = await db
    .from("rides")
    .select("id")
    .eq("driver_id", driver_id)
    .eq("direction", "to_trip")
    .maybeSingle();
  if (toRide) {
    const { data: pax } = await db
      .from("ride_passengers")
      .select("attendee_id")
      .eq("ride_id", toRide.id);
    if (pax && pax.length) {
      await db
        .from("ride_passengers")
        .upsert(
          pax.map((p) => ({ ride_id: fromId, attendee_id: p.attendee_id })),
          { onConflict: "ride_id,attendee_id" }
        );
    }
  }
  revalidatePath("/admin/rides");
}
