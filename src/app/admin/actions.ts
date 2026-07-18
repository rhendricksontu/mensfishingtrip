"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/require-admin";
import { sanitizeNotes } from "@/lib/sanitize";
import type { FishingSession, RideDirection, VisibilityKey } from "@/lib/types";

// ---- Coffee queue ----------------------------------------------------------

// Organizer marks a coffee order ready for pickup (or back to pending). The
// attendee then sees a "ready" banner on My Trip and confirms pickup.
export async function setCoffeeReady(orderId: string, ready: boolean) {
  await requireAdmin();
  const db = createAdminClient();
  const { error } = await db
    .from("coffee_orders")
    .update({ status: ready ? "ready" : "pending", updated_at: new Date().toISOString() })
    .eq("id", orderId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/coffee");
  revalidatePath("/me");
  return { ok: true };
}

// Organizer clears a picked-up order off the queue — for when the attendee got
// their coffee but forgot to tap "I picked up my order".
export async function clearCoffeeOrder(orderId: string) {
  await requireAdmin();
  const db = createAdminClient();
  const { error } = await db
    .from("coffee_orders")
    .update({ status: "picked_up", updated_at: new Date().toISOString() })
    .eq("id", orderId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/coffee");
  revalidatePath("/me");
  return { ok: true };
}

// ---- Attendee-facing card visibility --------------------------------------

// Toggle whether attendees see their cabin / fishing / ride card on /me.
export async function setVisibility(key: VisibilityKey, value: boolean) {
  await requireAdmin();
  const db = createAdminClient();
  const { error } = await db
    .from("settings")
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/me");
  revalidatePath("/admin/cabins");
  revalidatePath("/admin/fishing");
  revalidatePath("/admin/rides");
  revalidatePath("/admin/volunteers");
  return { ok: true };
}

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
  revalidatePath("/admin/ar");
  revalidatePath("/admin/roster");
  revalidatePath("/admin/cabins");
  revalidatePath("/admin/fishing");
  revalidatePath("/me");
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
  address?: CabinAddress,
  events?: string[]
) {
  await requireAdmin();
  const db = createAdminClient();
  const eventLocations = events ?? [];

  // One event, one cabin: take these keys away from any other cabin.
  if (eventLocations.length) {
    const { data: others } = await db.from("cabins").select("id, event_locations");
    for (const o of others ?? []) {
      const locs: string[] = o.event_locations ?? [];
      const kept = locs.filter((k) => !eventLocations.includes(k));
      if (kept.length !== locs.length) {
        await db.from("cabins").update({ event_locations: kept }).eq("id", o.id);
      }
    }
  }

  await db
    .from("cabins")
    .insert({ name, capacity, ...(address ?? {}), event_locations: eventLocations });
  revalidatePath("/admin/cabins");
  revalidatePath("/agenda");
  revalidatePath("/");
  revalidatePath("/locations");
}

export async function updateCabin(
  id: string,
  patch: { name?: string; capacity?: number } & CabinAddress
) {
  await requireAdmin();
  const db = createAdminClient();
  await db.from("cabins").update(patch).eq("id", id);
  revalidatePath("/admin/cabins");
  revalidatePath("/me");
  // A cabin's name/address feeds the Locations page and any event it's the
  // location for on the agenda.
  revalidatePath("/locations");
  revalidatePath("/agenda");
  revalidatePath("/");
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
  revalidatePath("/me");
}

export async function deleteCabin(id: string) {
  await requireAdmin();
  const db = createAdminClient();
  // attendees.cabin_id is ON DELETE SET NULL, so occupants are auto-unassigned.
  await db.from("cabins").delete().eq("id", id);
  revalidatePath("/admin/cabins");
  revalidatePath("/me");
  revalidatePath("/agenda");
  revalidatePath("/");
  revalidatePath("/locations");
}

// Set (or clear) a cabin as the location for a known event (e.g. a breakfast or
// night service). An event has one location, so assigning it clears the same
// key from any other cabin. The agenda derives its location from this.
export async function setCabinEventLocation(
  cabin_id: string,
  event_key: string,
  on: boolean
) {
  await requireAdmin();
  const db = createAdminClient();

  const { data: cabin } = await db
    .from("cabins")
    .select("event_locations")
    .eq("id", cabin_id)
    .maybeSingle();
  const current: string[] = cabin?.event_locations ?? [];

  if (on) {
    // One event, one cabin: remove this key from any other cabin first.
    const { data: others } = await db
      .from("cabins")
      .select("id, event_locations")
      .neq("id", cabin_id);
    for (const o of others ?? []) {
      const locs: string[] = o.event_locations ?? [];
      if (locs.includes(event_key)) {
        await db
          .from("cabins")
          .update({ event_locations: locs.filter((k) => k !== event_key) })
          .eq("id", o.id);
      }
    }
    if (!current.includes(event_key)) {
      await db
        .from("cabins")
        .update({ event_locations: [...current, event_key] })
        .eq("id", cabin_id);
    }
  } else {
    await db
      .from("cabins")
      .update({ event_locations: current.filter((k) => k !== event_key) })
      .eq("id", cabin_id);
  }

  revalidatePath("/admin/cabins");
  revalidatePath("/agenda");
  revalidatePath("/");
  revalidatePath("/locations");
  return { ok: true };
}

// ---- Fishing groups --------------------------------------------------------

export async function createFishingGroup(
  name: string,
  session: FishingSession,
  guide_name: string,
  capacity: number,
  guide_phone?: string | null,
  guide_attendee_id?: string | null,
  meet_location?: string | null,
  meet_location_name?: string | null,
  meet_time?: string | null
) {
  await requireAdmin();
  const db = createAdminClient();
  await db.from("fishing_groups").insert({
    name,
    session,
    guide_name,
    capacity,
    guide_phone: guide_phone || null,
    guide_attendee_id: guide_attendee_id || null,
    meet_location: meet_location || null,
    meet_location_name: meet_location_name || null,
    meet_time: meet_time || null,
  });
  revalidatePath("/admin/fishing");
}

export async function updateFishingGroup(
  id: string,
  patch: {
    guide_name?: string;
    guide_phone?: string | null;
    capacity?: number;
    name?: string;
    meet_location?: string | null;
    meet_location_name?: string | null;
    meet_time?: string | null;
  }
) {
  await requireAdmin();
  const db = createAdminClient();
  await db.from("fishing_groups").update(patch).eq("id", id);
  revalidatePath("/admin/fishing");
  revalidatePath("/me");
}

export async function deleteFishingGroup(id: string) {
  await requireAdmin();
  const db = createAdminClient();
  // attendees.fishing_group_id is ON DELETE SET NULL.
  await db.from("fishing_groups").delete().eq("id", id);
  revalidatePath("/admin/fishing");
  revalidatePath("/me");
}

// ---- Rides -----------------------------------------------------------------

export async function createRide(driver_id: string, direction: RideDirection) {
  await requireAdmin();
  const db = createAdminClient();
  await db.from("rides").insert({ driver_id, direction });
  revalidatePath("/admin/rides");
  revalidatePath("/me");
}

export async function updateRide(
  id: string,
  patch: { depart_time?: string | null; arrive_time?: string | null; notes?: string | null }
) {
  await requireAdmin();
  const db = createAdminClient();
  await db.from("rides").update(patch).eq("id", id);
  revalidatePath("/admin/rides");
  revalidatePath("/me");
}

export async function deleteRide(id: string) {
  await requireAdmin();
  const db = createAdminClient();
  await db.from("rides").delete().eq("id", id);
  revalidatePath("/admin/rides");
  revalidatePath("/me");
}

export async function addPassenger(ride_id: string, attendee_id: string) {
  await requireAdmin();
  const db = createAdminClient();
  await db
    .from("ride_passengers")
    .upsert({ ride_id, attendee_id }, { onConflict: "ride_id,attendee_id" });
  revalidatePath("/admin/rides");
  revalidatePath("/me");
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
  revalidatePath("/me");
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

// Flip a person between driver and passenger on the Rides tab. Making someone a
// driver gives them a default seat count; making them a passenger clears their
// (empty) ride so no ghost driver row lingers.
export async function setDriverStatus(
  attendee_id: string,
  willing: boolean,
  seats?: number
) {
  await requireAdmin();
  const db = createAdminClient();

  if (willing) {
    let capacity: number;
    if (typeof seats === "number" && Number.isFinite(seats)) {
      capacity = Math.max(0, Math.min(20, Math.trunc(seats)));
    } else {
      const { data: a } = await db
        .from("attendees")
        .select("seat_capacity")
        .eq("id", attendee_id)
        .maybeSingle();
      capacity = a?.seat_capacity && a.seat_capacity > 0 ? a.seat_capacity : 3;
    }
    const { error } = await db
      .from("attendees")
      .update({
        willing_to_drive: true,
        seat_capacity: capacity,
        needs_ride: false,
        ride_preference: "driving",
      })
      .eq("id", attendee_id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await db
      .from("attendees")
      .update({
        willing_to_drive: false,
        seat_capacity: 0,
        needs_ride: true,
        ride_preference: "riding",
      })
      .eq("id", attendee_id);
    if (error) return { ok: false, error: error.message };
    // Drop any (empty) ride row they had as a driver.
    await db.from("rides").delete().eq("driver_id", attendee_id);
  }

  revalidatePath("/admin/rides");
  revalidatePath("/me");
  return { ok: true };
}

export async function assignPassenger(
  driver_id: string,
  direction: RideDirection,
  attendee_id: string
) {
  await requireAdmin();
  const db = createAdminClient();
  // One car both ways, so we only track the single "to_trip" ride per driver.
  const rideId = await getOrCreateRideId(db, driver_id, "to_trip");
  await db
    .from("ride_passengers")
    .upsert({ ride_id: rideId, attendee_id }, { onConflict: "ride_id,attendee_id" });

  // Seating someone settles their RSVP role to passenger (e.g. an "Either").
  await db
    .from("attendees")
    .update({
      ride_preference: "riding",
      willing_to_drive: false,
      seat_capacity: 0,
      needs_ride: true,
    })
    .eq("id", attendee_id);

  revalidatePath("/admin/rides");
  revalidatePath("/me");
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
  revalidatePath("/me");
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
  revalidatePath("/me");
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
  revalidatePath("/me");
}

// ---- Agenda ---------------------------------------------------------------

export async function createAgendaItem(
  trip_day: string,
  patch: {
    start_time?: string | null;
    title: string;
    description?: string | null;
    location?: string | null;
    location_name?: string | null;
    notes?: string | null;
  }
) {
  await requireAdmin();
  const db = createAdminClient();
  // Place the new item at the end of that day.
  const { data: last } = await db
    .from("agenda_items")
    .select("sort_order")
    .eq("trip_day", trip_day)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const row: Record<string, unknown> = {
    trip_day,
    sort_order: (last?.sort_order ?? 0) + 10,
    title: patch.title,
    start_time: patch.start_time || null,
    description: patch.description || null,
    location: patch.location || null,
  };
  if (patch.location_name) row.location_name = patch.location_name; // omit when empty
  const cleanNotes = patch.notes ? sanitizeNotes(patch.notes) : "";
  if (cleanNotes) row.notes = cleanNotes; // omit when empty (pre-migration safe)
  await db.from("agenda_items").insert(row);
  revalidatePath("/");
}

export async function updateAgendaItem(
  id: string,
  patch: {
    start_time?: string | null;
    title?: string;
    description?: string | null;
    location?: string | null;
    location_name?: string | null;
    notes?: string | null;
    trip_day?: string;
    sort_order?: number;
  }
) {
  await requireAdmin();
  const db = createAdminClient();
  const clean = { ...patch };
  if (typeof clean.notes === "string") {
    clean.notes = clean.notes ? sanitizeNotes(clean.notes) || null : null;
  }
  await db.from("agenda_items").update(clean).eq("id", id);
  revalidatePath("/");
}

export async function deleteAgendaItem(id: string) {
  await requireAdmin();
  const db = createAdminClient();
  // Remove any attached storage objects (the rows cascade with the item).
  const { data: files } = await db.from("agenda_files").select("path").eq("agenda_item_id", id);
  if (files?.length) {
    await db.storage.from("agenda-files").remove(files.map((f) => f.path));
  }
  await db.from("agenda_items").delete().eq("id", id);
  revalidatePath("/");
}

export async function uploadAgendaFile(agendaItemId: string, formData: FormData) {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "No file selected." };
  }
  const db = createAdminClient();
  const safeName = file.name.replace(/[^\w.\-]+/g, "_");
  const path = `${agendaItemId}/${Date.now()}-${safeName}`;
  const { error } = await db.storage
    .from("agenda-files")
    .upload(path, file, {
      contentType: file.type || undefined,
      // Cache hard at the CDN edge so the first fetch warms it and the rest of
      // the group gets it fast (files are immutable per upload path).
      cacheControl: "31536000",
    });
  if (error) return { ok: false, error: error.message };
  await db.from("agenda_files").insert({ agenda_item_id: agendaItemId, name: file.name, path });
  revalidatePath("/");
  return { ok: true };
}

export async function deleteAgendaFile(id: string) {
  await requireAdmin();
  const db = createAdminClient();
  const { data } = await db.from("agenda_files").select("path").eq("id", id).maybeSingle();
  if (data?.path) await db.storage.from("agenda-files").remove([data.path]);
  await db.from("agenda_files").delete().eq("id", id);
  revalidatePath("/");
}
