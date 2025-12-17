"use client";

import React, { useState } from "react";
import InventoryTable from "./InventoryTable";
import { AddProductModal } from "./AddProductModal";
import { RemoveProductModal } from "./RemoveProductModal";
import { EditProductModal } from "./EditProductModal";

export default function InventoryPage() {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const handleEditClick = (product: any) => {
    setSelectedProduct(product);
    setEditModalOpen(true);
  };

  return (
    <div>
      <div className="inventory-metrics">
        <div className="metric">
          <div className="metric-title">TOTAL PRODUCT</div>
          <div className="value">100</div>
          <div className="subtitle">Across all categories</div>
        </div>

        <div className="metric">
          <div className="metric-title">LOW STOCK</div>
          <div className="value">10</div>
          <div className="subtitle">Need to Reorder Soon</div>
        </div>

        <div className="metric">
          <div className="metric-title">OUT OF STOCK</div>
          <div className="value">5</div>
          <div className="subtitle">Required</div>
        </div>

        <div className="metric">
          <div className="metric-title">INVENTORY VALUE</div>
          <div className="value">₱25.4K</div>
          <div className="subtitle">Total stock worth</div>
        </div>
      </div>

      <div className="inv-controls">
        <div />
        <div className="big-actions">
          <button className="btn-add" onClick={() => setAddModalOpen(true)}>
            Add Product
          </button>
          <button
            className="btn-remove"
            onClick={() => setRemoveModalOpen(true)}
          >
            Remove Product
          </button>
        </div>
      </div>

      <InventoryTable onEditClick={handleEditClick} />

      <AddProductModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
      />
      <RemoveProductModal
        isOpen={removeModalOpen}
        onClose={() => setRemoveModalOpen(false)}
      />
      <EditProductModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        product={selectedProduct}
      />
    </div>
  );
}
