"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAttendee } from "@/lib/attendee";
import { getAdminUser } from "@/lib/auth";

const AddSchema = z.object({
  role: z.enum(["breakfast_cook", "coffee_maker", "guide_lunch"]),
  trip_day: z.enum(["saturday", "sunday"]),
  quantity: z.coerce.number().int().min(1).max(50).default(1),
});

export interface SignupState {
  ok: boolean;
  error?: string;
}

export async function addSignup(
  _prev: SignupState,
  formData: FormData
): Promise<SignupState> {
  const parsed = AddSchema.safeParse({
    role: formData.get("role"),
    trip_day: formData.get("trip_day"),
    quantity: formData.get("quantity") || 1,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid signup." };
  }

  // We use the logged-in member's name; no need to ask for it.
  const me = await getCurrentAttendee();
  if (!me) return { ok: false, error: "Please log in to sign up." };

  const db = createAdminClient();
  const { error } = await db.from("signups").insert({
    name: me.name,
    role: parsed.data.role,
    trip_day: parsed.data.trip_day,
    quantity: parsed.data.quantity,
    attendee_id: me.id, // ownership: who can remove it later
  });
  if (error) return { ok: false, error: "Could not save your signup. Try again." };

  revalidatePath("/signups");
  return { ok: true };
}

// A volunteer may remove only their own signup; admins may remove any.
export async function removeSignup(id: string): Promise<{ ok: boolean; error?: string }> {
  const db = createAdminClient();
  const { data: row } = await db
    .from("signups")
    .select("attendee_id")
    .eq("id", id)
    .maybeSingle();

  if (!row) {
    revalidatePath("/signups");
    return { ok: true }; // already gone
  }

  const [me, admin] = await Promise.all([getCurrentAttendee(), getAdminUser()]);
  const isOwner = Boolean(me && row.attendee_id && row.attendee_id === me.id);

  if (!admin && !isOwner) {
    return { ok: false, error: "You can only remove your own signup." };
  }

  await db.from("signups").delete().eq("id", id);
  revalidatePath("/signups");
  return { ok: true };
}

// Admin: set (or clear) the leader for a signup instance (role + day).
export async function setSignupLeader(
  role: "breakfast_cook" | "coffee_maker" | "guide_lunch",
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
