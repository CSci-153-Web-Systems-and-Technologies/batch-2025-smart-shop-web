"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function PaymentWidget() {
  const [amount, setAmount] = useState<string>("");
  const [paymentMode, setPaymentMode] = useState<"Cash" | "GCash">("Cash");
  const router = useRouter();

  function addDigit(d: string) {
    // avoid leading zeros unless decimal
    if (d === ".") {
      if (amount.includes(".")) return;
      setAmount(amount + d || "0.");
      return;
    }
    setAmount((prev) => (prev === "0" ? d : prev + d));
  }

  function clear() {
    setAmount("");
  }

  function backspace() {
    setAmount((prev) => prev.slice(0, -1));
  }

  function complete() {
    alert("Payment completed: " + (amount || "0.00"));
    // redirect to main page
    router.push("/mainpos");
  }

  function formatAmount(v: string) {
    if (!v) return "₱0.00";
    // keep simple: treat value as a plain decimal
    let n = parseFloat(v);
    if (isNaN(n)) n = 0;
    return n.toLocaleString(undefined, {
      style: "currency",
      currency: "PHP",
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    });
  }

  return (
    <div className="payment-widget">
      <div className="left-action">
        <Link href="/mainpos">Go Back</Link>
      </div>

      <div className="payment-center">
        <div className="payment-total">
          <div className="row">
            <div className="label">Total Amount</div>
            <div className="amount">₱0.00</div>
          </div>
          <div className="row">
            <div className="label">Enter Amount</div>
            <div className="amount">{formatAmount(amount)}</div>
          </div>
          <div className="row">
            <div className="label">Change:</div>
            <div className="amount">₱0.00</div>
          </div>
          <div className="row payment-mode-row">
            <div className="label">Payment Mode:</div>
            <div className="payment-mode-buttons">
              <button
                className={`mode-btn ${paymentMode === "Cash" ? "active" : ""}`}
                onClick={() => setPaymentMode("Cash")}
              >
                Cash
              </button>
              <button
                className={`mode-btn ${paymentMode === "GCash" ? "active" : ""}`}
                onClick={() => setPaymentMode("GCash")}
              >
                GCash
              </button>
            </div>
          </div>
        </div>

        <div className="keypad-card" role="group" aria-label="Numeric keypad">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "Clear", "0", "←"].map(
            (key) => (
              <button
                key={key}
                className={`key ${key === "Clear" ? "action clear" : key === "0" ? "zero" : ""}`}
                onClick={() => {
                  if (key === "Clear") return clear();
                  if (key === "←") return backspace();
                  addDigit(key);
                }}
              >
                {key}
              </button>
            )
          )}
        </div>
      </div>

      <div className="right-action">
        <button className="complete-btn" onClick={complete}>
          Complete Transaction
        </button>
      </div>
    </div>
  );
}
