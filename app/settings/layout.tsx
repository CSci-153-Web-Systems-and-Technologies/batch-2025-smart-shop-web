"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Store,
  Receipt,
  Package,
  Cloud,
  Users,
  Bell,
  Info,
  LogOut,
} from "lucide-react";
import { signout } from "@/lib/auth-action";
import "./styles.css";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      // Clear any stored user data
      localStorage.clear();
      sessionStorage.clear();

      // Call server action to sign out
      const result = await signout();

      if (result?.error) {
        console.error("Logout error:", result.error);
        setIsLoggingOut(false);
        setShowLogoutModal(false);
        return;
      }

      if (result?.success) {
        // Redirect to login page on client side
        router.push("/");
      }
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
      setShowLogoutModal(false);
      // Fallback redirect
      router.push("/");
    }
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <div className="header-top">
          <Link href="/mainpos" className="back-link">
            ← Back to POS
          </Link>
        </div>
        <div className="header-content">
          <h1 className="settings-title">Settings</h1>
          <p className="settings-subtitle">Manage your store</p>
        </div>
      </div>

      <div className="settings-layout">
        <aside className="settings-sidebar">
          <nav className="settings-nav">
            <div className="nav-section">
              <h3 className="nav-section-title">GENERAL</h3>
              <Link href="/settings" className="nav-item active">
                <Store className="nav-icon" size={20} />
                Store Information
              </Link>
              <Link href="/settings/receipt" className="nav-item">
                <Receipt className="nav-icon" size={20} />
                Receipt Settings
              </Link>
            </div>

            <div className="nav-section">
              <h3 className="nav-section-title">OPERATIONS</h3>
              <Link href="/settings/inventory-alerts" className="nav-item">
                <Package className="nav-icon" size={20} />
                Inventory Alerts
              </Link>
              <Link href="/settings/backup" className="nav-item">
                <Cloud className="nav-icon" size={20} />
                Backup & Sync
              </Link>
              <Link href="/settings/users" className="nav-item">
                <Users className="nav-icon" size={20} />
                User Management
              </Link>
            </div>

            <div className="nav-section">
              <h3 className="nav-section-title">SYSTEM</h3>
              <Link href="/settings/notifications" className="nav-item">
                <Bell className="nav-icon" size={20} />
                Notifications
              </Link>
              <Link href="/settings/about" className="nav-item">
                <Info className="nav-icon" size={20} />
                About & Updates
              </Link>
            </div>

            <div className="nav-section nav-section-logout">
              <button
                onClick={handleLogoutClick}
                className="nav-item nav-item-logout"
              >
                <LogOut className="nav-icon" size={20} />
                Log Out
              </button>
            </div>
          </nav>
        </aside>

        <main className="settings-content">{children}</main>
      </div>

      {showLogoutModal && (
        <div className="modal-overlay" onClick={handleCancelLogout}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Confirm Logout</h3>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to log out? You will be redirected to the
                login page.
              </p>
            </div>
            <div className="modal-footer">
              <button
                onClick={handleCancelLogout}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLogout}
                className="btn btn-danger"
                disabled={isLoggingOut}
              >
                {isLoggingOut ? "Logging out..." : "Log Out"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
