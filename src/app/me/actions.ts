"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentAttendee } from "@/lib/attendee";
import { normalizePhone } from "@/lib/utils";

const EditSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name."),
  emergency_contact_name: z.string().trim().min(2, "Emergency contact name is required."),
  emergency_contact_phone: z
    .string()
    .trim()
    .refine((v) => normalizePhone(v).length >= 10, "Enter a valid emergency contact phone."),
  ride_preference: z.enum(["driving", "riding"], {
    errorMap: () => ({ message: "Choose Driver or Passenger." }),
  }),
  departure_time: z.string().trim().optional().default(""),
  departure_location: z.string().trim().max(100).optional().default(""),
  willing_to_drive: z.boolean(),
  seat_capacity: z.coerce.number().int().min(0).max(20).default(0),
  needs_ride: z.boolean(),
  notes: z.string().trim().max(1000).optional().default(""),
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

export async function updateMyRsvp(
  _prev: EditState,
  formData: FormData
): Promise<EditState> {
  const me = await getCurrentAttendee();
  if (!me) return { ok: false, error: "Your session expired. Please log in again." };

  const parsed = EditSchema.safeParse({
    name: formData.get("name"),
    emergency_contact_name: formData.get("emergency_contact_name"),
    emergency_contact_phone: formData.get("emergency_contact_phone"),
    ride_preference: formData.get("ride_preference"),
    departure_time: formData.get("departure_time"),
    departure_location: formData.get("departure_location"),
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
  const { error } = await db
    .from("attendees")
    .update({
      name: d.name,
      emergency_contact_name: d.emergency_contact_name,
      emergency_contact_phone: d.emergency_contact_phone,
      ride_preference: d.ride_preference,
      departure_time: d.departure_time || null,
      departure_location: d.departure_location || null,
      willing_to_drive: d.willing_to_drive,
      seat_capacity: d.willing_to_drive ? d.seat_capacity : 0,
      needs_ride: d.needs_ride,
      notes: d.notes || null,
    })
    .eq("id", me.id);

  if (error) return { ok: false, error: "Could not save your changes. Try again." };

  revalidatePath("/me");
  return { ok: true };
}

export async function signOutAttendee(): Promise<void> {
  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
