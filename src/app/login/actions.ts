"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizePhone, authEmailForPhone } from "@/lib/utils";

export interface LoginState {
  error?: string;
}

export async function signInAttendee(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const phone = String(formData.get("phone") || "").trim();
  const password = String(formData.get("password") || "");

  if (normalizePhone(phone).length < 10 || !password) {
    return { error: "Enter your cell phone and password." };
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: authEmailForPhone(phone),
    password,
  });

  if (error) {
    return { error: "Incorrect phone number or password." };
  }

  redirect("/me");
}
