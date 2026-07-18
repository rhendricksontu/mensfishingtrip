"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentAttendee } from "@/lib/attendee";
import { normalizePhone, formatPhone, phoneKey, authEmailForPhone } from "@/lib/utils";

const EditSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name."),
  fish_with_guide: z.enum(["yes", "no"], {
    errorMap: () => ({ message: "Please choose yes or no." }),
  }),
  phone: z
    .string()
    .trim()
    .refine((v) => normalizePhone(v).length >= 10, "Enter a valid phone number."),
  // Optional on edit; blank means keep the current password.
  password: z
    .string()
    .refine((v) => v === "" || v.length >= 8, "Password must be at least 8 characters."),
  emergency_contact_name: z.string().trim().min(2, "Emergency contact name is required."),
  emergency_contact_phone: z
    .string()
    .trim()
    .refine((v) => normalizePhone(v).length >= 10, "Enter a valid emergency contact phone."),
  ride_preference: z.enum(["driving", "riding", "either"], {
    errorMap: () => ({ message: "Choose Driver, Passenger, or Either." }),
  }),
  departure_time: z.string().trim().min(1, "Choose a departure time."),
  preferred_driver: z.string().trim().max(100).optional().default(""),
  willing_to_drive: z.boolean(),
  seat_capacity: z.coerce.number().int().min(0).max(20).default(0),
  activities: z.array(z.enum(["biking", "golfing", "hiking"])).default([]),
  activity_other: z.string().trim().max(200).optional().default(""),
});

export interface EditState {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

function bool(formData: FormData, key: string): boolean {
  const v = formData.get(key);
  return v === "on" || v === "true" || v === "1";
}

// When a select's value is "Other", use the paired free-text "<key>_other".
function otherOr(formData: FormData, key: string): string {
  const sel = String(formData.get(key) ?? "");
  return sel === "Other" ? String(formData.get(`${key}_other`) ?? "").trim() : sel;
}

export async function updateMyRsvp(
  _prev: EditState,
  formData: FormData
): Promise<EditState> {
  const me = await getCurrentAttendee();
  if (!me) return { ok: false, error: "Your session expired. Please log in again." };

  const parsed = EditSchema.safeParse({
    name: formData.get("name"),
    fish_with_guide: formData.get("fish_with_guide"),
    phone: formData.get("phone"),
    password: formData.get("password") ?? "",
    emergency_contact_name: formData.get("emergency_contact_name"),
    emergency_contact_phone: formData.get("emergency_contact_phone"),
    ride_preference: formData.get("ride_preference"),
    departure_time: otherOr(formData, "departure_time"),
    preferred_driver: formData.get("preferred_driver") ?? "",
    willing_to_drive: bool(formData, "willing_to_drive"),
    seat_capacity: formData.get("seat_capacity") || 0,
    activities: formData.getAll("activities").map(String),
    activity_other: formData.get("activity_other") ?? "",
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
  const willingToDrive = d.ride_preference !== "riding" && d.willing_to_drive;
  const db = createAdminClient();

  // Sync the login account when the phone (their username) or password changes.
  if (me.user_id) {
    const authUpdate: { email?: string; email_confirm?: boolean; password?: string } = {};
    if (phoneKey(d.phone) !== phoneKey(me.phone)) {
      authUpdate.email = authEmailForPhone(d.phone);
      authUpdate.email_confirm = true;
    }
    if (d.password) authUpdate.password = d.password;
    if (Object.keys(authUpdate).length > 0) {
      const { error: authErr } = await db.auth.admin.updateUserById(me.user_id, authUpdate);
      if (authErr) {
        const msg = authErr.message?.toLowerCase() ?? "";
        if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
          return {
            ok: false,
            error: "That phone number is already linked to another account.",
            fieldErrors: { phone: "Already in use." },
          };
        }
        return { ok: false, error: "Could not update your login. Try again." };
      }
    }
  }

  const { error } = await db
    .from("attendees")
    .update({
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
    })
    .eq("id", me.id);

  if (error) return { ok: false, error: "Could not save your changes. Try again." };

  revalidatePath("/me");
  return { ok: true };
}

// Self-service: a member who can no longer make the trip removes their own
// RSVP and login. FKs cascade (signups, rides, passengers) or set null.
export async function deleteMyAccount(): Promise<void> {
  const me = await getCurrentAttendee();
  if (me) {
    const db = createAdminClient();
    // Remove the RSVP row first, then the linked login, so the account is gone
    // entirely and the phone can be reused.
    await db.from("attendees").delete().eq("id", me.id);
    if (me.user_id) {
      const { error } = await db.auth.admin.deleteUser(me.user_id);
      if (error) console.error("deleteMyAccount: could not delete auth user:", error.message);
    }
  }
  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function signOutAttendee(): Promise<void> {
  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}
