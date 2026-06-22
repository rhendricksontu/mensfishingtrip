"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isEmailAllowlisted } from "@/lib/auth";

export interface AuthState {
  error?: string;
  info?: string;
}

// Ensure an allowlisted email exists in the admins table.
async function ensureAdminRow(email: string) {
  const db = createAdminClient();
  await db.from("admins").upsert({ email: email.toLowerCase() }, { onConflict: "email" });
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  if (!email || !password) return { error: "Enter your email and password." };

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Incorrect email or password." };

  // Confirm this user is an authorized admin.
  const db = createAdminClient();
  const { data: adminRow } = await db
    .from("admins")
    .select("email")
    .eq("email", email)
    .maybeSingle();

  if (!adminRow) {
    if (isEmailAllowlisted(email)) {
      await ensureAdminRow(email);
    } else {
      await supabase.auth.signOut();
      return { error: "This account isn't authorized for the organizer dashboard." };
    }
  }

  redirect("/admin");
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  if (!email || password.length < 8)
    return { error: "Use your email and a password of at least 8 characters." };

  if (!isEmailAllowlisted(email)) {
    return {
      error:
        "That email isn't on the organizer allowlist. Ask whoever set up the site to add it (ADMIN_ALLOWLIST).",
    };
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: error.message };

  await ensureAdminRow(email);

  // If email confirmation is on, there's no session yet.
  if (!data.session) {
    return {
      info: "Account created. Check your email to confirm, then log in.",
    };
  }

  redirect("/admin");
}

export async function signOut(): Promise<void> {
  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
