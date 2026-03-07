"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@repo/supabase/admin";

export async function signUp(formData: FormData) {
  const supabase = await createServerClient();
  const adminClient = createAdminClient();

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
    // Use admin client to bypass RLS for initial setup
    // Create profile with company role
    const { error: profileError } = await adminClient
      .from("profiles")
      .insert({
        id: authData.user.id,
        email: authData.user.email!,
        role: "company",
      });

    if (profileError) {
      return { error: profileError.message };
    }

    // Create company
    const { data: company, error: companyError } = await adminClient
      .from("companies")
      .insert({
        name: companyName,
      })
      .select()
      .single();

    if (companyError) {
      return { error: companyError.message };
    }

    // Add user as company member (owner)
    const { error: memberError } = await adminClient
      .from("company_members")
      .insert({
        company_id: company.id,
        user_id: authData.user.id,
        role: "owner",
      });

    if (memberError) {
      return { error: memberError.message };
    }

    // Create initial project
    const { data: project, error: projectError } = await adminClient
      .from("projects")
      .insert({
        company_id: company.id,
        name: "My First Project",
        description: "Your first hearing project. Rename or edit as needed.",
      })
      .select()
      .single();

    if (projectError) {
      return { error: projectError.message };
    }

    // Redirect to the newly created project
    redirect(`/projects/${project.id}`);
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
