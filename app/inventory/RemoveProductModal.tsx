"use client";

import React, { useState } from "react";
import { X, AlertCircle } from "lucide-react";
import "./modal.css";

interface RemoveProductModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RemoveProductModal({
  isOpen,
  onClose,
}: RemoveProductModalProps) {
  const [selectedProduct, setSelectedProduct] = useState("");
  const products = ["Sliced Bread", "Coke Mismo", "Egg", "Chips"];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Removing product:", selectedProduct);
    setSelectedProduct("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content modal-danger"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Remove Product</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-warning">
          <AlertCircle size={48} />
          <p>Are you sure you want to remove this product?</p>
          <span>This action cannot be undone.</span>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Select Product</label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              required
            >
              <option value="">Choose a product...</option>
              {products.map((product) => (
                <option key={product} value={product}>
                  {product}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Keep Product
            </button>
            <button type="submit" className="btn-submit btn-danger">
              Confirm Removal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
