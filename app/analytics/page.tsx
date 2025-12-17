"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { Trophy, AlertTriangle, BarChart3 } from "lucide-react";
const RevenueChart = dynamic(
  () =>
    import("@/app/components/charts/RevenueChart").then((mod) => ({
      default: mod.RevenueChart,
    })),
  {
    ssr: false,
  }
);

const topProducts = [
  {
    rank: 1,
    name: "Coca Cola 330ml",
    qty: 342,
    sales: "₱855.00",
    category: "Beverages",
  },
  {
    rank: 2,
    name: "Bottled Water 1.5L",
    qty: 289,
    sales: "₱289.00",
    category: "Beverages",
  },
  {
    rank: 3,
    name: "White Bread Loaf",
    qty: 256,
    sales: "$768.00",
    category: "Groceries",
  },
  {
    rank: 4,
    name: "Chocolate Cookies",
    qty: 234,
    sales: "₱643.50",
    category: "Snacks",
  },
  {
    rank: 5,
    name: "Fresh Milk 1L",
    qty: 198,
    sales: "₱891.00",
    category: "Beverages",
  },
];

const slowItems = [
  { name: "Instant Coffee Premium", days: 47, stock: 34 },
  { name: "Strawberry Jam", days: 38, stock: 28 },
  { name: "Organic Honey 500g", days: 35, stock: 19 },
  { name: "Imported Pasta", days: 32, stock: 41 },
  { name: "Gourmet Chocolate Bar", days: 31, stock: 15 },
];

export default function AnalyticsPage() {
  const [dateFilter, setDateFilter] = useState("month");

  React.useEffect(() => {
    const handlePeriodChange = (e: Event) => {
      const period = (e as CustomEvent<string>).detail;
      setDateFilter(period);
    };
    window.addEventListener(
      "analytics:periodChange",
      handlePeriodChange as EventListener
    );
    return () => {
      window.removeEventListener(
        "analytics:periodChange",
        handlePeriodChange as EventListener
      );
    };
  }, []);

  // Calculate metrics based on date filter
  const getMetrics = () => {
    const baseMetrics = {
      today: [
        {
          label: "TOTAL REVENUE",
          value: "₱5,234",
          change: "12.5% from yesterday",
          color: "blue" as const,
        },
        {
          label: "TRANSACTIONS",
          value: "287",
          change: "5.2% from yesterday",
          color: "teal" as const,
        },
        {
          label: "AVG. SALE",
          value: "₱18.23",
          change: "2.1% from yesterday",
          color: "orange" as const,
        },
        {
          label: "CUSTOMERS",
          value: "156",
          change: "8.3% from yesterday",
          color: "pink" as const,
        },
      ],
      week: [
        {
          label: "TOTAL REVENUE",
          value: "₱32,145",
          change: "9.8% from last week",
          color: "blue" as const,
        },
        {
          label: "TRANSACTIONS",
          value: "892",
          change: "6.4% from last week",
          color: "teal" as const,
        },
        {
          label: "AVG. SALE",
          value: "₱36.05",
          change: "3.2% from last week",
          color: "orange" as const,
        },
        {
          label: "CUSTOMERS",
          value: "623",
          change: "10.5% from last week",
          color: "pink" as const,
        },
      ],
      month: [
        {
          label: "TOTAL REVENUE",
          value: "₱24,567",
          change: "12.5% from last month",
          color: "blue" as const,
        },
        {
          label: "TRANSACTIONS",
          value: "1,248",
          change: "8.3% from last month",
          color: "teal" as const,
        },
        {
          label: "AVG. SALE",
          value: "₱19.68",
          change: "3.8% from last month",
          color: "orange" as const,
        },
        {
          label: "CUSTOMERS",
          value: "892",
          change: "15.2% from last month",
          color: "pink" as const,
        },
      ],
      year: [
        {
          label: "TOTAL REVENUE",
          value: "₱287,654",
          change: "18.7% from last year",
          color: "blue" as const,
        },
        {
          label: "TRANSACTIONS",
          value: "14,892",
          change: "22.1% from last year",
          color: "teal" as const,
        },
        {
          label: "AVG. SALE",
          value: "₱19.31",
          change: "5.2% from last year",
          color: "orange" as const,
        },
        {
          label: "CUSTOMERS",
          value: "8,234",
          change: "25.8% from last year",
          color: "pink" as const,
        },
      ],
    };
    return (
      baseMetrics[dateFilter as keyof typeof baseMetrics] || baseMetrics.month
    );
  };

  const metrics = getMetrics();
  return (
    <div>
      {/* Metrics Cards */}
      <div className="metrics-grid">
        {metrics.map(
          (m: {
            label: string;
            value: string;
            change: string;
            color: string;
          }) => (
            <div key={m.label} className={`metric-card metric-${m.color}`}>
              <div className="metric-label">{m.label}</div>
              <div className="metric-value">{m.value}</div>
              <div className="metric-change">{m.change}</div>
            </div>
          )
        )}
      </div>

      {/* Revenue Overview */}
      <RevenueChart />

      {/* Top Products & Slow Items */}
      <div className="analytics-grid">
        <section className="card top-products">
          <div className="card-header">
            <Trophy className="inline mr-2" size={20} /> Top Selling Products
          </div>
          <div className="card-sub">Best performers this month</div>

          <ul className="top-list">
            {topProducts.map((p) => (
              <li key={p.rank} className="top-item">
                <div className="rank">{p.rank}</div>
                <div className="info">
                  <div className="name">{p.name}</div>
                  <div className="muted">{p.category}</div>
                </div>
                <div className="meta">
                  <div className="qty">{p.qty} sold</div>
                  <div className="sales">{p.sales}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="card slow-items">
          <div className="card-header">
            <AlertTriangle className="inline mr-2" size={20} /> Slow Moving
            Items
          </div>
          <div className="card-sub">No sales in the last 30 days</div>

          <ul className="slow-list">
            {slowItems.map((s) => (
              <li key={s.name} className="slow-item">
                <div className="slow-left">
                  <div className="slow-name">{s.name}</div>
                  <div className="muted">{s.days} days since last sale</div>
                </div>
                <div className="slow-right">
                  {s.stock} units
                  <br />
                  <span className="muted">in stock</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
