import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface AdminUser {
  email: string;
  name: string | null;
}

// Returns the logged-in admin, or null if not authenticated / not an admin.
// An "admin" is a Supabase Auth user whose email is in the `admins` table.
export async function getAdminUser(): Promise<AdminUser | null> {
  // Before Supabase env vars are set, there is no session — treat as logged out.
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    !process.env.SUPABASE_SECRET_KEY
  ) {
    return null;
  }

  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;
    const db = createAdminClient();

    // (a) Email-based organizer (the bootstrap/backup login).
    if (user.email) {
      const { data } = await db
        .from("admins")
        .select("email, name")
        .eq("email", user.email.toLowerCase())
        .maybeSingle();
      if (data) return { email: data.email, name: data.name };
    }

    // (b) A member promoted to the 'admin' role, logged in with their phone.
    const { data: att } = await db
      .from("attendees")
      .select("name, role")
      .eq("user_id", user.id)
      .maybeSingle();
    if (att?.role === "admin") {
      return { email: user.email ?? "", name: att.name };
    }

    return null;
  } catch {
    return null;
  }
}

// The logged-in Supabase user (any role), or null. Cheap session check.
export async function getSessionUser() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    return null;
  }
  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user ?? null;
  } catch {
    return null;
  }
}

// True if the email is allowed to register as an admin (env allowlist).
export function isEmailAllowlisted(email: string): boolean {
  const list = (process.env.ADMIN_ALLOWLIST || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}
