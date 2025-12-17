"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

/**
 * Login user with email and password
 * Returns error message if login fails, otherwise redirects to mainpos
 */
export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Validate inputs
  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  // Attempt to sign in
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Login error:", error);
    return { error: error.message || "Invalid email or password" };
  }

  if (!data.user) {
    return { error: "Login failed. Please try again." };
  }

  // Check if user profile exists and is active
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_active")
    .eq("id", data.user.id)
    .single();

  if (profileError || !profile) {
    console.error("Profile error:", profileError);
    return { error: "User profile not found. Please contact support." };
  }

  if (!profile.is_active) {
    await supabase.auth.signOut();
    return { error: "Your account has been deactivated. Please contact support." };
  }

  // Success - revalidate and redirect
  revalidatePath("/", "layout");
  redirect("/mainpos");
}

/**
 * Sign up new user with email, password, and profile information
 * Returns error message if signup fails, otherwise redirects to mainpos
 */
export async function signup(formData: FormData) {
  const supabase = await createClient();

  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const storeName = formData.get("storeName") as string;
  const phone = formData.get("phone") as string;

  // Validate required fields
  if (!firstName || !lastName || !email || !password) {
    return { error: "All fields are required" };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters long" };
  }

  const fullName = `${firstName} ${lastName}`;

  // Attempt to create the user
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        store_name: storeName || "",
        phone: phone || "",
      },
    },
  });

  if (error) {
    console.error("Signup error:", error);
    
    if (error.message.includes("already registered")) {
      return { error: "This email is already registered. Please login instead." };
    }
    
    return { error: error.message || "Signup failed. Please try again." };
  }

  if (!data.user) {
    return { error: "Signup failed. Please try again." };
  }

  // Check if email confirmation is required
  if (data.user.identities && data.user.identities.length === 0) {
    return { 
      error: "This email is already registered. Please login instead.",
      type: "email_exists"
    };
  }

  // Success - revalidate and redirect
  revalidatePath("/", "layout");
  redirect("/mainpos");
}

/**
 * Sign out current user
 * Clears session and redirects to login page
 */
export async function signout() {
  const supabase = await createClient();
  
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    console.error("Signout error:", error);
    return { error: "Failed to sign out. Please try again." };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogle() {
  const supabase = await createClient();
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    console.error("Google signin error:", error);
    return { error: "Failed to sign in with Google" };
  }

  if (data.url) {
    redirect(data.url);
  }
}

/**
 * Get current user profile
 */
export async function getUserProfile() {
  const supabase = await createClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return { error: "Not authenticated", user: null, profile: null };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("Profile fetch error:", profileError);
    return { error: "Failed to fetch profile", user, profile: null };
  }

  return { error: null, user, profile };
}
