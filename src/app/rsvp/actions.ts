"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizePhone, formatPhone, authEmailForPhone } from "@/lib/utils";
import type { Attendee } from "@/lib/types";

const RsvpSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name."),
  fish_with_guide: z.enum(["yes", "no"], {
    errorMap: () => ({ message: "Please choose yes or no." }),
  }),
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
  ride_preference: z.enum(["driving", "riding", "either", "arranged"], {
    errorMap: () => ({ message: "Choose a ride preference." }),
  }),
  departure_time: z.string().trim().min(1, "Choose a departure time."),
  preferred_driver: z.string().trim().max(100).optional().default(""),
  willing_to_drive: z.boolean(),
  seat_capacity: z.coerce.number().int().min(0).max(20).default(0),
  activities: z.array(z.enum(["biking", "golfing", "hiking"])).default([]),
  activity_other: z.string().trim().max(200).optional().default(""),
  wants_other: z.boolean().default(false),
}).superRefine((val, ctx) => {
  // If they checked "Other", they must say what it is.
  if (val.wants_other && !val.activity_other.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["activity_other"],
      message: "Please specify your other activity.",
    });
  }
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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// A rate-limit / transient auth error is worth retrying; a real error
// (e.g. "already registered") is not.
function isTransientAuthError(error: unknown): boolean {
  const e = error as { status?: number; message?: string } | null;
  if (!e) return false;
  if (e.status === 429 || e.status === 503) return true;
  return /rate limit|too many|timeout|temporarily|unavailable/i.test(e.message ?? "");
}

// Retry a Supabase auth call through a brief rate-limit blip so a burst of
// RSVPs doesn't surface an error to a user who filled out the whole form.
async function retryAuth<T extends { error: unknown }>(fn: () => Promise<T>): Promise<T> {
  const delays = [300, 800, 1600];
  let result = await fn();
  for (const d of delays) {
    if (!isTransientAuthError(result.error)) return result;
    await sleep(d);
    result = await fn();
  }
  return result;
}

// When a select's value is "Other", use the paired free-text "<key>_other".
function otherOr(formData: FormData, key: string): string {
  const sel = String(formData.get(key) ?? "");
  return sel === "Other" ? String(formData.get(`${key}_other`) ?? "").trim() : sel;
}

export async function submitRsvp(
  _prev: RsvpState,
  formData: FormData
): Promise<RsvpState> {
  const parsed = RsvpSchema.safeParse({
    name: formData.get("name"),
    fish_with_guide: formData.get("fish_with_guide"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    emergency_contact_name: formData.get("emergency_contact_name"),
    emergency_contact_phone: formData.get("emergency_contact_phone"),
    ride_preference: formData.get("ride_preference"),
    departure_time: otherOr(formData, "departure_time"),
    preferred_driver: formData.get("preferred_driver") ?? "",
    willing_to_drive: bool(formData, "willing_to_drive"),
    seat_capacity: formData.get("seat_capacity") || 0,
    activities: formData.getAll("activities").map(String),
    activity_other: formData.get("activity_other") ?? "",
    wants_other: bool(formData, "wants_other"),
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

  // Drivers (and "either") can offer seats; passengers need a ride by definition.
  const willingToDrive =
    d.ride_preference !== "riding" && d.willing_to_drive;
  const record = {
    name: d.name,
    fish_with_guide: d.fish_with_guide === "yes",
    phone: formatPhone(d.phone),
    emergency_contact_name: d.emergency_contact_name,
    emergency_contact_phone: formatPhone(d.emergency_contact_phone),
    ride_preference: d.ride_preference,
    departure_time: d.departure_time || null,
    preferred_driver: d.preferred_driver || null,
    willing_to_drive: willingToDrive,
    seat_capacity: willingToDrive ? d.seat_capacity : 0,
    needs_ride: d.ride_preference === "riding",
    activities: d.activities,
    activity_other: d.activity_other || null,
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
  const { data: created, error: createErr } = await retryAuth(() =>
    db.auth.admin.createUser({
      email: authEmail,
      password: d.password,
      email_confirm: true,
      user_metadata: { name: d.name, phone: d.phone },
    })
  );

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
    // Same full name + cell phone already exists (DB unique constraint).
    if (dbErr.code === "23505" || /duplicate|unique/i.test(dbErr.message ?? "")) {
      return {
        ok: false,
        error:
          "Someone with this name and phone number has already RSVP'd. Please log in instead.",
      };
    }
    return { ok: false, error: "Could not save your RSVP. Please try again." };
  }

  // Sign them in (sets the session cookie) and send them to their dashboard.
  // Their account is already saved; if the auto-login hiccups under load, send
  // them to the login page rather than an unauthenticated bounce to home.
  const supabase = createSupabaseServerClient();
  const { error: signInErr } = await retryAuth(() =>
    supabase.auth.signInWithPassword({ email: authEmail, password: d.password })
  );
  if (signInErr) redirect("/login");

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
