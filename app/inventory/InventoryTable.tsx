"use client";
import React, { useMemo, useState } from "react";
import { Package, Wine, Cake, ShoppingBasket } from "lucide-react";

const categoryIcons: Record<string, React.ReactNode> = {
  Groceries: <ShoppingBasket size={20} color="white" strokeWidth={1.5} />,
  Beverages: <Wine size={20} color="white" strokeWidth={1.5} />,
  Snacks: <Cake size={20} color="white" strokeWidth={1.5} />,
  Dairy: <Package size={20} color="white" strokeWidth={1.5} />,
};

type Product = {
  id: number;
  name: string;
  category: string;
  stock: number;
  reorder: number;
  price: number;
};

export default function InventoryTable({
  onEditClick,
}: {
  onEditClick?: (product: Product) => void;
}) {
  const sample: Product[] = useMemo(
    () => [
      {
        id: 1,
        name: "Sliced Bread",
        category: "Groceries",
        stock: 12,
        reorder: 10,
        price: 65,
      },
      {
        id: 2,
        name: "Coke Mismo",
        category: "Beverages",
        stock: 5,
        reorder: 15,
        price: 25,
      },
      {
        id: 3,
        name: "Egg",
        category: "Groceries",
        stock: 0,
        reorder: 12,
        price: 11,
      },
      {
        id: 4,
        name: "Chips",
        category: "Snacks",
        stock: 2,
        reorder: 8,
        price: 19,
      },
    ],
    []
  );

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = useMemo(() => {
    return sample.filter((p) => {
      if (query && !p.name.toLowerCase().includes(query.toLowerCase()))
        return false;
      if (filter === "in") return p.stock > 0 && p.stock >= p.reorder;
      if (filter === "low") return p.stock > 0 && p.stock < p.reorder;
      if (filter === "out") return p.stock <= 0;
      return true;
    });
  }, [sample, query, filter]);

  function status(p: Product) {
    if (p.stock <= 0) return "out";
    if (p.stock < p.reorder) return "low";
    return "in";
  }

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
            onChange={(e) => setQuery(e.target.value)}
            className="inv-search-input"
          />
          <div className="inv-search-filters">
            <button
              className={`chip ${filter === "all" ? "active" : ""}`}
              onClick={() => setFilter("all")}
            >
              All
            </button>
            <button
              className={`chip ${filter === "in" ? "active" : ""}`}
              onClick={() => setFilter("in")}
            >
              In Stock
            </button>
            <button
              className={`chip ${filter === "low" ? "active" : ""}`}
              onClick={() => setFilter("low")}
            >
              Low Stock
            </button>
            <button
              className={`chip ${filter === "out" ? "active" : ""}`}
              onClick={() => setFilter("out")}
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
            {filtered.map((p) => (
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
                      {categoryIcons[p.category] || (
                        <Package size={20} color="white" strokeWidth={1.5} />
                      )}
                    </div>
                    <div>{p.name}</div>
                  </div>
                </td>
                <td className="category-col">
                  <span className="inv-tag">{p.category}</span>
                </td>
                <td className="stock-col">{p.stock}</td>
                <td className="reorder-col">{p.reorder}</td>
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
                <td className="price-col">₱{p.price.toFixed(2)}</td>
                <td className="actions-col">
                  <button className="edit-btn" onClick={() => onEditClick?.(p)}>
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
