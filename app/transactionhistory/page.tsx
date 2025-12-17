"use client";

import React from "react";
import { Search, CreditCard, CalendarDays, Filter } from "lucide-react";
import "./styles.css";

type Transaction = {
  id: string;
  date: string; // ISO string
  items: number;
  amount: string;
  payment: "Cash" | "Gcash";
};

const transactions: Transaction[] = [
  {
    id: "TRX-1001",
    date: "2024-12-17T09:15:00",
    items: 5,
    amount: "₱125.50",
    payment: "Cash",
  },
  {
    id: "TRX-1002",
    date: "2024-12-17T11:10:00",
    items: 3,
    amount: "₱67.25",
    payment: "Gcash",
  },
  {
    id: "TRX-1003",
    date: "2024-12-15T16:35:00",
    items: 8,
    amount: "₱234.00",
    payment: "Cash",
  },
  {
    id: "TRX-1004",
    date: "2024-12-12T14:20:00",
    items: 2,
    amount: "₱45.50",
    payment: "Gcash",
  },
  {
    id: "TRX-1005",
    date: "2024-11-28T10:05:00",
    items: 12,
    amount: "₱567.75",
    payment: "Cash",
  },
  {
    id: "TRX-1006",
    date: "2024-07-08T18:42:00",
    items: 6,
    amount: "₱189.00",
    payment: "Gcash",
  },
];

function formatDateTime(isoDate: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(isoDate));
}

function withinDateRange(isoDate: string, filter: string) {
  if (filter === "all") return true;
  const date = new Date(isoDate);
  const now = new Date();

  switch (filter) {
    case "today": {
      return (
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth() &&
        date.getDate() === now.getDate()
      );
    }
    case "week": {
      const current = new Date(now);
      const day = current.getDay();
      const diffToMonday = (day === 0 ? -6 : 1) - day; // start week on Monday
      const startOfWeek = new Date(
        current.setDate(current.getDate() + diffToMonday)
      );
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);
      return date >= startOfWeek && date < endOfWeek;
    }
    case "month": {
      return (
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth()
      );
    }
    case "year": {
      return date.getFullYear() === now.getFullYear();
    }
    default:
      return true;
  }
}

export default function TransactionHistoryPage() {
  const [search, setSearch] = React.useState("");
  const [paymentFilter, setPaymentFilter] = React.useState("all");
  const [dateFilter, setDateFilter] = React.useState("all");

  const filteredTransactions = React.useMemo(() => {
    const query = search.trim().toLowerCase();

    return transactions.filter((trx) => {
      const matchesSearch =
        query.length === 0 ||
        trx.id.toLowerCase().includes(query) ||
        trx.payment.toLowerCase().includes(query);

      const matchesPayment =
        paymentFilter === "all" || trx.payment.toLowerCase() === paymentFilter;

      const matchesDate = withinDateRange(trx.date, dateFilter);

      return matchesSearch && matchesPayment && matchesDate;
    });
  }, [search, paymentFilter, dateFilter]);

  return (
    <div className="th-page">
      <section className="th-filters">
        <div className="th-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by transaction ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="th-filter-group">
          <div className="th-select">
            <CreditCard size={14} />
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
            >
              <option value="all">All Payment Methods</option>
              <option value="cash">Cash</option>
              <option value="gcash">Gcash</option>
            </select>
          </div>
          <div className="th-select">
            <CalendarDays size={14} />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
          <button className="th-filter-btn">
            <Filter size={14} />
            Export
          </button>
        </div>
      </section>

      <section className="th-table-card">
        <div className="th-table-headings">
          <div>Transaction ID</div>
          <div>Date & Time</div>
          <div>Items</div>
          <div>Amount</div>
          <div>Payment</div>
          <div className="th-actions-col">Action</div>
        </div>
        <div className="th-table-body">
          {filteredTransactions.map((trx) => (
            <div key={trx.id} className="th-row">
              <div className="th-cell strong">{trx.id}</div>
              <div className="th-cell">{formatDateTime(trx.date)}</div>
              <div className="th-cell">{trx.items} items</div>
              <div className="th-cell">{trx.amount}</div>
              <div className="th-cell">
                <span className={`pill pill-${trx.payment.toLowerCase()}`}>
                  {trx.payment}
                </span>
              </div>
              <div className="th-cell th-actions-col">
                <button className="th-link">View Details</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
