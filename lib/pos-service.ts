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

// Transaction history types
export interface Transaction {
  id: string;
  created_at: string;
  subtotal: number | null;
  tax_amount: number | null;
  total_amount: number;
  payment_method: string;
  status: string;
  cashier_name: string | null;
  receipt_number: string | null;
}

export interface TransactionItem {
  id: string;
  transaction_id: string;
  product_id: string;
  product_name: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: string;
  product_icon?: string | null;
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

    // Create transaction (Supabase will store in UTC automatically)
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

      // Update product stock - fetch current stock first
      const { data: currentProduct, error: fetchError } = await supabase
        .from("products")
        .select("stock_quantity")
        .eq("id", item.product_id)
        .single();

      if (fetchError) {
        console.error("Error fetching product stock:", fetchError);
        continue; // Continue with other items even if one fails
      }

      if (currentProduct) {
        const newStock = Math.max(0, currentProduct.stock_quantity - item.quantity);
        const { error: updateError } = await supabase
          .from("products")
          .update({ stock_quantity: newStock })
          .eq("id", item.product_id);

        if (updateError) {
          console.error("Error updating stock:", updateError);
        } else {
          console.log(`Updated stock for product ${item.product_id}: ${currentProduct.stock_quantity} -> ${newStock}`);
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

/**
 * Fetch transactions list ordered by newest first with optional filters
 */
export async function fetchTransactions(options?: {
  search?: string;
  paymentMethod?: string | null;
  from?: string | null; // ISO date
  to?: string | null;   // ISO date
}): Promise<Transaction[]> {
  const supabase = await createClient();

  try {
    let query = supabase
      .from("transactions")
      .select(
        "id, created_at, subtotal, tax_amount, total_amount, payment_method, status, cashier_name, receipt_number"
      )
      .order("created_at", { ascending: false });

    if (options?.paymentMethod && options.paymentMethod !== "All") {
      query = query.eq("payment_method", options.paymentMethod);
    }

    if (options?.from) {
      query = query.gte("created_at", options.from);
    }

    if (options?.to) {
      query = query.lte("created_at", options.to);
    }

    if (options?.search && options.search.trim().length > 0) {
      const s = options.search.trim();
      // Try to match by receipt_number or id
      query = query.or(`receipt_number.ilike.%${s}%,id.eq.${s}`);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Error fetching transactions:", error);
      return [];
    }

    return (data || []) as Transaction[];
  } catch (err) {
    console.error("Unexpected error fetching transactions:", err);
    return [];
  }
}

/**
 * Fetch items for a specific transaction (joins product icon)
 */
export async function fetchTransactionItems(transactionId: string): Promise<TransactionItem[]> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("transaction_items")
      .select(
        `id, transaction_id, product_id, product_name, quantity, unit_price, subtotal, created_at, products:products(icon)`
      )
      .eq("transaction_id", transactionId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching transaction items:", error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      transaction_id: row.transaction_id,
      product_id: row.product_id,
      product_name: row.product_name ?? null,
      quantity: row.quantity,
      unit_price: row.unit_price,
      subtotal: row.subtotal,
      created_at: row.created_at,
      product_icon: row.products?.icon ?? null,
    })) as TransactionItem[];
  } catch (err) {
    console.error("Unexpected error fetching transaction items:", err);
    return [];
  }
}

/**
 * Get total items count (sum of quantity) per transaction for a set of ids
 */
export async function getItemsCountForTransactions(transactionIds: string[]) {
  const supabase = await createClient();
  if (!transactionIds || transactionIds.length === 0) return {} as Record<string, number>;

  try {
    const { data, error } = await supabase
      .from("transaction_items")
      .select("transaction_id, quantity")
      .in("transaction_id", transactionIds);

    if (error) {
      console.error("Error fetching items count:", error);
      return {} as Record<string, number>;
    }

    const counts: Record<string, number> = {};
    (data || []).forEach((row: any) => {
      counts[row.transaction_id] = (counts[row.transaction_id] || 0) + (row.quantity || 0);
    });
    return counts;
  } catch (err) {
    console.error("Unexpected error counting items:", err);
    return {} as Record<string, number>;
  }
}
