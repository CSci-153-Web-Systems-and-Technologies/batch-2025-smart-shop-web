"use client";

import React from "react";
import Link from "next/link";
import { BarChart3 } from "lucide-react";
import "./styles.css";

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activePeriod, setActivePeriod] = React.useState("month");

  const handlePeriodClick = (period: string) => {
    setActivePeriod(period);
    window.dispatchEvent(
      new CustomEvent("analytics:periodChange", { detail: period })
    );
  };

  return (
    <div className="analytics-root">
      <header className="analytics-header">
        <div className="analytics-header-left">
          <Link href="/mainpos">◀</Link>
        </div>
        <div className="analytics-header-title">
          <BarChart3 size={24} />
          <span>Sales Analytics</span>
        </div>
        <div className="analytics-header-right spaced-header-btns">
          <button
            className={`header-btn ${activePeriod === "today" ? "active" : ""}`}
            onClick={() => handlePeriodClick("today")}
          >
            Today
          </button>
          <button
            className={`header-btn ${activePeriod === "week" ? "active" : ""}`}
            onClick={() => handlePeriodClick("week")}
          >
            Week
          </button>
          <button
            className={`header-btn ${activePeriod === "month" ? "active" : ""}`}
            onClick={() => handlePeriodClick("month")}
          >
            Month
          </button>
          <button
            className={`header-btn ${activePeriod === "year" ? "active" : ""}`}
            onClick={() => handlePeriodClick("year")}
          >
            Year
          </button>
        </div>
      </header>

      <main className="analytics-content">{children}</main>
    </div>
  );
}
