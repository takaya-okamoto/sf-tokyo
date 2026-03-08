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

    // Redirect to onboarding to create first project
    redirect("/onboarding/project");
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

export async function createFirstProject(formData: FormData) {
  const supabase = await createServerClient();
  const adminClient = createAdminClient();

  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Get company_id from company_members
  const { data: memberData, error: memberError } = await (
    supabase.from("company_members") as ReturnType<typeof supabase.from>
  )
    .select("company_id")
    .eq("user_id", user.id)
    .single();

  if (memberError || !memberData) {
    return { error: "Company not found" };
  }

  const companyMember = memberData as { company_id: string };

  // Create project
  const { data: project, error: projectError } = await adminClient
    .from("projects")
    .insert({
      company_id: companyMember.company_id,
      name,
      description,
    })
    .select()
    .single();

  if (projectError) {
    return { error: projectError.message };
  }

  redirect(`/projects/${project.id}`);
}
