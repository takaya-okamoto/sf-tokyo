"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";

export async function signUp(formData: FormData) {
  const supabase = await createServerClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const displayName = formData.get("displayName") as string;

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    return { error: authError.message };
  }

  if (authData.user) {
    // Create profile with user role
    // Using type assertion to bypass RLS-induced type restrictions
    const { error: profileError } = await (supabase
      .from("profiles") as ReturnType<typeof supabase.from>)
      .insert({
        id: authData.user.id,
        email: authData.user.email!,
        display_name: displayName,
        role: "user",
      } as never);

    if (profileError) {
      return { error: profileError.message };
    }
  }

  redirect("/");
}

export async function signIn(formData: FormData) {
  const supabase = await createServerClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/");
}

export async function signOut() {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
