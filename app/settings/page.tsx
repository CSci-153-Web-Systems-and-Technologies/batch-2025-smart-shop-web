"use client";

import React, { useState, useEffect } from "react";
import "./styles.css";

export default function SettingsPage() {
  const [storeInfo, setStoreInfo] = useState({
    storeName: "Maria's Sari-Sari Store",
    ownerName: "Maria Santos",
    contactNumber: "+63 912 345 6789",
    storeAddress: "123 Barangay Street, Manila",
  });

  const [preferences, setPreferences] = useState({
    soundAlerts: true,
    allowUtang: false,
  });

  const [displaySize, setDisplaySize] = useState("Medium (Recommended)");

  useEffect(() => {
    // Load saved display size from localStorage
    const savedSize = localStorage.getItem("displaySize");
    if (savedSize) {
      setDisplaySize(savedSize);
      applyFontSize(savedSize);
    }
  }, []);

  const applyFontSize = (size: string) => {
    const root = document.documentElement;

    if (size === "Small") {
      root.style.fontSize = "14px";
    } else if (size === "Medium (Recommended)") {
      root.style.fontSize = "16px";
    } else if (size === "Large") {
      root.style.fontSize = "18px";
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setStoreInfo({ ...storeInfo, [field]: value });
  };

  const handleToggle = (field: string) => {
    setPreferences({
      ...preferences,
      [field]: !preferences[field as keyof typeof preferences],
    });
  };

  const handleSaveChanges = () => {
    console.log("Saving changes...", storeInfo);
    alert("Changes saved successfully!");
  };

  const handleApplySettings = () => {
    // Apply font size based on display size
    applyFontSize(displaySize);

    // Save to localStorage
    localStorage.setItem("displaySize", displaySize);

    console.log("Applying settings...", { preferences, displaySize });
    alert("Display size applied successfully!");
  };

  return (
    <div className="settings-page">
      <div className="settings-section">
        <h2 className="section-title">Store Information</h2>
        <p className="section-subtitle">
          Manage your store details and business information
        </p>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Basic Information</h3>
            <p className="card-description">
              This information will appear on receipts and reports
            </p>
          </div>

          <div className="form-grid">
            <div className="form-group full-width">
              <label className="form-label">Store Name</label>
              <input
                type="text"
                className="form-input"
                value={storeInfo.storeName}
                onChange={(e) => handleInputChange("storeName", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Owner Name</label>
              <input
                type="text"
                className="form-input"
                value={storeInfo.ownerName}
                onChange={(e) => handleInputChange("ownerName", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contact Number</label>
              <input
                type="text"
                className="form-input"
                value={storeInfo.contactNumber}
                onChange={(e) =>
                  handleInputChange("contactNumber", e.target.value)
                }
              />
            </div>

            <div className="form-group full-width">
              <label className="form-label">Store Address</label>
              <input
                type="text"
                className="form-input"
                value={storeInfo.storeAddress}
                onChange={(e) =>
                  handleInputChange("storeAddress", e.target.value)
                }
              />
            </div>
          </div>

          <div className="card-footer">
            <button
              className="btn btn-secondary"
              onClick={() =>
                setStoreInfo({
                  storeName: "Maria's Sari-Sari Store",
                  ownerName: "Maria Santos",
                  contactNumber: "+63 912 345 6789",
                  storeAddress: "123 Barangay Street, Manila",
                })
              }
            >
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSaveChanges}>
              Save Changes
            </button>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Store Preferences</h3>
            <p className="card-description">Customize your POS experience</p>
          </div>

          <div className="preferences-list">
            <div className="preference-item">
              <div className="preference-info">
                <h4 className="preference-title">Sound Alerts</h4>
                <p className="preference-description">
                  Play sounds for successful transactions
                </p>
              </div>
              <button
                className={`toggle ${preferences.soundAlerts ? "active" : ""}`}
                onClick={() => handleToggle("soundAlerts")}
                aria-label="Toggle sound alerts"
              >
                <span className="toggle-slider"></span>
              </button>
            </div>

            <div className="preference-item">
              <div className="preference-info">
                <h4 className="preference-title">Allow Utang (Credit)</h4>
                <p className="preference-description">
                  Enable recording of customer credit/debt
                </p>
              </div>
              <button
                className={`toggle ${preferences.allowUtang ? "active" : ""}`}
                onClick={() => handleToggle("allowUtang")}
                aria-label="Toggle credit system"
              >
                <span className="toggle-slider"></span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Display</h3>
            <p className="card-description">Customize interface appearance</p>
          </div>

          <div className="form-grid">
            <div className="form-group full-width">
              <label className="form-label">Display Size</label>
              <select
                className="form-select"
                value={displaySize}
                onChange={(e) => setDisplaySize(e.target.value)}
              >
                <option>Small</option>
                <option>Medium (Recommended)</option>
                <option>Large</option>
              </select>
              <p className="form-hint">
                Adjust text and button sizes for better readability
              </p>
            </div>
          </div>

          <div className="card-footer">
            <button className="btn btn-primary" onClick={handleApplySettings}>
              Apply Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
