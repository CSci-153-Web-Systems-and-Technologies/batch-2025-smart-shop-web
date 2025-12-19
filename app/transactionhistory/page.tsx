"use client";

import React from "react";
import { Search, CreditCard, CalendarDays, Filter } from "lucide-react";
import "./styles.css";
import {
  fetchTransactions,
  getItemsCountForTransactions,
  deleteTransactionsByIds,
  deleteTransactionsByDateRange,
  type Transaction,
} from "@/lib/pos-service";
import TransactionDetailsModal from "./components/TransactionDetailsModal";
import { createClient } from "@/utils/supabase/client";

function formatDateTime(isoDate: string) {
  // Manually convert UTC to Philippine Time (UTC+8)
  const utcDate = new Date(isoDate);
  const phTime = new Date(utcDate.getTime() + 8 * 60 * 60 * 1000);

  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(phTime);
}

export default function TransactionHistoryPage() {
  const [search, setSearch] = React.useState("");
  const [paymentFilter, setPaymentFilter] = React.useState("all");
  const [dateFilter, setDateFilter] = React.useState("all");
  const [clearPreset, setClearPreset] = React.useState("today");

  const [list, setList] = React.useState<Transaction[]>([]);
  const [itemsCount, setItemsCount] = React.useState<Record<string, number>>(
    {}
  );
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [selected, setSelected] = React.useState<Transaction | null>(null);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [busy, setBusy] = React.useState(false);

  const supabase = React.useRef(createClient());

  // Build date range from UI preset names
  const range = React.useMemo(() => {
    const now = new Date();
    if (dateFilter === "today") {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      return { from: start.toISOString(), to: end.toISOString() };
    }
    if (dateFilter === "week") {
      const current = new Date(now);
      const day = current.getDay();
      const diffToMonday = (day === 0 ? -6 : 1) - day;
      const start = new Date(current.setDate(current.getDate() + diffToMonday));
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 7);
      end.setHours(23, 59, 59, 999);
      return { from: start.toISOString(), to: end.toISOString() };
    }
    if (dateFilter === "month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      return { from: start.toISOString(), to: end.toISOString() };
    }
    if (dateFilter === "year") {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31);
      end.setHours(23, 59, 59, 999);
      return { from: start.toISOString(), to: end.toISOString() };
    }
    return { from: null as string | null, to: null as string | null };
  }, [dateFilter]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const payment =
        paymentFilter === "all"
          ? undefined
          : paymentFilter === "gcash"
            ? "GCash"
            : "Cash";
      const tx = await fetchTransactions({
        search: search.trim() || undefined,
        paymentMethod: payment,
        from: range.from,
        to: range.to,
      });
      setList(tx);
      const ids = tx.map((t) => t.id);
      const counts = await getItemsCountForTransactions(ids);
      setItemsCount(counts);
    } catch (e: any) {
      setError(e?.message || "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    const id = setTimeout(load, 250);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, paymentFilter, range.from, range.to]);

  // realtime updates
  React.useEffect(() => {
    const ch = supabase.current
      .channel("th-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions" },
        load
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transaction_items" },
        load
      )
      .subscribe();
    return () => {
      supabase.current.removeChannel(ch);
    };
  }, []);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds((prev) => {
      if (prev.size === list.length) return new Set();
      return new Set(list.map((t) => t.id));
    });
  }

  async function deleteSelected() {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} selected transaction(s)?`)) return;
    setBusy(true);
    const ids = Array.from(selectedIds);
    const res = await deleteTransactionsByIds(ids);
    if (!res.success) alert(res.error || "Failed to delete");
    setSelectedIds(new Set());
    await load();
    setBusy(false);
  }

  async function clearByPreset(preset: string) {
    const now = new Date();
    let start: Date | null = null;
    let end: Date | null = null;
    if (preset === "today") {
      start = new Date();
      start.setHours(0, 0, 0, 0);
      end = new Date();
      end.setHours(23, 59, 59, 999);
    } else if (preset === "week") {
      const d = new Date(now);
      const day = d.getDay();
      const diffToMonday = (day === 0 ? -6 : 1) - day;
      start = new Date(d.setDate(d.getDate() + diffToMonday));
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(start.getDate() + 7);
      end.setHours(23, 59, 59, 999);
    } else if (preset === "month") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
    } else if (preset === "year") {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31);
      end.setHours(23, 59, 59, 999);
    } else if (preset === "all") {
      start = new Date(2000, 0, 1);
      end = new Date(2100, 0, 1);
    }
    if (!start || !end) return;
    if (!confirm(`Clear transactions for ${preset}? This cannot be undone.`))
      return;
    setBusy(true);
    const res = await deleteTransactionsByDateRange(
      start.toISOString(),
      end.toISOString()
    );
    if (!res.success) alert(res.error || "Failed to clear");
    await load();
    setBusy(false);
  }

  function exportCsv() {
    const header = [
      "Transaction ID",
      "Date & Time",
      "Items",
      "Amount",
      "Payment",
      "Status",
    ];
    const rows = list.map((t) => [
      t.receipt_number || t.id,
      formatDateTime(t.created_at),
      String(itemsCount[t.id] ?? 0),
      (t.total_amount ?? 0).toFixed(2),
      t.payment_method,
      t.status,
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

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
          <button className="th-filter-btn" onClick={exportCsv} disabled={busy}>
            <Filter size={14} />
            Export
          </button>
          <div className="th-select">
            <span style={{ fontSize: 12, fontWeight: 700 }}>Clear</span>
            <select
              value={clearPreset}
              onChange={(e) => setClearPreset(e.target.value)}
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
              <option value="all">All</option>
            </select>
          </div>
          <button
            className="th-filter-btn"
            onClick={() => clearByPreset(clearPreset)}
            disabled={busy}
          >
            Clear
          </button>
          <button
            className="th-filter-btn"
            onClick={deleteSelected}
            disabled={busy || selectedIds.size === 0}
          >
            Delete Selected
          </button>
        </div>
      </section>

      <section className="th-table-card">
        <div className="th-table-headings">
          <div>
            <input
              type="checkbox"
              aria-label="Select all"
              onChange={toggleSelectAll}
              checked={selectedIds.size === list.length && list.length > 0}
            />
          </div>
          <div>Transaction ID</div>
          <div>Date & Time</div>
          <div>Items</div>
          <div>Amount</div>
          <div>Payment</div>
          <div className="th-actions-col">Action</div>
        </div>
        <div className="th-table-body">
          {loading && (
            <div className="th-row">
              <div className="th-cell">Loading…</div>
            </div>
          )}
          {!loading && error && (
            <div className="th-row">
              <div className="th-cell">{error}</div>
            </div>
          )}
          {!loading &&
            !error &&
            list.map((t) => {
              const items = itemsCount[t.id] ?? 0;
              const payment =
                (t.payment_method || "").toLowerCase() === "gcash"
                  ? "gcash"
                  : "cash";
              return (
                <div key={t.id} className="th-row">
                  <div className="th-cell">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(t.id)}
                      onChange={() => toggleSelect(t.id)}
                      aria-label={`Select ${t.receipt_number || t.id}`}
                    />
                  </div>
                  <div className="th-cell strong">
                    {t.receipt_number || t.id}
                  </div>
                  <div className="th-cell">{formatDateTime(t.created_at)}</div>
                  <div className="th-cell">{items} items</div>
                  <div className="th-cell">
                    ₱{(t.total_amount ?? 0).toFixed(2)}
                  </div>
                  <div className="th-cell">
                    <span className={`pill ${payment}`}>
                      {payment === "gcash" ? "Gcash" : "Cash"}
                    </span>
                  </div>
                  <div className="th-cell th-actions-col">
                    <button className="th-link" onClick={() => setSelected(t)}>
                      View Details
                    </button>
                    <button
                      className="th-link"
                      style={{
                        marginLeft: 8,
                        background: "rgba(244,63,94,0.12)",
                        borderColor: "rgba(244,63,94,0.25)",
                        color: "#ef4444",
                      }}
                      onClick={async () => {
                        if (!confirm("Delete this transaction?")) return;
                        setBusy(true);
                        await deleteTransactionsByIds([t.id]);
                        await load();
                        setBusy(false);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </section>

      <TransactionDetailsModal
        open={!!selected}
        transaction={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
