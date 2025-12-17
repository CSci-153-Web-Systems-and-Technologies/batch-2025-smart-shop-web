"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import "./modal.css";

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: {
    id: number;
    name: string;
    category: string;
    stock: number;
    reorder: number;
    price: number;
  };
}

export function EditProductModal({
  isOpen,
  onClose,
  product,
}: EditProductModalProps) {
  const [formData, setFormData] = useState({
    productName: product?.name || "",
    category: product?.category || "Groceries",
    initialStock: product?.stock.toString() || "",
    reorderLevel: product?.reorder.toString() || "",
    price: product?.price.toString() || "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Updating product:", formData);
    onClose();
  };

  if (!isOpen || !product) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Product</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Product Name</label>
            <input
              type="text"
              name="productName"
              placeholder="Enter product name"
              value={formData.productName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
            >
              <option>Groceries</option>
              <option>Beverages</option>
              <option>Snacks</option>
            </select>
          </div>

          <div className="form-group">
            <label>Current Stock</label>
            <input
              type="number"
              name="initialStock"
              min="0"
              placeholder="Enter quantity"
              value={formData.initialStock}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "" || parseInt(value) >= 0) {
                  handleChange(e);
                }
              }}
              required
            />
          </div>

          <div className="form-group">
            <label>Reorder Level</label>
            <input
              type="number"
              name="reorderLevel"
              min="0"
              placeholder="Enter reorder level"
              value={formData.reorderLevel}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "" || parseInt(value) >= 0) {
                  handleChange(e);
                }
              }}
              required
            />
          </div>

          <div className="form-group">
            <label>Price</label>
            <div className="price-input">
              <span>₱</span>
              <input
                type="number"
                name="price"
                step="1"
                min="0"
                placeholder="0.00"
                value={formData.price}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "" || parseFloat(value) >= 0) {
                    handleChange(e);
                  }
                }}
                required
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-submit btn-update">
              Update Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
