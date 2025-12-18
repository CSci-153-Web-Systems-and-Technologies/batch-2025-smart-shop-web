"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import InventoryTable from "./InventoryTable";
import { AddProductModal } from "./AddProductModal";
import { RemoveProductModal } from "./RemoveProductModal";
import { EditProductModal } from "./EditProductModal";
import {
  fetchCategories,
  fetchInventoryProducts,
  fetchInventoryStats,
  type Category,
  type InventoryProduct,
  type InventoryStats,
} from "@/lib/pos-service";
import { createClient } from "@/utils/supabase/client";

function formatCurrency(value: number) {
  return value.toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  });
}

export default function InventoryPage() {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] =
    useState<InventoryProduct | null>(null);
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<InventoryStats>({
    total: 0,
    low: 0,
    out: 0,
    value: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "in" | "low" | "out">("all");

  const supabase = useRef(createClient());

  const loadData = useCallback(
    async (opts?: {
      search?: string;
      filter?: "all" | "in" | "low" | "out";
    }) => {
      const searchTerm = opts?.search ?? query;
      const filterValue = opts?.filter ?? filter;
      setLoading(true);
      setError("");
      try {
        const [list, statsData] = await Promise.all([
          fetchInventoryProducts({
            search: searchTerm?.trim() || undefined,
            filter: filterValue,
          }),
          fetchInventoryStats(),
        ]);

        setProducts(list);
        setStats(statsData);
      } catch (err) {
        console.error("Failed to load inventory", err);
        setError("Failed to load inventory. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [filter, query]
  );

  const refreshCategories = useCallback(async () => {
    try {
      const list = await fetchCategories();
      setCategories(list);
    } catch (err) {
      console.error("Failed to load categories", err);
    }
  }, []);

  useEffect(() => {
    refreshCategories();
  }, [refreshCategories]);

  useEffect(() => {
    const timer = setTimeout(() => loadData({ search: query, filter }), 200);
    return () => clearTimeout(timer);
  }, [filter, loadData, query]);

  useEffect(() => {
    const channel = supabase.current
      .channel("inventory-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => loadData({ search: query, filter })
      )
      .subscribe();

    return () => {
      supabase.current.removeChannel(channel);
    };
  }, [filter, loadData, query]);

  const handleEditClick = (product: InventoryProduct) => {
    setSelectedProduct(product);
    setEditModalOpen(true);
  };

  return (
    <div>
      <div className="inventory-metrics">
        <div className="metric">
          <div className="metric-title">TOTAL PRODUCT</div>
          <div className="value">{stats.total}</div>
          <div className="subtitle">Across all categories</div>
        </div>

        <div className="metric">
          <div className="metric-title">LOW STOCK</div>
          <div className="value">{stats.low}</div>
          <div className="subtitle">Need to Reorder Soon</div>
        </div>

        <div className="metric">
          <div className="metric-title">OUT OF STOCK</div>
          <div className="value">{stats.out}</div>
          <div className="subtitle">Required</div>
        </div>

        <div className="metric">
          <div className="metric-title">INVENTORY VALUE</div>
          <div className="value">{formatCurrency(stats.value)}</div>
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

      {error && <div className="error-banner">{error}</div>}

      <InventoryTable
        products={products}
        loading={loading}
        onEditClick={handleEditClick}
        query={query}
        filter={filter}
        onQueryChange={setQuery}
        onFilterChange={setFilter}
      />

      <AddProductModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        categories={categories}
        onAdded={() => loadData({ search: query, filter })}
      />
      <RemoveProductModal
        isOpen={removeModalOpen}
        onClose={() => setRemoveModalOpen(false)}
        products={products}
        onRemoved={() => loadData({ search: query, filter })}
      />
      <EditProductModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        product={selectedProduct}
        categories={categories}
        onUpdated={() => loadData({ search: query, filter })}
      />
    </div>
  );
}
