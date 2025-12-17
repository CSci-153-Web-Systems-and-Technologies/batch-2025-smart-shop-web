import React from "react";
import Link from "next/link";
import "./styles.css";

export const metadata = {
  title: "Payment - ShopSmart",
};

import { CreditCard } from "lucide-react";

export default function PaymentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="payment-root">
      <header className="payment-header">
        <div className="payment-header-left">
          <div className="logo">ShopSmart</div>
        </div>
        <div className="payment-header-center">
          <div className="payment-indicator">
            <CreditCard className="inline" size={20} /> Payment
          </div>
        </div>
        <div className="payment-header-right">
          <Link href="/settings" className="header-btn">
            Settings
          </Link>
          <Link href="/analytics" className="header-btn">
            Analytics
          </Link>
        </div>
      </header>

      <main className="payment-content">{children}</main>
    </div>
  );
}
