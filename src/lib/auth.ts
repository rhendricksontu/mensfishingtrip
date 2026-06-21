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
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return null;
  }

  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) return null;

    const email = user.email.toLowerCase();
    const db = createAdminClient();
    const { data } = await db
      .from("admins")
      .select("email, name")
      .eq("email", email)
      .maybeSingle();

    if (!data) return null;
    return { email: data.email, name: data.name };
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
