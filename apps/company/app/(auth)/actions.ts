"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";

export async function signUp(formData: FormData) {
  const supabase = await createServerClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const companyName = formData.get("companyName") as string;

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    return { error: authError.message };
  }

  if (authData.user) {
    // Create profile with company role
    // Using type assertion to bypass RLS-induced type restrictions
    const { error: profileError } = await (supabase
      .from("profiles") as ReturnType<typeof supabase.from>)
      .insert({
        id: authData.user.id,
        email: authData.user.email!,
        role: "company",
      } as never);

    if (profileError) {
      return { error: profileError.message };
    }

    // Create company
    // Using type assertion to bypass RLS-induced type restrictions
    const { data: company, error: companyError } = await (supabase
      .from("companies") as ReturnType<typeof supabase.from>)
      .insert({
        name: companyName,
      } as never)
      .select()
      .single();

    if (companyError) {
      return { error: companyError.message };
    }

    const companyId = (company as { id: string }).id;

    // Add user as company member (owner)
    // Using type assertion to bypass RLS-induced type restrictions
    const { error: memberError } = await (supabase
      .from("company_members") as ReturnType<typeof supabase.from>)
      .insert({
        company_id: companyId,
        user_id: authData.user.id,
        role: "owner",
      } as never);

    if (memberError) {
      return { error: memberError.message };
    }

    // Create initial project
    const { data: project, error: projectError } = await (supabase
      .from("projects") as ReturnType<typeof supabase.from>)
      .insert({
        company_id: companyId,
        name: "My First Project",
        description: "Your first hearing project. Rename or edit as needed.",
      } as never)
      .select()
      .single();

    if (projectError) {
      return { error: projectError.message };
    }

    const projectId = (project as { id: string }).id;

    // Redirect to the newly created project
    redirect(`/projects/${projectId}`);
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
