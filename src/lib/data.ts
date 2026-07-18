import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { addressOneLine } from "@/lib/utils";
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
  Visibility,
} from "@/lib/types";

const VISIBILITY_DEFAULT: Visibility = {
  show_cabins: false,
  show_fishing: false,
  show_rides: false,
  show_volunteers: false,
};

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
    const [{ data }, { data: cabinRows }] = await Promise.all([
      db
        .from("agenda_items")
        .select("*")
        .order("trip_day", { ascending: true })
        .order("sort_order", { ascending: true }),
      db.from("cabins").select("*"),
    ]);
    const items = (data as AgendaItem[]) ?? [];

    // A cabin designated for an event drives that event's location.
    const cabinByEvent = new Map<string, Cabin>();
    for (const c of (cabinRows as Cabin[]) ?? []) {
      for (const key of c.event_locations ?? []) cabinByEvent.set(key, c);
    }
    return items.map((item) => {
      const cabin = item.event_key ? cabinByEvent.get(item.event_key) : undefined;
      if (!cabin) return item;
      const address = addressOneLine(cabin);
      return address
        ? { ...item, location: address, location_name: cabin.name }
        : item;
    });
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

export interface TripLocation {
  name: string | null;
  address: string;
}

// Distinct trip locations built from agenda item locations + cabins. Used as
// the option list wherever a place is chosen (e.g. a fishing group's meet-up).
export async function getTripLocations(): Promise<TripLocation[]> {
  const [agenda, cabins] = await Promise.all([getAgenda(), getCabins()]);
  const byAddr = new Map<string, TripLocation>();
  const add = (name: string | null, address: string) => {
    const key = address.replace(/@.*/, "").trim().toLowerCase();
    if (!key) return;
    const existing = byAddr.get(key);
    if (!existing) byAddr.set(key, { name: name?.trim() || null, address });
    else if (!existing.name && name?.trim()) existing.name = name.trim();
  };
  for (const item of agenda) {
    const address = item.location?.trim();
    if (address && /\d/.test(address)) add(item.location_name, address);
  }
  for (const c of cabins) {
    const address = addressOneLine(c);
    if (address) add(c.name, address);
  }
  return [...byAddr.values()].sort((a, b) =>
    (a.name || a.address).localeCompare(b.name || b.address)
  );
}

// Can this member see the Volunteers tab? Only leaders (and admins, checked
// separately). Plain volunteers only see their role on the My Trip page.
export function isSignupLeader(attendeeId: string): Promise<boolean> {
  return safe(async () => {
    const db = createAdminClient();
    const { data } = await db
      .from("signup_leaders")
      .select("attendee_id")
      .eq("attendee_id", attendeeId)
      .limit(1);
    return Boolean(data?.length);
  }, false);
}

// A monotonic counter bumped on every data change (DB trigger). The client
// polls this via /api/version to detect "out of sync" cheaply.
export function getDataVersion(): Promise<number> {
  return safe(async () => {
    const db = createAdminClient();
    const { data } = await db.from("data_version").select("version").eq("id", 1).maybeSingle();
    return Number(data?.version ?? 0);
  }, 0);
}

// Which My Fishing Trip cards has the organizer revealed to attendees?
export function getVisibility(): Promise<Visibility> {
  return safe(async () => {
    const db = createAdminClient();
    const { data } = await db.from("settings").select("key, value");
    const v: Visibility = { ...VISIBILITY_DEFAULT };
    for (const row of data ?? []) {
      if (row.key in v) v[row.key as keyof Visibility] = Boolean(row.value);
    }
    return v;
  }, { ...VISIBILITY_DEFAULT });
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
