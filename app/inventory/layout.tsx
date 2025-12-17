import React from "react";
import "./styles.css";
import Link from "next/link";

export const metadata = {
  title: "Inventory Management - ShopSmart",
};

export default function InventoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="inventory-root">
      <header className="inventory-header">
        <div className="inventory-header-left">
          <Link href="/mainpos">◀</Link>
        </div>
        <div className="inventory-header-title">Inventory Management</div>
        <div className="inventory-header-right spaced-header-btns">
          <Link href="/settings" className="header-btn">
            Settings
          </Link>
          <Link href="/analytics" className="header-btn">
            Analytics
          </Link>
        </div>
      </header>

      <main className="inventory-content">{children}</main>
    </div>
  );
}
