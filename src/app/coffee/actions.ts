"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAttendee } from "@/lib/attendee";
import { COFFEE_DRINKS, COFFEE_PICKUP_TIMES } from "@/lib/config";

const OrderSchema = z.object({
  day: z.enum(["saturday", "sunday"]),
  drink: z.enum(COFFEE_DRINKS),
  pickup_time: z.string().trim().min(1),
});

export interface CoffeeState {
  ok: boolean;
  error?: string;
}

// Place or change the logged-in attendee's coffee order for a day. One order
// per attendee/day (upsert), reset to "pending" so an edited order re-enters
// the queue.
export async function placeCoffeeOrder(
  _prev: CoffeeState,
  formData: FormData
): Promise<CoffeeState> {
  const me = await getCurrentAttendee();
  if (!me) return { ok: false, error: "Please log in to order coffee." };

  const parsed = OrderSchema.safeParse({
    day: formData.get("day"),
    drink: formData.get("drink"),
    pickup_time: formData.get("pickup_time"),
  });
  if (!parsed.success) return { ok: false, error: "Please choose a drink and pickup time." };

  const { day, drink, pickup_time } = parsed.data;
  // Guard the pickup time against the day's allowed window.
  if (!COFFEE_PICKUP_TIMES[day].includes(pickup_time)) {
    return { ok: false, error: "That pickup time isn't available." };
  }

  const db = createAdminClient();
  const { error } = await db.from("coffee_orders").upsert(
    {
      attendee_id: me.id,
      day,
      drink,
      pickup_time,
      status: "pending",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "attendee_id,day" }
  );
  if (error) return { ok: false, error: error.message };

  revalidatePath("/agenda");
  revalidatePath("/me");
  revalidatePath("/admin/coffee");
  return { ok: true };
}

// The attendee confirms they picked up a ready order — clears it from the queue
// and the ready banner.
export async function pickUpCoffeeOrder(orderId: string): Promise<CoffeeState> {
  const me = await getCurrentAttendee();
  if (!me) return { ok: false, error: "Please log in." };

  const db = createAdminClient();
  const { error } = await db
    .from("coffee_orders")
    .update({ status: "picked_up", updated_at: new Date().toISOString() })
    .eq("id", orderId)
    .eq("attendee_id", me.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/me");
  revalidatePath("/admin/coffee");
  return { ok: true };
}

// Cancel/remove the attendee's own order for a day.
export async function cancelCoffeeOrder(day: "saturday" | "sunday"): Promise<CoffeeState> {
  const me = await getCurrentAttendee();
  if (!me) return { ok: false, error: "Please log in." };

  const db = createAdminClient();
  const { error } = await db
    .from("coffee_orders")
    .delete()
    .eq("attendee_id", me.id)
    .eq("day", day);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/agenda");
  revalidatePath("/me");
  revalidatePath("/admin/coffee");
  return { ok: true };
}
