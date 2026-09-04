"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/auth";
import { getCurrentAttendee } from "@/lib/attendee";

// Admin assigns (or clears) the golf leader.
export async function setGolfLeader(attendeeId: string | null) {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "Organizers only." };
  const db = createAdminClient();
  const { error } = await db
    .from("golf")
    .update({ leader_id: attendeeId, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/golf");
  revalidatePath("/me");
  return { ok: true };
}

const GolfSchema = z.object({
  title: z.string().trim().max(120).optional().default(""),
  start_time: z.string().trim().max(40).optional().default(""),
  location_name: z.string().trim().max(120).optional().default(""),
  location: z.string().trim().max(200).optional().default(""),
  notes: z.string().trim().max(2000).optional().default(""),
});

export interface GolfState {
  ok: boolean;
  error?: string;
}

// The golf leader (or an organizer) sets the details shown to golfers.
export async function updateGolf(_prev: GolfState, formData: FormData): Promise<GolfState> {
  const [admin, me] = await Promise.all([getAdminUser(), getCurrentAttendee()]);
  const db = createAdminClient();

  if (!admin) {
    const { data: g } = await db.from("golf").select("leader_id").eq("id", 1).maybeSingle();
    if (!me || g?.leader_id !== me.id) {
      return { ok: false, error: "Only the golf leader or an organizer can edit this." };
    }
  }

  const parsed = GolfSchema.safeParse({
    title: formData.get("title") ?? "",
    start_time: formData.get("start_time") ?? "",
    location_name: formData.get("location_name") ?? "",
    location: formData.get("location") ?? "",
    notes: formData.get("notes") ?? "",
  });
  if (!parsed.success) return { ok: false, error: "Please check the fields and try again." };

  const d = parsed.data;
  const { error } = await db
    .from("golf")
    .update({
      title: d.title || null,
      start_time: d.start_time || null,
      location_name: d.location_name || null,
      location: d.location || null,
      notes: d.notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/golf");
  revalidatePath("/me");
  return { ok: true };
}
