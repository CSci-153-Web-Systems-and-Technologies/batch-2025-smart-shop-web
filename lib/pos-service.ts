"use server";

import { createDefaultCategoriesForUser, getCurrentUserId } from "@/lib/auth";
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

// Inventory types
export interface InventoryProduct {
  id: string;
  name: string;
  price: number;
  category_id: string;
  stock_quantity: number;
  reorder_level: number;
  icon: string | null;
  sku: string;
  is_active: boolean;
  category_name?: string;
}

export interface InventoryStats {
  total: number;
  low: number;
  out: number;
  value: number;
}

/**
 * Fetch all active products with category information
 */
export async function fetchProducts(): Promise<Product[]> {
  const supabase = await createClient();

  try {
    const userId = await getCurrentUserId(supabase);
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
      .eq("user_id", userId)
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
    if ((error as Error)?.message === "User not authenticated") {
      return [];
    }
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
    const userId = await getCurrentUserId(supabase);
    const { data, error } = await supabase
      .from("categories")
      .select("id, name")
      .order("name");

    if (error) {
      console.error("Error fetching categories:", error);
      return [];
    }
    if (!data || data.length === 0) {
      await createDefaultCategoriesForUser(userId);
      const { data: seeded } = await supabase
        .from("categories")
        .select("id, name")
        .order("name");
      return seeded || [];
    }

    return data;
  } catch (error) {
    if ((error as Error)?.message === "User not authenticated") {
      return [];
    }
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
    const userId = await getCurrentUserId(supabase);

    // Get user profile for cashier name
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .single();

    const cashierName = profile?.full_name || "Unknown";

    // Generate unique receipt number
    const receiptNumber = `RCP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create transaction (Supabase will store in UTC automatically)
    const { data: transaction, error: transactionError } = await supabase
      .from("transactions")
      .insert({
        user_id: userId,
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

    // Track stock updates to allow rollback on failure
    const updatedStocks: Array<{ product_id: string; previous: number; next: number }> = [];

    // Insert transaction items and update stock
    for (const item of items) {
      // Insert transaction item
      const { error: itemError } = await supabase
        .from("transaction_items")
        .insert({
          transaction_id: transaction.id,
          user_id: userId,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal: item.subtotal,
        });

      if (itemError) {
        console.error("Error inserting transaction item:", itemError);
        // Rollback: delete any items inserted for this transaction, revert stock, and remove transaction
        try {
          await supabase
            .from("transaction_items")
            .delete()
            .eq("transaction_id", transaction.id)
            .eq("user_id", userId);

          // Revert stock for previously updated products
          for (const s of updatedStocks) {
            await supabase
              .from("products")
              .update({ stock_quantity: s.previous })
              .eq("id", s.product_id)
              .eq("user_id", userId);
          }

          // Delete the created transaction record so it won't appear as 0 items
          await supabase
            .from("transactions")
            .delete()
            .eq("id", transaction.id)
            .eq("user_id", userId);
        } catch (rbErr) {
          console.error("Rollback after item insert failure encountered an error:", rbErr);
        }
        return { error: `Failed to save transaction items: ${itemError.message ?? "Unknown error"}` };
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
        const { data: _, error: updateError } = await supabase
          .from("products")
          .update({ stock_quantity: newStock })
          .eq("id", item.product_id);

        if (updateError) {
          console.error("Error updating stock:", updateError);
        } else {
          console.log(`Updated stock for product ${item.product_id}: ${currentProduct.stock_quantity} -> ${newStock}`);
          updatedStocks.push({ product_id: item.product_id, previous: currentProduct.stock_quantity, next: newStock });
        }
      }
    }

    return {
      success: true,
      transaction,
      receipt_number: receiptNumber,
    };
  } catch (error) {
    if ((error as Error)?.message === "User not authenticated") {
      return { error: "User not authenticated" };
    }
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

// -------- Inventory helpers --------

export async function fetchInventoryProducts(options?: {
  search?: string;
  filter?: "all" | "in" | "low" | "out";
}): Promise<InventoryProduct[]> {
  const supabase = await createClient();
  try {
    let query = supabase
      .from("products")
      .select(
        `id, name, price, category_id, stock_quantity, reorder_level, icon, sku, is_active, categories(name)`
      )
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (options?.search) {
      query = query.ilike("name", `%${options.search}%`);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Error fetching inventory products:", error);
      return [];
    }

    let products: InventoryProduct[] = (data || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price) || 0,
      category_id: p.category_id,
      stock_quantity: p.stock_quantity ?? 0,
      reorder_level: p.reorder_level ?? 0,
      icon: p.icon,
      sku: p.sku,
      is_active: p.is_active,
      category_name: p.categories?.name || "Uncategorized",
    }));

    if (options?.filter === "low") {
      products = products.filter(
        (p) => p.stock_quantity > 0 && p.stock_quantity < p.reorder_level
      );
    }
    if (options?.filter === "out") {
      products = products.filter((p) => p.stock_quantity === 0);
    }
    if (options?.filter === "in") {
      products = products.filter(
        (p) => p.stock_quantity > 0 && p.stock_quantity >= p.reorder_level
      );
    }

    return products;
  } catch (err) {
    console.error("Unexpected error fetching inventory products:", err);
    return [];
  }
}

export async function fetchInventoryStats(): Promise<InventoryStats> {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from("products")
      .select("price, stock_quantity, reorder_level")
      .eq("is_active", true);

    if (error) {
      console.error("Error fetching inventory stats:", error);
      return { total: 0, low: 0, out: 0, value: 0 };
    }

    const rows = data || [];
    const total = rows.length;
    const low = rows.filter(
      (r) => (r.stock_quantity ?? 0) > 0 && (r.stock_quantity ?? 0) <= (r.reorder_level ?? 0)
    ).length;
    const out = rows.filter((r) => (r.stock_quantity ?? 0) === 0).length;
    const value = rows.reduce(
      (sum, r) => sum + (Number(r.price) || 0) * (r.stock_quantity || 0),
      0
    );

    return { total, low, out, value };
  } catch (err) {
    console.error("Unexpected error fetching inventory stats:", err);
    return { total: 0, low: 0, out: 0, value: 0 };
  }
}

export async function createInventoryProduct(payload: {
  name: string;
  category_id: string;
  stock_quantity: number;
  reorder_level: number;
  price: number;
  icon?: string | null;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const supabase = await createClient();
  try {
    const userId = await getCurrentUserId(supabase);
    const sku = `PRD-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const { error, data } = await supabase
      .from("products")
      .insert({
        user_id: userId,
        name: payload.name,
        category_id: payload.category_id,
        stock_quantity: payload.stock_quantity,
        reorder_level: payload.reorder_level,
        price: payload.price,
        icon: payload.icon || "📦",
        sku,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error creating product:", error);
      return { success: false, error: error.message };
    }
    return { success: true, id: data?.id };
  } catch (err: any) {
    if (err?.message === "User not authenticated") {
      return { success: false, error: "User not authenticated" };
    }
    console.error("Unexpected error creating product:", err);
    return { success: false, error: err?.message || "Unexpected error" };
  }
}

export async function updateInventoryProduct(
  id: string,
  payload: {
    name: string;
    category_id: string;
    stock_quantity: number;
    reorder_level: number;
    price: number;
    icon?: string | null;
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  try {
    const { error } = await supabase
      .from("products")
      .update({
        name: payload.name,
        category_id: payload.category_id,
        stock_quantity: payload.stock_quantity,
        reorder_level: payload.reorder_level,
        price: payload.price,
        icon: payload.icon || "📦",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error("Error updating product:", error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error("Unexpected error updating product:", err);
    return { success: false, error: err?.message || "Unexpected error" };
  }
}

export async function softDeleteInventoryProduct(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  try {
    const { error } = await supabase
      .from("products")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      console.error("Error deleting product:", error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error("Unexpected error deleting product:", err);
    return { success: false, error: err?.message || "Unexpected error" };
  }
}

export async function fetchCategoriesLite(): Promise<Category[]> {
  return fetchCategories();
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
    const userId = await getCurrentUserId(supabase);
    let query = supabase
      .from("transactions")
      .select(
        "id, created_at, subtotal, tax_amount, total_amount, payment_method, status, cashier_name, receipt_number"
      )
      .eq("user_id", userId)
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
    if ((err as Error)?.message === "User not authenticated") {
      return [];
    }
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
    const userId = await getCurrentUserId(supabase);
    const { data, error } = await supabase
      .from("transaction_items")
      .select(
        `id, transaction_id, product_id, product_name, quantity, unit_price, subtotal, created_at, products:products(icon)`
      )
      .eq("transaction_id", transactionId)
      .eq("user_id", userId)
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
    const userId = await getCurrentUserId(supabase);
    const { data, error } = await supabase
      .from("transaction_items")
      .select("transaction_id, quantity")
      .in("transaction_id", transactionIds)
      .eq("user_id", userId);

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
    if ((err as Error)?.message === "User not authenticated") {
      return {} as Record<string, number>;
    }
    console.error("Unexpected error counting items:", err);
    return {} as Record<string, number>;
  }
}

/**
 * Delete specific transactions by ids for current user.
 * Also deletes related transaction_items; returns count deleted.
 */
export async function deleteTransactionsByIds(ids: string[]): Promise<{ success: boolean; deleted?: number; error?: string }> {
  const supabase = await createClient();
  try {
    const userId = await getCurrentUserId(supabase);
    if (!ids || ids.length === 0) return { success: true, deleted: 0 };

    // Delete items first (if FK cascade isn't present)
    const { error: itemsErr } = await supabase
      .from("transaction_items")
      .delete()
      .in("transaction_id", ids)
      .eq("user_id", userId);
    if (itemsErr) {
      console.error("Error deleting transaction items:", itemsErr);
      return { success: false, error: itemsErr.message };
    }

    const { data, error } = await supabase
      .from("transactions")
      .delete()
      .in("id", ids)
      .eq("user_id", userId)
      .select("id");

    if (error) {
      console.error("Error deleting transactions:", error);
      return { success: false, error: error.message };
    }

    return { success: true, deleted: (data || []).length };
  } catch (err: any) {
    if ((err as Error)?.message === "User not authenticated") {
      return { success: false, error: "User not authenticated" };
    }
    console.error("Unexpected error deleting transactions:", err);
    return { success: false, error: err?.message || "Unexpected error" };
  }
}

/**
 * Delete transactions within a date range (inclusive) for current user.
 */
export async function deleteTransactionsByDateRange(fromIso: string, toIso: string): Promise<{ success: boolean; deleted?: number; error?: string }> {
  const supabase = await createClient();
  try {
    const userId = await getCurrentUserId(supabase);

    // Fetch ids first to delete items and return count
    let { data: tx, error: fetchErr } = await supabase
      .from("transactions")
      .select("id")
      .eq("user_id", userId)
      .gte("created_at", fromIso)
      .lte("created_at", toIso);

    if (fetchErr) {
      console.error("Error fetching transactions to delete:", fetchErr);
      return { success: false, error: fetchErr.message };
    }

    const ids = (tx || []).map((r: any) => r.id);
    if (ids.length === 0) return { success: true, deleted: 0 };

    const itemsDel = await supabase
      .from("transaction_items")
      .delete()
      .in("transaction_id", ids)
      .eq("user_id", userId);
    if (itemsDel.error) {
      console.error("Error deleting items for range:", itemsDel.error);
      return { success: false, error: itemsDel.error.message };
    }

    const txDel = await supabase
      .from("transactions")
      .delete()
      .in("id", ids)
      .eq("user_id", userId)
      .select("id");
    if (txDel.error) {
      console.error("Error deleting transactions for range:", txDel.error);
      return { success: false, error: txDel.error.message };
    }
    return { success: true, deleted: (txDel.data || []).length };
  } catch (err: any) {
    if ((err as Error)?.message === "User not authenticated") {
      return { success: false, error: "User not authenticated" };
    }
    console.error("Unexpected error deleting transactions by range:", err);
    return { success: false, error: err?.message || "Unexpected error" };
  }
}
