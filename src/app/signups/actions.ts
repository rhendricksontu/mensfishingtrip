"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const AddSchema = z.object({
  name: z.string().trim().min(2, "Enter your name."),
  role: z.enum(["breakfast_cook", "coffee_maker"]),
  trip_day: z.enum(["saturday", "sunday"]),
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
    name: formData.get("name"),
    role: formData.get("role"),
    trip_day: formData.get("trip_day"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid signup." };
  }

  const db = createAdminClient();
  const { error } = await db.from("signups").insert({
    name: parsed.data.name,
    role: parsed.data.role,
    trip_day: parsed.data.trip_day,
  });
  if (error) return { ok: false, error: "Could not save your signup. Try again." };

  revalidatePath("/signups");
  return { ok: true };
}

export async function removeSignup(id: string): Promise<void> {
  const db = createAdminClient();
  await db.from("signups").delete().eq("id", id);
  revalidatePath("/signups");
}
