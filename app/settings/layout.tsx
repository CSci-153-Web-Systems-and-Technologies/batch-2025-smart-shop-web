import React from "react";
import Link from "next/link";
import {
  Store,
  Receipt,
  Package,
  Cloud,
  Users,
  Bell,
  Info,
} from "lucide-react";
import "./styles.css";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
          </nav>
        </aside>

        <main className="settings-content">{children}</main>
      </div>
    </div>
  );
}
