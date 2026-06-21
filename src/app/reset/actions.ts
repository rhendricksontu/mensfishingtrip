"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePhone, phoneKey } from "@/lib/utils";

const ResetSchema = z
  .object({
    phone: z
      .string()
      .trim()
      .refine((v) => normalizePhone(v).length >= 10, "Enter your cell phone."),
    emergency_contact_phone: z
      .string()
      .trim()
      .refine((v) => normalizePhone(v).length >= 10, "Enter your emergency contact phone."),
    password: z.string().min(8, "New password must be at least 8 characters."),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords don't match.",
    path: ["confirm"],
  });

export interface ResetState {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function resetPassword(
  _prev: ResetState,
  formData: FormData
): Promise<ResetState> {
  const parsed = ResetSchema.safeParse({
    phone: formData.get("phone"),
    emergency_contact_phone: formData.get("emergency_contact_phone"),
    password: formData.get("password"),
    confirm: formData.get("confirm"),
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

  // Find the account-holding attendee whose cell phone matches.
  const { data } = await db
    .from("attendees")
    .select("user_id, phone, emergency_contact_phone")
    .not("user_id", "is", null);

  const match = (data ?? []).find(
    (a) => phoneKey(a.phone) === phoneKey(d.phone)
  );

  // Generic message either way — don't reveal which field was wrong.
  const FAIL =
    "That cell phone and emergency contact didn't match our records. Double-check both, or ask an organizer to reset it.";

  if (
    !match?.user_id ||
    normalizePhone(match.emergency_contact_phone) !==
      normalizePhone(d.emergency_contact_phone)
  ) {
    return { ok: false, error: FAIL };
  }

  const { error } = await db.auth.admin.updateUserById(match.user_id, {
    password: d.password,
  });
  if (error) return { ok: false, error: "Could not update your password. Try again." };

  return { ok: true };
}
