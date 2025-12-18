"use server";

import { createClient } from "@/utils/supabase/server";

// Types for POS
export interface Category {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category_id: string;
  stock_quantity: number;
  icon: string | null;
  sku: string;
  is_active: boolean;
  category_name?: string;
}

export interface CartItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

/**
 * Fetch all active products with category information
 */
export async function fetchProducts(): Promise<Product[]> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("products")
      .select(
        `
        id,
        name,
        price,
        category_id,
        stock_quantity,
        icon,
        sku,
        is_active,
        categories(name)
      `
      )
      .eq("is_active", true)
      .order("name");

    if (error) {
      console.error("Error fetching products:", error);
      return [];
    }

    return (data || []).map((product: any) => ({
      id: product.id,
      name: product.name,
      price: product.price,
      category_id: product.category_id,
      stock_quantity: product.stock_quantity,
      icon: product.icon,
      sku: product.sku,
      is_active: product.is_active,
      category_name: product.categories?.name || "Uncategorized",
    }));
  } catch (error) {
    console.error("Unexpected error fetching products:", error);
    return [];
  }
}

/**
 * Fetch all categories
 */
export async function fetchCategories(): Promise<Category[]> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("categories")
      .select("id, name")
      .order("name");

    if (error) {
      console.error("Error fetching categories:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Unexpected error fetching categories:", error);
    return [];
  }
}

/**
 * Get current user profile for cashier info
 */
export async function getUserProfile() {
  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, store_name")
      .eq("id", user.id)
      .single();

    return profile;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

/**
 * Create a transaction with items and update stock
 */
export async function createTransaction(
  items: CartItem[],
  paymentMethod: string,
  subtotal: number,
  taxAmount: number,
  totalAmount: number
) {
  const supabase = await createClient();

  try {
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "User not authenticated" };
    }

    // Get user profile for cashier name
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    const cashierName = profile?.full_name || "Unknown";

    // Generate unique receipt number
    const receiptNumber = `RCP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create transaction
    const { data: transaction, error: transactionError } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        payment_method: paymentMethod,
        status: "completed",
        cashier_name: cashierName,
        receipt_number: receiptNumber,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (transactionError) {
      console.error("Error creating transaction:", transactionError);
      return { error: "Failed to create transaction" };
    }

    // Insert transaction items and update stock
    for (const item of items) {
      // Insert transaction item
      const { error: itemError } = await supabase
        .from("transaction_items")
        .insert({
          transaction_id: transaction.id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal: item.subtotal,
        });

      if (itemError) {
        console.error("Error inserting transaction item:", itemError);
        return { error: "Failed to save transaction items" };
      }

      // Update product stock
      const { error: stockError } = await supabase.rpc(
        "decrement_product_stock",
        {
          product_id: item.product_id,
          quantity: item.quantity,
        }
      );

      // If RPC function doesn't exist, use direct update
      if (stockError?.code === "PGRST205") {
        const { error: updateError } = await supabase
          .from("products")
          .select("stock_quantity")
          .eq("id", item.product_id)
          .single()
          .then(async ({ data }) => {
            if (data) {
              return await supabase
                .from("products")
                .update({
                  stock_quantity: Math.max(0, data.stock_quantity - item.quantity),
                })
                .eq("id", item.product_id);
            }
            return { error: null };
          });

        if (updateError) {
          console.error("Error updating stock:", updateError);
        }
      }
    }

    return {
      success: true,
      transaction,
      receipt_number: receiptNumber,
    };
  } catch (error) {
    console.error("Error creating transaction:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Update product stock directly (fallback method)
 */
export async function updateProductStock(
  productId: string,
  quantityToDecrement: number
) {
  const supabase = await createClient();

  try {
    // Get current stock
    const { data: product, error: fetchError } = await supabase
      .from("products")
      .select("stock_quantity")
      .eq("id", productId)
      .single();

    if (fetchError || !product) {
      return { error: "Product not found" };
    }

    // Update stock
    const newStock = Math.max(0, product.stock_quantity - quantityToDecrement);
    const { error: updateError } = await supabase
      .from("products")
      .update({ stock_quantity: newStock })
      .eq("id", productId);

    if (updateError) {
      return { error: "Failed to update stock" };
    }

    return { success: true, new_stock: newStock };
  } catch (error) {
    console.error("Error updating product stock:", error);
    return { error: "An unexpected error occurred" };
  }
}
