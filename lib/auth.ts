import { createClient } from "@/utils/supabase/server";

export type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Retrieve the current authenticated user's id. Throws if not authenticated.
 */
export async function getCurrentUserId(
  existingClient?: SupabaseServerClient
): Promise<string> {
  const supabase = existingClient ?? (await createClient());
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("User not authenticated");
  }

  return user.id;
}

/**
 * Create baseline categories for a newly registered user.
 */
export async function createDefaultCategoriesForUser(userId: string) {
  const supabase = await createClient();
  const defaultCategories = [
    { name: "Groceries", user_id: userId },
    { name: "Beverages", user_id: userId },
    { name: "Snacks", user_id: userId },
    { name: "Household", user_id: userId },
  ];

  const { error } = await supabase.from("categories").insert(defaultCategories);

  if (error) {
    console.error("Error creating default categories:", error);
  }
}
