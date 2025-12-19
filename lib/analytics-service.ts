"use server";

import { getCurrentUserId } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";

export interface AnalyticsMetric {
  total_revenue: number;
  transaction_count: number;
  avg_sale: number;
  unique_customers: number;
}

export interface TopSellingProduct {
  product_name: string;
  icon: string | null;
  category_name: string;
  total_sold: number;
  total_revenue: number;
}

export interface SlowMovingItem {
  product_name: string;
  stock_quantity: number;
  days_without_sales: number;
}

export interface RevenueChartPoint {
  period: string;
  revenue: number;
}

/**
 * Calculate date range for selected period
 */
function getDateRange(
  period: "today" | "week" | "month" | "year",
  offset = 0
) {
  const now = new Date();
  const startDate = new Date(now);

  switch (period) {
    case "today":
      if (offset === 0) {
        startDate.setHours(0, 0, 0, 0);
      } else {
        startDate.setDate(startDate.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
      }
      break;
    case "week":
      const weekDay = startDate.getDay();
      const daysToMonday = (weekDay === 0 ? 6 : weekDay - 1) + offset * 7;
      startDate.setDate(startDate.getDate() - daysToMonday - 6);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "month":
      startDate.setDate(1);
      startDate.setMonth(startDate.getMonth() - offset);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "year":
      startDate.setFullYear(startDate.getFullYear() - offset);
      startDate.setMonth(0, 1);
      startDate.setHours(0, 0, 0, 0);
      break;
  }

  const endDate = new Date(now);
  if (offset > 0) {
    endDate.setHours(23, 59, 59, 999);
  }

  return {
    start: startDate.toISOString(),
    end: endDate.toISOString(),
  };
}

/**
 * Fetch metrics for a given period and compare with previous period
 */
export async function fetchAnalyticsMetrics(
  period: "today" | "week" | "month" | "year"
): Promise<{
  current: AnalyticsMetric;
  previous: AnalyticsMetric;
}> {
  const supabase = await createClient();

  const empty = {
    current: {
      total_revenue: 0,
      transaction_count: 0,
      avg_sale: 0,
      unique_customers: 0,
    },
    previous: {
      total_revenue: 0,
      transaction_count: 0,
      avg_sale: 0,
      unique_customers: 0,
    },
  };

  try {
    const userId = await getCurrentUserId(supabase);
    const currentRange = getDateRange(period, 0);
    const previousRange = getDateRange(period, 1);

    // Fetch current period data
    const { data: currentData, error: currentError } = await supabase
      .from("transactions")
      .select("id, user_id, total_amount")
      .gte("created_at", currentRange.start)
      .lte("created_at", currentRange.end)
      .eq("user_id", userId);

    // Fetch previous period data
    const { data: previousData, error: previousError } = await supabase
      .from("transactions")
      .select("id, user_id, total_amount")
      .gte("created_at", previousRange.start)
      .lte("created_at", previousRange.end)
      .eq("user_id", userId);

    if (currentError || previousError) {
      console.error("Error fetching metrics:", currentError || previousError);
      return empty;
    }

    const calculateMetrics = (transactions: any[]): AnalyticsMetric => {
      const total_revenue = transactions.reduce(
        (sum, t) => sum + (Number(t.total_amount) || 0),
        0
      );
      const transaction_count = transactions.length;
      const avg_sale =
        transaction_count > 0 ? total_revenue / transaction_count : 0;

      const uniqueCustomers = new Set(
        transactions
          .map((t) => t.user_id)
          .filter((id) => id !== null && id !== undefined)
      ).size;

      return {
        total_revenue,
        transaction_count,
        avg_sale,
        unique_customers: uniqueCustomers || transaction_count,
      };
    };

    return {
      current: calculateMetrics(currentData || []),
      previous: calculateMetrics(previousData || []),
    };
  } catch (err) {
    if ((err as Error)?.message === "User not authenticated") {
      return empty;
    }
    console.error("Unexpected error fetching metrics:", err);
    return empty;
  }
}

/**
 * Fetch revenue chart data for selected period
 */
export async function fetchRevenueChartData(
  period: "today" | "week" | "month" | "year"
): Promise<RevenueChartPoint[]> {
  const supabase = await createClient();

  try {
    const userId = await getCurrentUserId(supabase);
    const { start, end } = getDateRange(period, 0);

    const { data, error } = await supabase
      .from("transactions")
      .select("created_at, total_amount")
      .gte("created_at", start)
      .lte("created_at", end)
      .eq("user_id", userId)
      .order("created_at");

    if (error) {
      console.error("Error fetching revenue chart data:", error);
      return [];
    }

    const transactions = data || [];

    // Group by period
    const grouped: Record<string, number> = {};

    transactions.forEach((t: any) => {
      const date = new Date(t.created_at);
      let key = "";

      if (period === "today") {
        // Group by hour: "12 AM", "1 AM", etc.
        const hour = date.getHours();
        const isPM = hour >= 12;
        const displayHour = hour % 12 || 12;
        key = `${displayHour} ${isPM ? "PM" : "AM"}`;
      } else if (period === "week") {
        // Group by day: "Mon", "Tue", etc.
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        key = days[date.getDay()];
      } else if (period === "month") {
        // Group by day of month: "1", "6", "11", etc.
        key = date.getDate().toString();
      } else if (period === "year") {
        // Group by month: "Jan", "Feb", etc.
        const months = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];
        key = months[date.getMonth()];
      }

      grouped[key] = (grouped[key] || 0) + (Number(t.total_amount) || 0);
    });

    // Convert to ordered array
    const result: RevenueChartPoint[] = Object.entries(grouped)
      .map(([period, revenue]) => ({
        period,
        revenue,
      }));

    return result;
  } catch (err) {
    if ((err as Error)?.message === "User not authenticated") {
      return [];
    }
    console.error("Unexpected error fetching revenue chart data:", err);
    return [];
  }
}

