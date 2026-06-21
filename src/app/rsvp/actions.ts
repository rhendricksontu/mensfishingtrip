"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePhone } from "@/lib/utils";
import type { Attendee } from "@/lib/types";

const RsvpSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  name: z.string().trim().min(2, "Please enter your full name."),
  phone: z
    .string()
    .trim()
    .refine((v) => normalizePhone(v).length >= 10, "Enter a valid phone number."),
  emergency_contact_name: z.string().trim().min(2, "Emergency contact name is required."),
  emergency_contact_phone: z
    .string()
    .trim()
    .refine((v) => normalizePhone(v).length >= 10, "Enter a valid emergency contact phone."),
  ride_preference: z.enum(["driving", "riding", "either"]),
  departure_time: z.string().trim().optional().default(""),
  willing_to_drive: z.boolean(),
  seat_capacity: z.coerce.number().int().min(0).max(20).default(0),
  needs_ride: z.boolean(),
  notes: z.string().trim().max(1000).optional().default(""),
});

export interface RsvpState {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  attendeeId?: string;
  edited?: boolean;
}

function bool(formData: FormData, key: string): boolean {
  const v = formData.get(key);
  return v === "on" || v === "true" || v === "1";
}

export async function submitRsvp(
  _prev: RsvpState,
  formData: FormData
): Promise<RsvpState> {
  const parsed = RsvpSchema.safeParse({
    id: (formData.get("id") as string) || "",
    name: formData.get("name"),
    phone: formData.get("phone"),
    emergency_contact_name: formData.get("emergency_contact_name"),
    emergency_contact_phone: formData.get("emergency_contact_phone"),
    ride_preference: formData.get("ride_preference"),
    departure_time: formData.get("departure_time"),
    willing_to_drive: bool(formData, "willing_to_drive"),
    seat_capacity: formData.get("seat_capacity") || 0,
    needs_ride: bool(formData, "needs_ride"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]);
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors };
  }

  const d = parsed.data;
  const db = createAdminClient();

  const record = {
    name: d.name,
    phone: d.phone,
    emergency_contact_name: d.emergency_contact_name,
    emergency_contact_phone: d.emergency_contact_phone,
    ride_preference: d.ride_preference,
    departure_time: d.departure_time || null,
    willing_to_drive: d.willing_to_drive,
    seat_capacity: d.willing_to_drive ? d.seat_capacity : 0,
    needs_ride: d.needs_ride,
    notes: d.notes || null,
  };

  // Editing an existing record.
  if (d.id) {
    const { error } = await db.from("attendees").update(record).eq("id", d.id);
    if (error) return { ok: false, error: "Could not save your changes. Try again." };
    return { ok: true, attendeeId: d.id, edited: true };
  }

  // New RSVP — but if a matching name+phone already exists, update it so we
  // don't create duplicates (matches the unique index in the schema).
  const existing = await findAttendee(d.name, d.phone);
  if (existing) {
    const { error } = await db.from("attendees").update(record).eq("id", existing.id);
    if (error) return { ok: false, error: "Could not save your RSVP. Try again." };
    return { ok: true, attendeeId: existing.id, edited: true };
  }

  const { data, error } = await db
    .from("attendees")
    .insert(record)
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: "Could not submit your RSVP. Try again." };
  }
  return { ok: true, attendeeId: data.id, edited: false };
}

// Look up an attendee by name + phone (case-insensitive, digits-only phone).
export async function findAttendee(
  name: string,
  phone: string
): Promise<Attendee | null> {
  const db = createAdminClient();
  const digits = normalizePhone(phone);
  const { data } = await db
    .from("attendees")
    .select("*")
    .ilike("name", name.trim())
    .limit(50);

  if (!data) return null;
  const match = data.find((a) => normalizePhone(a.phone) === digits);
  return (match as Attendee) || null;
}

export interface LookupState {
  ok: boolean;
  error?: string;
  attendee?: Attendee;
}

export async function lookupRsvp(
  _prev: LookupState,
  formData: FormData
): Promise<LookupState> {
  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  if (name.length < 2 || normalizePhone(phone).length < 10) {
    return { ok: false, error: "Enter the name and phone you used to RSVP." };
  }
  const attendee = await findAttendee(name, phone);
  if (!attendee) {
    return {
      ok: false,
      error: "We couldn't find an RSVP with that name and phone. Try the exact name you used.",
    };
  }
  return { ok: true, attendee };
}
