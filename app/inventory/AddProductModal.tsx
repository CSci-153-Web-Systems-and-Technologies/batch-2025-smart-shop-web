"use client";

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import "./modal.css";
import { createInventoryProduct, type Category } from "@/lib/pos-service";

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onAdded?: () => void;
}

export function AddProductModal({
  isOpen,
  onClose,
  categories,
  onAdded,
}: AddProductModalProps) {
  const [formData, setFormData] = useState({
    productName: "",
    category: "",
    initialStock: "",
    reorderLevel: "",
    price: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (categories.length && !formData.category) {
      setFormData((prev) => ({ ...prev, category: categories[0].id }));
    }
  }, [categories, formData.category]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      productName: "",
      category: categories[0]?.id || "",
      initialStock: "",
      reorderLevel: "",
      price: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const stock = parseInt(formData.initialStock, 10);
    const reorder = parseInt(formData.reorderLevel, 10);
    const price = parseFloat(formData.price);
    const categoryId = formData.category || categories[0]?.id || "";

    if (!formData.productName.trim()) {
      setError("Product name is required.");
      return;
    }
    if (!categoryId) {
      setError("Please select a category.");
      return;
    }
    if ([stock, reorder, price].some((n) => Number.isNaN(n) || n < 0)) {
      setError("Please enter valid non-negative numbers.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await createInventoryProduct({
        name: formData.productName.trim(),
        category_id: categoryId,
        stock_quantity: stock,
        reorder_level: reorder,
        price,
      });

      if (!result.success) {
        setError(result.error || "Failed to add product.");
        return;
      }

      resetForm();
      onAdded?.();
      onClose();
    } catch (err: any) {
      console.error("Error adding product", err);
      setError(err?.message || "Failed to add product.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Product</h2>
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
              placeholder="Enter product name*"
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
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Initial Stock</label>
            <input
              type="number"
              name="initialStock"
              min="0"
              placeholder="Enter quantity*"
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

          {error && <div className="form-error">{error}</div>}

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={submitting}>
              {submitting ? "Saving..." : "Add Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
