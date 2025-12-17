"use client";
import React, { useEffect, useState } from "react";

export default function HeaderSearch() {
  const [value, setValue] = useState("");

  useEffect(() => {
    // init from localStorage if present
    const v =
      typeof window !== "undefined"
        ? localStorage.getItem("mainpos:search")
        : null;
    if (v) setValue(v);

    const handler = (e: StorageEvent) => {
      if (e.key === "mainpos:search") setValue(e.newValue ?? "");
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  function dispatch(v: string) {
    // dispatch a custom event for real-time local updates
    try {
      localStorage.setItem("mainpos:search", v);
    } catch (err) {
      // localstorage may be disabled; ignore
    }
    window.dispatchEvent(new CustomEvent("mainpos:search", { detail: v }));
  }

  return (
    <input
      className="header-search"
      aria-label="Search products"
      placeholder="Search Products"
      value={value}
      onChange={(e) => {
        setValue(e.target.value);
        dispatch(e.target.value);
      }}
    />
  );
}