/**
 * Fetch top 5 selling products for a period
 */
export async function fetchTopSellingProducts(
  period: "today" | "week" | "month" | "year"
): Promise<TopSellingProduct[]> {
  const supabase = await createClient();

  try {
    const userId = await getCurrentUserId(supabase);
    const { start, end } = getDateRange(period, 0);

    const { data, error } = await supabase
      .from("transaction_items")
      .select(
        `
        product_name,
        quantity,
        subtotal,
        product_id,
        transaction_id,
        transactions(created_at)
      `
      )
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching transaction items:", error);
      return [];
    }

    const items = (data || []).filter((item: any) => {
      const txDate = item.transactions?.created_at;
      if (!txDate) return false;
      return txDate >= start && txDate <= end;
    });

    // Get product details for icons
    const productIds = [...new Set(items.map((i: any) => i.product_id))].filter(
      Boolean
    );

    let productMap: Record<
      string,
      { icon: string | null; category_name: string }
    > = {};

    if (productIds.length > 0) {
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select(
          `
          id,
          icon,
          category_id,
          categories(name)
        `
        )
        .eq("user_id", userId);

      if (!productsError && products) {
        productMap = Object.fromEntries(
          products.map((p: any) => [
            p.id,
            {
              icon: p.icon,
              category_name: p.categories?.name || "Uncategorized",
            },
          ])
        );
      }
    }

    // Group by product name
    const grouped: Record<
      string,
      {
        product_name: string;
        icon: string | null;
        category_name: string;
        total_sold: number;
        total_revenue: number;
      }
    > = {};

    items.forEach((item: any) => {
      const key = item.product_name || "Unknown";
      if (!grouped[key]) {
        const productDetails = productMap[item.product_id] || {
          icon: null,
          category_name: "Uncategorized",
        };
        grouped[key] = {
          product_name: key,
          icon: productDetails.icon,
          category_name: productDetails.category_name,
          total_sold: 0,
          total_revenue: 0,
        };
      }
      grouped[key].total_sold += item.quantity || 0;
      grouped[key].total_revenue += Number(item.subtotal) || 0;
    });

    // Sort by total sold and return top 5
    const sorted = Object.values(grouped)
      .sort((a, b) => b.total_sold - a.total_sold)
      .slice(0, 5);

    return sorted;
  } catch (err) {
    if ((err as Error)?.message === "User not authenticated") {
      return [];
    }
    console.error("Unexpected error fetching top selling products:", err);
    return [];
  }
}

/**
 * Fetch slow moving items (no sales in 30 days)
 */
export async function fetchSlowMovingItems(): Promise<SlowMovingItem[]> {
  const supabase = await createClient();

  try {
    const userId = await getCurrentUserId(supabase);
    // Get all products
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, name, stock_quantity, updated_at")
      .eq("user_id", userId)
      .eq("is_active", true);

    if (productsError) {
      console.error("Error fetching products:", productsError);
      return [];
    }

    // Get products with sales in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentSales, error: salesError } = await supabase
      .from("transaction_items")
      .select("product_id")
      .gte("created_at", thirtyDaysAgo.toISOString())
      .eq("user_id", userId);

    if (salesError) {
      console.error("Error fetching recent sales:", salesError);
      return [];
    }

    const recentProductIds = new Set(
      (recentSales || []).map((item: any) => item.product_id)
    );

    // Filter products without recent sales
    const slowMoving = (products || [])
      .filter((p: any) => !recentProductIds.has(p.id))
      .map((p: any) => {
        const updatedDate = new Date(p.updated_at);
        const today = new Date();
        const daysWithoutSales = Math.floor(
          (today.getTime() - updatedDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        return {
          product_name: p.name,
          stock_quantity: p.stock_quantity || 0,
          days_without_sales: daysWithoutSales,
        };
      })
      .sort((a: any, b: any) => b.days_without_sales - a.days_without_sales)
      .slice(0, 5);

    return slowMoving;
  } catch (err) {
    if ((err as Error)?.message === "User not authenticated") {
      return [];
    }
    console.error("Unexpected error fetching slow moving items:", err);
    return [];
  }
}
