"use client";

import React, { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import {
  fetchTransactionItems,
  type Transaction,
  type TransactionItem,
} from "@/lib/pos-service";

interface Props {
  open: boolean;
  transaction: Transaction | null;
  onClose: () => void;
}

export default function TransactionDetailsModal({
  open,
  transaction,
  onClose,
}: Props) {
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !transaction) return;
    setLoading(true);
    setError("");
    fetchTransactionItems(transaction.id)
      .then(setItems)
      .catch((e) => setError(e?.message || "Failed to load items"))
      .finally(() => setLoading(false));
  }, [open, transaction]);

  const total = useMemo(() => transaction?.total_amount ?? 0, [transaction]);

  if (!open || !transaction) return null;

  return (
    <div className="th-modal-overlay" onClick={onClose}>
      <div className="th-modal" onClick={(e) => e.stopPropagation()}>
        <div className="th-modal-header">
          <h3>Transaction Details</h3>
          <button
            className="th-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="th-modal-body">
          <div className="th-modal-grid">
            <div>
              <label>Transaction ID</label>
              <div>{transaction.receipt_number || transaction.id}</div>
            </div>
            <div>
              <label>Date & Time</label>
              <div>
                {new Date(transaction.created_at).toLocaleString("en-PH", {
                  timeZone: "Asia/Manila",
                })}
              </div>
            </div>
            <div>
              <label>Payment Method</label>
              <div>{transaction.payment_method}</div>
            </div>
            <div>
              <label>Status</label>
              <div className="pill cash" style={{ display: "inline-flex" }}>
                {transaction.status}
              </div>
            </div>
          </div>

          <div className="th-modal-table-wrap">
            <table className="th-modal-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={4}>Loading items…</td>
                  </tr>
                )}
                {!loading && error && (
                  <tr>
                    <td colSpan={4} style={{ color: "#ef4444" }}>
                      {error}
                    </td>
                  </tr>
                )}
                {!loading && !error && items.length === 0 && (
                  <tr>
                    <td colSpan={4}>No items found.</td>
                  </tr>
                )}
                {!loading &&
                  !error &&
                  items.map((it) => (
                    <tr key={it.id}>
                      <td>{it.product_name ?? it.product_id}</td>
                      <td>{it.quantity}</td>
                      <td>₱{it.unit_price.toFixed(2)}</td>
                      <td>₱{it.subtotal.toFixed(2)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
            <div className="th-modal-summary">
              Total Amount <strong>₱{total.toFixed(2)}</strong>
            </div>
          </div>
        </div>

        <div className="th-modal-footer">
          <button className="th-modal-close-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
      <style jsx global>{`
        .th-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.55);
          backdrop-filter: blur(3px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .th-modal {
          width: min(880px, 94vw);
          background: #fff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.2);
        }
        .th-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 18px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #fff;
        }
        .th-modal-header h3 {
          margin: 0;
          font-weight: 800;
        }
        .th-modal-close {
          background: rgba(255, 255, 255, 0.15);
          border: none;
          border-radius: 10px;
          color: #fff;
          cursor: pointer;
          padding: 8px;
        }
        .th-modal-body {
          padding: 16px;
        }
        .th-modal-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 10px;
        }
        .th-modal-grid label {
          display: block;
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 6px;
          font-weight: 700;
        }
        .th-modal-table-wrap {
          margin-top: 6px;
        }
        .th-modal-table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #eef;
          border-radius: 12px;
          overflow: hidden;
        }
        .th-modal-table th {
          background: rgba(0, 0, 0, 0.02);
          text-align: left;
          padding: 10px;
        }
        .th-modal-table td {
          padding: 10px;
          border-bottom: 1px solid #f1f5f9;
        }
        .th-modal-summary {
          display: flex;
          justify-content: flex-end;
          margin-top: 10px;
          font-weight: 800;
        }
        .th-modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          padding: 14px 18px;
          background: #fff;
        }
        .th-modal-close-btn {
          padding: 10px 14px;
          border-radius: 10px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          color: #fff;
          cursor: pointer;
          font-weight: 800;
        }
        @media (max-width: 800px) {
          .th-modal-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
      `}</style>
    </div>
  );
}
