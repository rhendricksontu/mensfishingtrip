import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  AgendaItem,
  AgendaFile,
  Attendee,
  Cabin,
  FishingGroup,
  LocationItem,
  Ride,
  Signup,
  SignupLeader,
} from "@/lib/types";

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SECRET_KEY
  );
}

// Wraps a query so an unconfigured/erroring DB returns a fallback instead of
// crashing the page (useful before Supabase is wired up).
async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  if (!isSupabaseConfigured()) return fallback;
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

export function getAgenda(): Promise<AgendaItem[]> {
  return safe(async () => {
    const db = createAdminClient();
    const { data } = await db
      .from("agenda_items")
      .select("*")
      .order("trip_day", { ascending: true })
      .order("sort_order", { ascending: true });
    return (data as AgendaItem[]) ?? [];
  }, []);
}

export function getAgendaFiles(): Promise<AgendaFile[]> {
  return safe(async () => {
    const db = createAdminClient();
    const { data } = await db
      .from("agenda_files")
      .select("*")
      .order("created_at", { ascending: true });
    if (!data) return [];
    return data.map((f) => ({
      id: f.id,
      agenda_item_id: f.agenda_item_id,
      name: f.name,
      path: f.path,
      url: db.storage.from("agenda-files").getPublicUrl(f.path).data.publicUrl,
    })) as AgendaFile[];
  }, []);
}

export function getLocations(): Promise<LocationItem[]> {
  return safe(async () => {
    const db = createAdminClient();
    const { data } = await db
      .from("locations")
      .select("*")
      .order("sort_order", { ascending: true });
    return (data as LocationItem[]) ?? [];
  }, []);
}

export function getSignups(): Promise<Signup[]> {
  return safe(async () => {
    const db = createAdminClient();
    const { data } = await db
      .from("signups")
      .select("*")
      .order("created_at", { ascending: true });
    return (data as Signup[]) ?? [];
  }, []);
}

export function getSignupLeaders(): Promise<SignupLeader[]> {
  return safe(async () => {
    const db = createAdminClient();
    const { data } = await db.from("signup_leaders").select("*");
    return (data as SignupLeader[]) ?? [];
  }, []);
}

export function getCabins(): Promise<Cabin[]> {
  return safe(async () => {
    const db = createAdminClient();
    const { data } = await db
      .from("cabins")
      .select("*")
      .order("name", { ascending: true });
    return (data as Cabin[]) ?? [];
  }, []);
}

export function getFishingGroups(): Promise<FishingGroup[]> {
  return safe(async () => {
    const db = createAdminClient();
    const { data } = await db
      .from("fishing_groups")
      .select("*")
      .order("session", { ascending: true })
      .order("name", { ascending: true });
    return (data as FishingGroup[]) ?? [];
  }, []);
}

export function getAttendees(): Promise<Attendee[]> {
  return safe(async () => {
    const db = createAdminClient();
    const { data } = await db
      .from("attendees")
      .select("*")
      .order("name", { ascending: true });
    return (data as Attendee[]) ?? [];
  }, []);
}

export function getRides(): Promise<Ride[]> {
  return safe(async () => {
    const db = createAdminClient();
    const { data } = await db
      .from("rides")
      .select("*")
      .order("created_at", { ascending: true });
    return (data as Ride[]) ?? [];
  }, []);
}

export function getRidePassengers(): Promise<
  { ride_id: string; attendee_id: string }[]
> {
  return safe(async () => {
    const db = createAdminClient();
    const { data } = await db.from("ride_passengers").select("ride_id, attendee_id");
    return (data as { ride_id: string; attendee_id: string }[]) ?? [];
  }, []);
}
