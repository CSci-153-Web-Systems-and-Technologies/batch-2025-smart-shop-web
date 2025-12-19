"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { CheckCircle } from "lucide-react";

function TransactionCompleteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [details, setDetails] = useState({
    total: "0.00",
    change: "0.00",
    receiptNumber: "",
  });

  useEffect(() => {
    const total = searchParams.get("total") || "0.00";
    const change = searchParams.get("change") || "0.00";
    const receiptNumber = searchParams.get("receipt") || "";

    setDetails({ total, change, receiptNumber });
  }, [searchParams]);

  const handleBackToMainPage = () => {
    router.push("/mainpos");
  };

  return (
    <div className="transaction-complete-page">
      <div className="success-modal">
        <div className="modal-header">
          <CheckCircle size={48} strokeWidth={2} />
          <h1>Transaction Complete!</h1>
        </div>

        <div className="modal-body">
          {details.receiptNumber && (
            <div className="receipt-info">
              <p className="receipt-label">Receipt Number</p>
              <p className="receipt-number">{details.receiptNumber}</p>
            </div>
          )}

          <div className="transaction-details">
            <div className="detail-row total">
              <span className="label">Total Paid:</span>
              <span className="value">₱{details.total}</span>
            </div>
            <div className="detail-row change">
              <span className="label">Change Due:</span>
              <span className="value">₱{details.change}</span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="back-button" onClick={handleBackToMainPage}>
            Back to Main Page
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TransactionComplete() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TransactionCompleteContent />
    </Suspense>
  );
}
