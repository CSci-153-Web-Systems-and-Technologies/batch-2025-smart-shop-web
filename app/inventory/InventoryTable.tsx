"use client";
import React, { useMemo } from "react";
import { Package, Wine, Cookie, ShoppingBasket } from "lucide-react";
import { type InventoryProduct } from "@/lib/pos-service";

const categoryIcons: Record<string, React.ReactNode> = {
  Groceries: <ShoppingBasket size={20} color="white" strokeWidth={1.5} />,
  Beverages: <Wine size={20} color="white" strokeWidth={1.5} />,
  Snacks: <Cookie size={20} color="white" strokeWidth={1.5} />,
};

interface InventoryTableProps {
  products: InventoryProduct[];
  loading?: boolean;
  query: string;
  filter: "all" | "in" | "low" | "out";
  onQueryChange: (value: string) => void;
  onFilterChange: (value: "all" | "in" | "low" | "out") => void;
  onEditClick?: (product: InventoryProduct) => void;
}

function status(p: InventoryProduct) {
  const reorder = p.reorder_level ?? 0;
  if ((p.stock_quantity ?? 0) <= 0) return "out";
  if ((p.stock_quantity ?? 0) < reorder) return "low";
  return "in";
}

function renderThumb(product: InventoryProduct) {
  const icon = product.icon;
  const categoryKey = product.category_name || "";
  const isUrl = typeof icon === "string" && /^(https?:\/\/|\/)/.test(icon);
  const isEmoji =
    typeof icon === "string" && /\p{Extended_Pictographic}/u.test(icon);

  if (isUrl) {
    return (
      <img
        src={icon}
        alt={product.name}
        style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 8 }}
      />
    );
  }
  if (isEmoji) {
    return <span style={{ fontSize: 24 }}>{icon}</span>;
  }
  return (
    categoryIcons[categoryKey] || (
      <Package size={20} color="white" strokeWidth={1.5} />
    )
  );
}

export default function InventoryTable({
  products,
  loading,
  query,
  filter,
  onQueryChange,
  onFilterChange,
  onEditClick,
}: InventoryTableProps) {
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q)) return false;
      if (filter === "in")
        return (
          (p.stock_quantity ?? 0) > 0 &&
          (p.stock_quantity ?? 0) >= (p.reorder_level ?? 0)
        );
      if (filter === "low")
        return (
          (p.stock_quantity ?? 0) > 0 &&
          (p.stock_quantity ?? 0) < (p.reorder_level ?? 0)
        );
      if (filter === "out") return (p.stock_quantity ?? 0) <= 0;
      return true;
    });
  }, [products, query, filter]);

  return (
    <div>
      <div className="inv-search-container">
        <label className="inv-search-label" htmlFor="inv-search-input">
          Search Products by name
        </label>
        <div className="inv-search-bar">
          <input
            id="inv-search-input"
            aria-label="Search"
            placeholder="Search Products by name"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="inv-search-input"
          />
          <div className="inv-search-filters">
            <button
              className={`chip ${filter === "all" ? "active" : ""}`}
              onClick={() => onFilterChange("all")}
            >
              All
            </button>
            <button
              className={`chip ${filter === "in" ? "active" : ""}`}
              onClick={() => onFilterChange("in")}
            >
              In Stock
            </button>
            <button
              className={`chip ${filter === "low" ? "active" : ""}`}
              onClick={() => onFilterChange("low")}
            >
              Low Stock
            </button>
            <button
              className={`chip ${filter === "out" ? "active" : ""}`}
              onClick={() => onFilterChange("out")}
            >
              Out of Stock
            </button>
          </div>
        </div>
      </div>

      <div className="inv-table">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th className="category-col">Category</th>
              <th className="stock-col">Stock</th>
              <th className="reorder-col">Reorder Level</th>
              <th className="status-col">Status</th>
              <th className="price-col">Price</th>
              <th className="actions-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={7}
                  style={{ textAlign: "center", padding: "1rem" }}
                >
                  Loading inventory...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    textAlign: "center",
                    padding: "1rem",
                    color: "#777",
                  }}
                >
                  No products found
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div
                      style={{ display: "flex", gap: 12, alignItems: "center" }}
                    >
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 8,
                          background:
                            "linear-gradient(90deg,var(--primary-1),var(--primary-2))",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontWeight: 800,
                        }}
                      >
                        {renderThumb(p)}
                      </div>
                      <div>{p.name}</div>
                    </div>
                  </td>
                  <td className="category-col">
                    <span className="inv-tag">
                      {p.category_name || "Uncategorized"}
                    </span>
                  </td>
                  <td className="stock-col">{p.stock_quantity ?? 0}</td>
                  <td className="reorder-col">{p.reorder_level ?? 0}</td>
                  <td className="status-col">
                    {status(p) === "in" && (
                      <span className="status-in">In stock</span>
                    )}
                    {status(p) === "low" && (
                      <span className="status-low">Low stock</span>
                    )}
                    {status(p) === "out" && (
                      <span className="status-out">Out of stock</span>
                    )}
                  </td>
                  <td className="price-col">
                    ₱{(Number(p.price) || 0).toFixed(2)}
                  </td>
                  <td className="actions-col">
                    <button
                      className="edit-btn"
                      onClick={() => onEditClick?.(p)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
