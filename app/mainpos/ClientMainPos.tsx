"use client";
import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Package, Loader } from "lucide-react";
import {
  fetchProducts,
  fetchCategories,
  type Product,
  type Category,
} from "@/lib/pos-service";

const categoryIcons: Record<string, React.ReactNode> = {
  "All items": <Package size={32} color="white" strokeWidth={1.5} />,
};

export default function ClientMainPos() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const [query, setQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  const [cart, setCart] = useState<
    {
      productId: string;
      productName: string;
      quantity: number;
      price: number;
    }[]
  >([]);

  const router = useRouter();

  // Fetch products and categories on mount
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError("");
      try {
        const [productsData, categoriesData] = await Promise.all([
          fetchProducts(),
          fetchCategories(),
        ]);

        setProducts(productsData);
        setCategories(categoriesData);
      } catch (err) {
        setError("Failed to load products. Please refresh the page.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Handle search from other sources
  React.useEffect(() => {
    const handler = (e: Event) =>
      setQuery((e as CustomEvent<string>).detail ?? "");
    window.addEventListener("mainpos:search", handler as EventListener);
    const storageHandler = (e: StorageEvent) => {
      if (e.key === "mainpos:search") setQuery(e.newValue ?? "");
    };
    window.addEventListener("storage", storageHandler);

    const v = localStorage.getItem("mainpos:search");
    if (v) setQuery(v);

    return () => {
      window.removeEventListener("mainpos:search", handler as EventListener);
      window.removeEventListener("storage", storageHandler);
    };
  }, []);

  // Filter products
  const filteredProducts = useMemo(() => {
    const filtered = products.filter((p) => {
      const matchesQuery = p.name.toLowerCase().includes(query.toLowerCase());
      const matchesCategory =
        selectedCategoryId === null || p.category_id === selectedCategoryId;
      return matchesQuery && matchesCategory && p.stock_quantity > 0;
    });

    // Remove duplicates by ID just in case
    const seen = new Set<string>();
    return filtered.filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  }, [products, query, selectedCategoryId]);

  function addToCart(product: Product) {
    const inCart = cart.find((c) => c.productId === product.id);
    if (inCart && inCart.quantity >= product.stock_quantity) {
      return; // Can't add more than stock
    }

    setCart((prev) => {
      const found = prev.find((c) => c.productId === product.id);
      if (found) {
        return prev.map((c) =>
          c.productId === product.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          price: product.price,
        },
      ];
    });
  }

  function removeFromCart(productId: string) {
    setCart((prev) => {
      const found = prev.find((c) => c.productId === productId);
      if (!found) return prev;
      if (found.quantity <= 1)
        return prev.filter((c) => c.productId !== productId);
      return prev.map((c) =>
        c.productId === productId ? { ...c, quantity: c.quantity - 1 } : c
      );
    });
  }

  function removeAllFromCart(productId: string) {
    setCart((prev) => prev.filter((c) => c.productId !== productId));
  }

  function getQtyInCart(productId: string) {
    return cart.find((c) => c.productId === productId)?.quantity ?? 0;
  }

  function calculateTotal() {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  // Render a compact product thumbnail: supports URL images, emojis, or fallback icon
  function renderThumb(product: Product) {
    const icon = product.icon;
    const isUrl = typeof icon === "string" && /^(https?:\/\/|\/)/.test(icon);
    const isEmoji =
      typeof icon === "string" && /\p{Extended_Pictographic}/u.test(icon);

    if (isUrl) {
      return (
        <img
          src={icon}
          alt={product.name}
          style={{ width: 32, height: 32, objectFit: "cover", borderRadius: 6 }}
        />
      );
    }
    if (isEmoji) {
      return <span style={{ fontSize: 24 }}>{icon}</span>;
    }
    return categoryIcons["All items"];
  }

  const handleProceedToPayment = () => {
    if (cart.length === 0) {
      alert("Please add items to cart first");
      return;
    }
    // Store cart in sessionStorage for payment page
    sessionStorage.setItem("pos:cart", JSON.stringify(cart));
    router.push("/payment");
  };

  if (loading) {
    return (
      <div
        className="pos-page"
        style={{ justifyContent: "center", alignItems: "center" }}
      >
        <Loader size={48} className="animate-spin" />
        <p>Loading products...</p>
      </div>
    );
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
            <button
              className={`chip ${selectedCategoryId === null ? "active" : ""}`}
              onClick={() => setSelectedCategoryId(null)}
            >
              <Package size={14} />
              <span>All Items</span>
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`chip ${selectedCategoryId === cat.id ? "active" : ""}`}
                onClick={() => setSelectedCategoryId(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div className="product-grid">
          {filteredProducts.length === 0 ? (
            <div
              style={{
                gridColumn: "1 / -1",
                padding: "2rem",
                textAlign: "center",
                color: "#999",
              }}
            >
              No products found
            </div>
          ) : (
            filteredProducts.map((product) => {
              const inCart = getQtyInCart(product.id);
              const outOfStock = product.stock_quantity === 0;

              return (
                <div
                  key={product.id}
                  className={`product-card ${outOfStock ? "disabled" : ""}`}
                  onClick={() => !outOfStock && addToCart(product)}
                >
                  <div className="product-thumb">{renderThumb(product)}</div>
                  <div className="product-name">{product.name}</div>
                  <div className="product-price">
                    ₱{product.price.toFixed(2)}
                  </div>
                  <div className="product-qty">
                    {inCart ? `In cart: ${inCart}` : ""}
                  </div>
                  <div className="product-stock">
                    Stock: {product.stock_quantity}
                  </div>
                </div>
              );
            })
          )}
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
            {cart.map((item) => {
              return (
                <div className="cart-item" key={item.productId}>
                  <div className="item-left">
                    <div>
                      {item.productName} × {item.quantity}
                    </div>
                    <button
                      className="btn-remove-one"
                      aria-label={`Remove one ${item.productName}`}
                      title="Remove one"
                      onClick={() => removeFromCart(item.productId)}
                    >
                      ×
                    </button>
                    <button
                      className="btn-remove-all"
                      aria-label={`Remove all ${item.productName}`}
                      title="Remove all"
                      onClick={() => removeAllFromCart(item.productId)}
                    >
                      🗑
                    </button>
                  </div>
                  <div className="price">
                    ₱{(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="cart-footer">
          <div className="total-row">
            <div>Total:</div>
            <div className="total-amount">₱{calculateTotal().toFixed(2)}</div>
          </div>
          <button
            className="pay-btn"
            onClick={handleProceedToPayment}
            disabled={cart.length === 0}
            title={
              cart.length === 0
                ? "Add items to cart first"
                : "Proceed to payment"
            }
          >
            Proceed to Payment
          </button>
        </div>
      </aside>
    </div>
  );
}
