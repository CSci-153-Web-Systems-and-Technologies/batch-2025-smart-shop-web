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
        <div
          className="analytics-header-right"
          id="analytics-period-buttons"
          aria-label="Analytics period filters"
        ></div>
      </header>

      <main className="analytics-content">{children}</main>
    </div>
  );
}
