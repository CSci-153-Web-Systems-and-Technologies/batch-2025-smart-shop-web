"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function ThemeToggle() {
  const pathname = usePathname();
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const saved =
      typeof window !== "undefined" ? localStorage.getItem("theme") : null;
    const initial = (saved as "light" | "dark") || "light";
    setTheme(initial);
    document.documentElement.classList.remove("theme-light", "theme-dark");
    document.documentElement.classList.add(`theme-${initial}`);
  }, []);

  // Apply theme; force light on /payment without persisting
  useEffect(() => {
    const isPayment = pathname?.startsWith("/payment");
    document.documentElement.classList.remove("theme-light", "theme-dark");
    if (isPayment) {
      document.documentElement.classList.add("theme-light");
    } else {
      document.documentElement.classList.add(`theme-${theme}`);
      localStorage.setItem("theme", theme);
    }
  }, [pathname, theme]);

  return (
    // Hide on payment route
    pathname?.startsWith("/payment") ? null : (
      <button
        className="theme-toggle"
        aria-label="Toggle theme"
        onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
      >
        {theme === "light" ? "🌙" : "☀️"}
      </button>
    )
  );
}
