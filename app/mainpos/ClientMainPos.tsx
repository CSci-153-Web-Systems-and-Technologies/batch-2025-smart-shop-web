"use client";
import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Package, Wine, Cake, ShoppingBasket } from "lucide-react";

const categoryIcons: Record<string, React.ReactNode> = {
  "All items": <Package size={32} color="white" strokeWidth={1.5} />,
  Groceries: <ShoppingBasket size={32} color="white" strokeWidth={1.5} />,
  Beverages: <Wine size={32} color="white" strokeWidth={1.5} />,
  Snacks: <Cake size={32} color="white" strokeWidth={1.5} />,
};

const productCategories: Record<string, string> = {
  Bread: "Groceries",
  "Canned Food": "Groceries",
  "Coke Mismo": "Beverages",
  Egg: "Groceries",
};

export default function ClientMainPos() {
  const sampleProducts = Array.from({ length: 12 }).map((_, i) => ({
    id: i + 1,
    name: ["Bread", "Canned Food", "Coke Mismo", "Egg"][i % 4],
    price: [20, 23, 25, 11][i % 4],
  }));

  // Create a canonical list of products (unique by name) using the first occurrence
  const uniqueProducts = Array.from(
    new Map(sampleProducts.map((p) => [p.name, p])).values()
  );

  // Compute inventory counts per product name
  const inventoryByName = useMemo(() => {
    return sampleProducts.reduce<Record<string, number>>(
      (acc, p) => {
        acc[p.name] = (acc[p.name] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }, [sampleProducts]);

  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All items");

  React.useEffect(() => {
    const handler = (e: Event) =>
      setQuery((e as CustomEvent<string>).detail ?? "");
    // event-based update
    window.addEventListener("mainpos:search", handler as EventListener);
    // storage-based synchronization
    const storageHandler = (e: StorageEvent) => {
      if (e.key === "mainpos:search") setQuery(e.newValue ?? "");
    };
    window.addEventListener("storage", storageHandler);

    // Initialize from localStorage if any
    const v = localStorage.getItem("mainpos:search");
    if (v) setQuery(v);

    return () => {
      window.removeEventListener("mainpos:search", handler as EventListener);
      window.removeEventListener("storage", storageHandler);
    };
  }, []);
  const [cart, setCart] = useState<{ id: number; qty: number }[]>([]);
  const router = useRouter();

  function addToCart(id: number) {
    const name = uniqueProducts.find((p) => p.id === id)?.name;
    const stock = name ? (inventoryByName[name] ?? Infinity) : Infinity;
    const current = cart.find((c) => c.id === id)?.qty ?? 0;
    if (current >= stock) return; // don't add beyond stock
    setCart((prev) => {
      const found = prev.find((p) => p.id === id);
      if (found)
        return prev.map((p) => (p.id === id ? { ...p, qty: p.qty + 1 } : p));
      return [...prev, { id, qty: 1 }];
    });
  }

  function removeFromCart(id: number) {
    setCart((prev) => {
      const found = prev.find((p) => p.id === id);
      if (!found) return prev;
      if (found.qty <= 1) return prev.filter((p) => p.id !== id);
      return prev.map((p) => (p.id === id ? { ...p, qty: p.qty - 1 } : p));
    });
  }

  function removeAllFromCart(id: number) {
    setCart((prev) => prev.filter((p) => p.id !== id));
  }

  function qtyFor(id: number) {
    return cart.find((c) => c.id === id)?.qty ?? 0;
  }

  // Filter the unique products for display
  const products = uniqueProducts.filter((p) => {
    const matchesQuery = p.name.toLowerCase().includes(query.toLowerCase());
    const matchesCategory =
      selectedCategory === "All items" ||
      productCategories[p.name] === selectedCategory;
    return matchesQuery && matchesCategory;
  });

  function total() {
    return cart.reduce((sum, it) => {
      const prod = sampleProducts.find((p) => p.id === it.id)!;
      return sum + prod.price * it.qty;
    }, 0);
  }

  return (
    <div className="pos-page">
      <div className="pos-left">
        <div className="pos-top">
          <div className="search-area">
            <input
              className="pos-search"
              aria-label="Search products"
              placeholder="Search Products"
              value={query}
              onChange={(e) => {
                const v = e.target.value;
                setQuery(v);
                try {
                  localStorage.setItem("mainpos:search", v);
                } catch {}
                window.dispatchEvent(
                  new CustomEvent("mainpos:search", { detail: v })
                );
              }}
            />
          </div>
          <div className="category-chips">
            {["All items", "Groceries", "Beverages", "Snacks"].map((cat) => (
              <button
                key={cat}
                className={`chip ${selectedCategory === cat ? "active" : ""}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="product-grid">
          {products.map((p) => {
            const stock = inventoryByName[p.name] ?? 0;
            const inCart = qtyFor(p.id);
            const outOfStock = inCart >= stock;
            return (
              <div
                key={p.id}
                className={`product-card ${outOfStock ? "disabled" : ""}`}
                onClick={() => !outOfStock && addToCart(p.id)}
              >
                <div className="product-thumb">
                  {categoryIcons[productCategories[p.name]] ||
                    categoryIcons["All items"]}
                </div>
                <div className="product-name">{p.name}</div>
                <div className="product-price">₱{p.price.toFixed(2)}</div>
                <div className="product-qty">
                  {qtyFor(p.id) ? `In cart: ${qtyFor(p.id)}` : ""}
                </div>
                <div className="product-stock">Stock: {stock}</div>
              </div>
            );
          })}
        </div>
      </div>

      <aside className="pos-right">
        <div className="cart-header">Current Order</div>
        <div className="panel-body">
          <div
            className="cart-empty"
            style={{ display: cart.length ? "none" : "flex" }}
          >
            <div className="cart-empty-ico">🛒</div>
            <div>
              No items in cart
              <br />
              Click on products to add them
            </div>
          </div>

          <div className="cart-list">
            {cart.map((it) => {
              const p = sampleProducts.find((x) => x.id === it.id)!;
              return (
                <div className="cart-item" key={it.id}>
                  <div className="item-left">
                    <div>
                      {p.name} × {it.qty}
                    </div>
                    <button
                      className="btn-remove-one"
                      aria-label={`Remove one ${p.name}`}
                      title="Remove one"
                      onClick={() => removeFromCart(it.id)}
                    >
                      ×
                    </button>
                    <button
                      className="btn-remove-all"
                      aria-label={`Remove all ${p.name}`}
                      title="Remove all"
                      onClick={() => removeAllFromCart(it.id)}
                    >
                      🗑
                    </button>
                  </div>
                  <div className="price">₱{(p.price * it.qty).toFixed(2)}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="cart-footer">
          <div className="total-row">
            <div>Total:</div>
            <div className="total-amount">₱{total().toFixed(2)}</div>
          </div>
          <button className="pay-btn" onClick={() => router.push("/payment")}>
            Proceed to Payment
          </button>
        </div>
      </aside>
    </div>
  );
}
