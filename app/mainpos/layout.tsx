import React from "react";
import Link from "next/link";
import "./styles.css";
import HeaderSearch from "./HeaderSearch";

export const metadata = {
  title: "Main POS - ShopSmart",
};

export default function MainPosLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  // Layout component — remove debug logs
  // Keep the layout minimal and return a valid React element.
  return (
    <div className="mainpos-root">
      <header className="mainpos-header">
        <div className="mainpos-header-left">
          <div className="logo">ShopSmart</div>
        </div>
        <div className="mainpos-header-center">
          <div className="search-area header-search-area">
            {/* HeaderSearch is a client component that keeps query in localStorage and dispatches events */}
            <HeaderSearch />
          </div>
        </div>
        <div className="mainpos-header-right">
          <Link className="header-btn" href="/settings">
            Settings
          </Link>
          <Link className="header-btn" href="/analytics">
            Analytics
          </Link>
          <Link className="header-btn" href="/transactionhistory">
            Transaction History
          </Link>
          <Link className="header-btn" href="/inventory">
            Inventory
          </Link>
        </div>
      </header>

      <main className="mainpos-content">{children}</main>
    </div>
  );
}
