"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Trophy,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Loader,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import {
  fetchAnalyticsMetrics,
  fetchRevenueChartData,
  fetchTopSellingProducts,
  fetchSlowMovingItems,
  type AnalyticsMetric,
  type RevenueChartPoint,
  type TopSellingProduct,
  type SlowMovingItem,
} from "@/lib/analytics-service";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import "./styles.css";

type Period = "today" | "week" | "month" | "year";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-PH").format(Math.round(value));
}

function calculateGrowth(
  current: number,
  previous: number
): { percentage: number; isPositive: boolean } {
  if (previous === 0) return { percentage: 0, isPositive: current >= 0 };
  const pct = ((current - previous) / previous) * 100;
  return { percentage: pct, isPositive: pct >= 0 };
}

function getPeriodLabel(period: Period): string {
  const labels: Record<Period, string> = {
    today: "Today",
    week: "This Week",
    month: "This Month",
    year: "This Year",
  };
  return labels[period];
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("month");
  const [metrics, setMetrics] = useState<{
    current: AnalyticsMetric;
    previous: AnalyticsMetric;
  } | null>(null);
  const [chartData, setChartData] = useState<RevenueChartPoint[]>([]);
  const [topProducts, setTopProducts] = useState<TopSellingProduct[]>([]);
  const [slowItems, setSlowItems] = useState<SlowMovingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [periodTarget, setPeriodTarget] = useState<HTMLElement | null>(null);

  const supabase = useRef(createClient());

  const loadData = useCallback(async (selectedPeriod: Period) => {
    setLoading(true);
    setError("");
    try {
      const [metricsData, chartDataResp, topProductsResp, slowItemsResp] =
        await Promise.all([
          fetchAnalyticsMetrics(selectedPeriod),
          fetchRevenueChartData(selectedPeriod),
          fetchTopSellingProducts(selectedPeriod),
          fetchSlowMovingItems(),
        ]);

      setMetrics(metricsData);
      setChartData(chartDataResp);
      setTopProducts(topProductsResp);
      setSlowItems(slowItemsResp);
    } catch (err) {
      setError("Failed to load analytics data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(period);
  }, [period, loadData]);

  useEffect(() => {
    const target = document.getElementById("analytics-period-buttons");
    setPeriodTarget(target);
  }, []);

  useEffect(() => {
    const channel = supabase.current
      .channel("analytics-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "transactions" },
        () => loadData(period)
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "transaction_items" },
        () => loadData(period)
      )
      .subscribe();

    return () => {
      supabase.current.removeChannel(channel);
    };
  }, [loadData, period]);

  if (error && !loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#d32f2f" }}>
        <p>{error}</p>
        <button
          onClick={() => loadData(period)}
          style={{
            marginTop: "1rem",
            padding: "0.5rem 1rem",
            background: "#6f5ce9",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  const growth = {
    revenue: metrics
      ? calculateGrowth(
          metrics.current.total_revenue,
          metrics.previous.total_revenue
        )
      : { percentage: 0, isPositive: false },
    transactions: metrics
      ? calculateGrowth(
          metrics.current.transaction_count,
          metrics.previous.transaction_count
        )
      : { percentage: 0, isPositive: false },
    avgSale: metrics
      ? calculateGrowth(metrics.current.avg_sale, metrics.previous.avg_sale)
      : { percentage: 0, isPositive: false },
    customers: metrics
      ? calculateGrowth(
          metrics.current.unique_customers,
          metrics.previous.unique_customers
        )
      : { percentage: 0, isPositive: false },
  };

  return (
    <div className="analytics-page">
      {periodTarget
        ? createPortal(
            <div className="period-buttons">
              {(["today", "week", "month", "year"] as Period[]).map((p) => (
                <button
                  key={p}
                  className={`period-btn ${period === p ? "active" : ""}`}
                  onClick={() => setPeriod(p)}
                >
                  {getPeriodLabel(p)}
                </button>
              ))}
            </div>,
            periodTarget
          )
        : null}

      {/* Metrics Cards */}
      <div className="metrics-grid">
        {/* Total Revenue */}
        <div className="metric-card metric-blue">
          <div className="metric-label">TOTAL REVENUE</div>
          <div className="metric-value">
            {loading ? (
              <Loader size={20} className="animate-spin" />
            ) : (
              formatCurrency(metrics?.current.total_revenue || 0)
            )}
          </div>
          {metrics && (
            <div className="metric-change">
              <span
                style={{
                  color: growth.revenue.isPositive ? "#4caf50" : "#f44336",
                }}
              >
                {growth.revenue.isPositive ? "+" : ""}
                {growth.revenue.percentage.toFixed(1)}% from last{" "}
                {period === "today"
                  ? "day"
                  : period === "week"
                    ? "week"
                    : period === "month"
                      ? "month"
                      : "year"}
              </span>
            </div>
          )}
        </div>

        {/* Transactions */}
        <div className="metric-card metric-teal">
          <div className="metric-label">TRANSACTIONS</div>
          <div className="metric-value">
            {loading ? (
              <Loader size={20} className="animate-spin" />
            ) : (
              formatNumber(metrics?.current.transaction_count || 0)
            )}
          </div>
          {metrics && (
            <div className="metric-change">
              <span
                style={{
                  color: growth.transactions.isPositive ? "#4caf50" : "#f44336",
                }}
              >
                {growth.transactions.isPositive ? "+" : ""}
                {growth.transactions.percentage.toFixed(1)}% from last{" "}
                {period === "today"
                  ? "day"
                  : period === "week"
                    ? "week"
                    : period === "month"
                      ? "month"
                      : "year"}
              </span>
            </div>
          )}
        </div>

        {/* Avg Sale */}
        <div className="metric-card metric-orange">
          <div className="metric-label">AVG. SALE</div>
          <div className="metric-value">
            {loading ? (
              <Loader size={20} className="animate-spin" />
            ) : (
              formatCurrency(metrics?.current.avg_sale || 0)
            )}
          </div>
          {metrics && (
            <div className="metric-change">
              <span
                style={{
                  color: growth.avgSale.isPositive ? "#4caf50" : "#f44336",
                }}
              >
                {growth.avgSale.isPositive ? "+" : ""}
                {growth.avgSale.percentage.toFixed(1)}% from last{" "}
                {period === "today"
                  ? "day"
                  : period === "week"
                    ? "week"
                    : period === "month"
                      ? "month"
                      : "year"}
              </span>
            </div>
          )}
        </div>

        {/* Customers */}
        <div className="metric-card metric-pink">
          <div className="metric-label">CUSTOMERS</div>
          <div className="metric-value">
            {loading ? (
              <Loader size={20} className="animate-spin" />
            ) : (
              formatNumber(metrics?.current.unique_customers || 0)
            )}
          </div>
          {metrics && (
            <div className="metric-change">
              <span
                style={{
                  color: growth.customers.isPositive ? "#4caf50" : "#f44336",
                }}
              >
                {growth.customers.isPositive ? "+" : ""}
                {growth.customers.percentage.toFixed(1)}% from last{" "}
                {period === "today"
                  ? "day"
                  : period === "week"
                    ? "week"
                    : period === "month"
                      ? "month"
                      : "year"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="chart-container">
        <div className="chart-header">
          <h2>Revenue Overview</h2>
          {chartData.length > 1 && (
            <div className="chart-trend">
              {(chartData[chartData.length - 1].revenue -
                chartData[0].revenue) /
                (chartData[0].revenue || 1) >
              0 ? (
                <TrendingUp size={16} color="#4caf50" />
              ) : (
                <TrendingDown size={16} color="#f44336" />
              )}
              <span>
                Trending{" "}
                {(chartData[chartData.length - 1].revenue -
                  chartData[0].revenue) /
                  (chartData[0].revenue || 1) >
                0
                  ? "up"
                  : "down"}{" "}
                by{" "}
                {Math.abs(
                  ((chartData[chartData.length - 1].revenue -
                    chartData[0].revenue) /
                    (chartData[0].revenue || 1)) *
                    100
                ).toFixed(1)}
                %
              </span>
            </div>
          )}
        </div>
        {loading ? (
          <div
            style={{
              height: "400px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Loader className="animate-spin" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B9CFF" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#8B9CFF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="period"
                stroke="#999"
                style={{ fontSize: "12px" }}
              />
              <YAxis stroke="#999" style={{ fontSize: "12px" }} />
              <Tooltip
                contentStyle={{
                  background: "#fff",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                }}
                formatter={(value: any) => `₱${Number(value || 0).toFixed(0)}`}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#8B9CFF"
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top Products & Slow Items */}
      <div className="analytics-grid">
        {/* Top Products */}
        <div className="card top-products-card">
          <div className="card-header">
            <Trophy size={20} /> Top Selling Products
          </div>
          <div className="card-subtitle">
            Best performers {getPeriodLabel(period).toLowerCase()}
          </div>

          {loading ? (
            <div
              style={{
                padding: "2rem",
                textAlign: "center",
                color: "#999",
              }}
            >
              <Loader className="animate-spin" />
            </div>
          ) : topProducts.length === 0 ? (
            <div
              style={{
                padding: "2rem",
                textAlign: "center",
                color: "#999",
              }}
            >
              No sales data available
            </div>
          ) : (
            <ul className="top-list">
              {topProducts.map((product, idx) => (
                <li key={product.product_name} className="top-item">
                  <div className="rank-badge">{idx + 1}</div>
                  <div className="product-info">
                    <div className="product-name">{product.product_name}</div>
                    <div className="product-category">
                      {product.category_name}
                    </div>
                  </div>
                  <div className="product-stats">
                    <div className="qty-sold">
                      {formatNumber(product.total_sold)} sold
                    </div>
                    <div className="revenue-amount">
                      {formatCurrency(product.total_revenue)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Slow Items */}
        <div className="card slow-items-card">
          <div className="card-header">
            <AlertTriangle size={20} /> Slow Moving Items
          </div>
          <div className="card-subtitle">No sales in the last 30 days</div>

          {loading ? (
            <div
              style={{
                padding: "2rem",
                textAlign: "center",
                color: "#999",
              }}
            >
              <Loader className="animate-spin" />
            </div>
          ) : slowItems.length === 0 ? (
            <div
              style={{
                padding: "2rem",
                textAlign: "center",
                color: "#999",
              }}
            >
              No slow moving items
            </div>
          ) : (
            <ul className="slow-list">
              {slowItems.map((item) => (
                <li key={item.product_name} className="slow-item">
                  <div className="slow-left">
                    <div className="slow-name">{item.product_name}</div>
                    <div className="slow-days">
                      {item.days_without_sales} days since last sale
                    </div>
                  </div>
                  <div className="slow-right">
                    <div className="stock-amount">
                      {formatNumber(item.stock_quantity)} units
                    </div>
                    <div className="stock-label">in stock</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
