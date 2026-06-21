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
  await db.from("attendees").delete().eq("id", id);
  revalidatePath("/admin/roster");
}

// ---- Cabins ----------------------------------------------------------------

export async function createCabin(name: string, capacity: number) {
  await requireAdmin();
  const db = createAdminClient();
  await db.from("cabins").insert({ name, capacity });
  revalidatePath("/admin/cabins");
}

// ---- Fishing groups --------------------------------------------------------

export async function createFishingGroup(
  name: string,
  session: FishingSession,
  guide_name: string,
  capacity: number
) {
  await requireAdmin();
  const db = createAdminClient();
  await db.from("fishing_groups").insert({ name, session, guide_name, capacity });
  revalidatePath("/admin/fishing");
}

export async function updateFishingGroup(
  id: string,
  patch: { guide_name?: string; capacity?: number; name?: string }
) {
  await requireAdmin();
  const db = createAdminClient();
  await db.from("fishing_groups").update(patch).eq("id", id);
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
