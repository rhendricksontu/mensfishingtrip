"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizePhone, authEmailForPhone } from "@/lib/utils";
import type { Attendee } from "@/lib/types";

const RsvpSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name."),
  phone: z
    .string()
    .trim()
    .refine((v) => normalizePhone(v).length >= 10, "Enter a valid phone number."),
  password: z.string().min(8, "Password must be at least 8 characters."),
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
    name: formData.get("name"),
    phone: formData.get("phone"),
    password: formData.get("password"),
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
  const authEmail = authEmailForPhone(d.phone);

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

  // Is there already a row for this person (e.g. admin pre-added them)?
  const existing = await findAttendee(d.name, d.phone);
  if (existing?.user_id) {
    return {
      ok: false,
      error: "An account already exists for this name and phone. Please log in instead.",
    };
  }

  // Create the login account (pre-confirmed, so no SMS/email needed).
  const { data: created, error: createErr } = await db.auth.admin.createUser({
    email: authEmail,
    password: d.password,
    email_confirm: true,
    user_metadata: { name: d.name, phone: d.phone },
  });

  if (createErr || !created?.user) {
    const msg = createErr?.message?.toLowerCase() ?? "";
    if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
      return {
        ok: false,
        error: "An account already exists for this phone number. Please log in instead.",
      };
    }
    return { ok: false, error: "Could not create your account. Please try again." };
  }

  const userId = created.user.id;

  // Attach the account to a new or existing attendee row.
  let dbErr;
  if (existing) {
    ({ error: dbErr } = await db
      .from("attendees")
      .update({ ...record, user_id: userId })
      .eq("id", existing.id));
  } else {
    ({ error: dbErr } = await db
      .from("attendees")
      .insert({ ...record, user_id: userId }));
  }

  if (dbErr) {
    // Roll back the orphaned auth user so they can retry cleanly.
    await db.auth.admin.deleteUser(userId);
    return { ok: false, error: "Could not save your RSVP. Please try again." };
  }

  // Sign them in (sets the session cookie) and send them to their dashboard.
  const supabase = createSupabaseServerClient();
  await supabase.auth.signInWithPassword({ email: authEmail, password: d.password });

  redirect("/me");
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
