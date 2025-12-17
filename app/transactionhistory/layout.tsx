import React from "react";
import Link from "next/link";
import { ArrowLeft, Receipt } from "lucide-react";
import "./styles.css";

export default function TransactionHistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="th-root">
      <header className="th-header">
        <div className="th-header-content">
          <div className="th-header-left">
            <Receipt size={24} />
            <div>
              <h1 className="th-title">Transaction History</h1>
              <p className="th-subtitle">Track recent sales and payments</p>
            </div>
          </div>
          <Link href="/mainpos" className="th-back-btn">
            <ArrowLeft size={16} />
            Back to POS
          </Link>
        </div>
      </header>
      <main className="th-main">{children}</main>
    </div>
  );
}
