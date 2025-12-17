import React from "react";
import PaymentWidget from "./PaymentWidget";

export default function Page(): React.ReactElement {
  return (
    <div className="payment-page">
      <div className="payment-panel">
        <div className="payment-center">
          <PaymentWidget />
        </div>
      </div>
    </div>
  );
}
