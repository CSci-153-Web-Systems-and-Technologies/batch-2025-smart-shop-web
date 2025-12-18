"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createTransaction } from "@/lib/pos-service";

interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export default function PaymentWidget() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [amount, setAmount] = useState<string>("");
  const [paymentMode, setPaymentMode] = useState<"Cash" | "GCash">("Cash");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const router = useRouter();

  // Load cart from sessionStorage on mount
  useEffect(() => {
    const cartData = sessionStorage.getItem("pos:cart");
    if (cartData) {
      try {
        setCart(JSON.parse(cartData));
      } catch (err) {
        console.error("Failed to parse cart:", err);
        setError("Failed to load cart. Please go back and try again.");
      }
    } else {
      setError("No cart items found. Please add items from the POS.");
    }
  }, []);

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

  function formatAmount(v: string) {
    if (!v) return "₱0.00";
    let n = parseFloat(v);
    if (isNaN(n)) n = 0;
    return n.toLocaleString(undefined, {
      style: "currency",
      currency: "PHP",
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    });
  }

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  // No tax calculation; total equals cart total
  const enteredAmount = parseFloat(amount) || 0;
  const change = Math.max(0, enteredAmount - cartTotal);

  async function handleCompleteTransaction() {
    if (cart.length === 0) {
      setError("No items in cart");
      return;
    }

    if (paymentMode === "Cash" && enteredAmount < totalWithTax) {
      setError("Insufficient payment amount");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Format cart items for createTransaction
      const formattedItems = cart.map((item) => ({
        product_id: item.productId,
        product_name: item.productName,
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.price * item.quantity,
      }));

      // Create transaction in Supabase
      const result = await createTransaction(
        formattedItems,
        paymentMode,
        cartTotal,
        0,
        cartTotal
      );

      if (result.success) {
        // Clear cart
        sessionStorage.removeItem("pos:cart");

        // Show receipt and redirect
        alert(
          `Transaction completed!\nReceipt Number: ${result.receipt_number}\nTotal: ₱${cartTotal.toFixed(2)}\nChange: ₱${change.toFixed(2)}`
        );
        router.push("/mainpos");
      } else {
        setError(result.error || "Failed to create transaction");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (error && cart.length === 0) {
    return (
      <div className="payment-widget">
        <div className="left-action">
          <Link href="/mainpos">Go Back</Link>
        </div>
        <div
          className="payment-center"
          style={{
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
          }}
        >
          <div style={{ textAlign: "center", color: "#d32f2f" }}>
            <p style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>{error}</p>
            <Link
              href="/mainpos"
              style={{ color: "#6f5ce9", textDecoration: "underline" }}
            >
              Return to POS
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-widget">
      <div className="left-action">
        <Link href="/mainpos">Go Back</Link>
      </div>

      <div className="payment-center">
        <div className="payment-total">
          <div className="row">
            <div className="label">Enter Amount</div>
            <div className="amount">{formatAmount(amount)}</div>
          </div>
          <div
            className="row"
            style={{ borderTop: "1px solid #ddd", paddingTop: "0.5rem" }}
          >
            <div className="label" style={{ fontWeight: "bold" }}>
              Total Amount
            </div>
            <div className="amount" style={{ fontWeight: "bold" }}>
              ₱{cartTotal.toFixed(2)}
            </div>
          </div>
          <div className="row">
            <div className="label">Change:</div>
            <div
              className="amount"
              style={{ color: change > 0 ? "#4caf50" : "#999" }}
            >
              ₱{change.toFixed(2)}
            </div>
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
          {error && (
            <div
              style={{
                color: "#d32f2f",
                marginTop: "0.5rem",
                fontSize: "0.9rem",
              }}
            >
              {error}
            </div>
          )}
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
        <button
          className="complete-btn"
          onClick={handleCompleteTransaction}
          disabled={loading || cart.length === 0}
          style={{
            opacity: loading ? 0.6 : 1,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Processing..." : "Complete Transaction"}
        </button>
      </div>
    </div>
  );
}
