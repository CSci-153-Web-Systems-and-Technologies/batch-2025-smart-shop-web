"use client";

import React, { useEffect, useState } from "react";
import { X, AlertCircle } from "lucide-react";
import "./modal.css";
import {
  softDeleteInventoryProduct,
  type InventoryProduct,
} from "@/lib/pos-service";

interface RemoveProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: InventoryProduct[];
  onRemoved?: () => void;
}

export function RemoveProductModal({
  isOpen,
  onClose,
  products,
  onRemoved,
}: RemoveProductModalProps) {
  const [selectedProduct, setSelectedProduct] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (products.length && !selectedProduct) {
      setSelectedProduct(products[0].id);
    }
  }, [products, selectedProduct]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) {
      setError("Please select a product.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const result = await softDeleteInventoryProduct(selectedProduct);
      if (!result.success) {
        setError(result.error || "Failed to remove product.");
        return;
      }
      setSelectedProduct("");
      onRemoved?.();
      onClose();
    } catch (err: any) {
      console.error("Error removing product", err);
      setError(err?.message || "Failed to remove product.");
    } finally {
      setSubmitting(false);
    }
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
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Keep Product
            </button>
            <button
              type="submit"
              className="btn-submit btn-danger"
              disabled={submitting}
            >
              {submitting ? "Removing..." : "Confirm Removal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
