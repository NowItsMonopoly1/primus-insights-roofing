"use client";

import React, { useState, useEffect } from "react";
import { loadBrand, saveBrand, applyBrand, type BrandConfig } from "@/services/branding";
import { logAudit } from "@/services/auditLog";

interface BrandingEditorProps {
  companyId: string;
}

export default function BrandingEditor({ companyId }: BrandingEditorProps) {
  const [brand, setBrand] = useState<BrandConfig>({
    name: "Primus Home Pro",
    logoUrl: "",
    primaryColor: "#00ff99",
    accentColor: "#0044ff",
    sidebarBgColor: "#1a1a1a",
    darkMode: true,
    customDomain: ""
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loaded = loadBrand(companyId);
    setBrand(loaded);
  }, [companyId]);

  const handleChange = (field: keyof BrandConfig, value: string | boolean) => {
    setBrand(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage("");

      saveBrand(companyId, brand);
      applyBrand(brand);

      logAudit({
        action: "branding_updated",
        entity: "company",
        entityId: companyId,
        userId: "current-user", // Will be replaced with actual user context
        metadata: { brandName: brand.name }
      });

      setMessage("Branding saved successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage("Failed to save branding");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    const defaultBrand: BrandConfig = {
      name: "Primus Home Pro",
      logoUrl: "",
      primaryColor: "#00ff99",
      accentColor: "#0044ff",
      sidebarBgColor: "#1a1a1a",
      darkMode: true,
      customDomain: ""
    };
    setBrand(defaultBrand);
  };

  return (
    <div className="branding-editor">
      <div className="branding-editor-header">
        <h2>White-Label Branding</h2>
        <p>Customize your platform appearance</p>
      </div>

      <div className="branding-editor-content">
        {/* App Name */}
        <div className="form-group">
          <label htmlFor="brand-name">Application Name</label>
          <input
            id="brand-name"
            type="text"
            value={brand.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="Enter app name"
          />
        </div>

        {/* Logo URL */}
        <div className="form-group">
          <label htmlFor="brand-logo">Logo URL</label>
          <input
            id="brand-logo"
            type="text"
            value={brand.logoUrl}
            onChange={(e) => handleChange("logoUrl", e.target.value)}
            placeholder="https://example.com/logo.png"
          />
          {brand.logoUrl && (
            <div className="logo-preview">
              <img src={brand.logoUrl} alt="Logo preview" style={{ maxHeight: "60px", marginTop: "10px" }} />
            </div>
          )}
        </div>

        {/* Primary Color */}
        <div className="form-group">
          <label htmlFor="brand-primary">Primary Color</label>
          <div className="color-input-group">
            <input
              id="brand-primary"
              type="color"
              value={brand.primaryColor}
              onChange={(e) => handleChange("primaryColor", e.target.value)}
            />
            <input
              type="text"
              value={brand.primaryColor}
              onChange={(e) => handleChange("primaryColor", e.target.value)}
              placeholder="#00ff99"
            />
          </div>
        </div>

        {/* Accent Color */}
        <div className="form-group">
          <label htmlFor="brand-accent">Accent Color</label>
          <div className="color-input-group">
            <input
              id="brand-accent"
              type="color"
              value={brand.accentColor}
              onChange={(e) => handleChange("accentColor", e.target.value)}
            />
            <input
              type="text"
              value={brand.accentColor}
              onChange={(e) => handleChange("accentColor", e.target.value)}
              placeholder="#0044ff"
            />
          </div>
        </div>

        {/* Sidebar Background */}
        <div className="form-group">
          <label htmlFor="brand-sidebar">Sidebar Background</label>
          <div className="color-input-group">
            <input
              id="brand-sidebar"
              type="color"
              value={brand.sidebarBgColor}
              onChange={(e) => handleChange("sidebarBgColor", e.target.value)}
            />
            <input
              type="text"
              value={brand.sidebarBgColor}
              onChange={(e) => handleChange("sidebarBgColor", e.target.value)}
              placeholder="#1a1a1a"
            />
          </div>
        </div>

        {/* Dark Mode Toggle */}
        <div className="form-group">
          <label htmlFor="brand-dark-mode">
            <input
              id="brand-dark-mode"
              type="checkbox"
              checked={brand.darkMode}
              onChange={(e) => handleChange("darkMode", e.target.checked)}
            />
            Dark Mode
          </label>
        </div>

        {/* Custom Domain */}
        <div className="form-group">
          <label htmlFor="brand-domain">Custom Domain</label>
          <input
            id="brand-domain"
            type="text"
            value={brand.customDomain}
            onChange={(e) => handleChange("customDomain", e.target.value)}
            placeholder="app.yourcompany.com"
          />
          <small>Custom domain configuration (placeholder)</small>
        </div>

        {/* Preview Section */}
        <div className="branding-preview">
          <h3>Preview</h3>
          <div
            className="preview-box"
            style={{
              backgroundColor: brand.darkMode ? "#1a1a1a" : "#ffffff",
              color: brand.darkMode ? "#ffffff" : "#000000",
              border: `2px solid ${brand.primaryColor}`,
              padding: "20px",
              borderRadius: "8px"
            }}
          >
            <h4 style={{ color: brand.primaryColor }}>{brand.name}</h4>
            <button
              style={{
                backgroundColor: brand.accentColor,
                color: "#fff",
                border: "none",
                padding: "8px 16px",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              Sample Button
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="branding-actions">
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? "Saving..." : "Save Branding"}
          </button>
          <button onClick={handleReset} className="btn-secondary">
            Reset to Default
          </button>
        </div>

        {message && (
          <div className={`message ${message.includes("success") ? "success" : "error"}`}>
            {message}
          </div>
        )}
      </div>

      <style jsx>{`
        .branding-editor {
          max-width: 800px;
        }

        .branding-editor-header {
          margin-bottom: 24px;
        }

        .branding-editor-header h2 {
          margin: 0 0 8px 0;
        }

        .branding-editor-header p {
          margin: 0;
          color: #666;
        }

        .branding-editor-content {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          font-weight: 600;
          font-size: 14px;
        }

        .form-group input[type="text"] {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .form-group small {
          color: #666;
          font-size: 12px;
        }

        .color-input-group {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .color-input-group input[type="color"] {
          width: 60px;
          height: 40px;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
        }

        .color-input-group input[type="text"] {
          flex: 1;
        }

        .branding-preview {
          margin-top: 20px;
          padding: 20px;
          background: #f9f9f9;
          border-radius: 8px;
        }

        .branding-preview h3 {
          margin: 0 0 16px 0;
        }

        .preview-box {
          min-height: 120px;
        }

        .branding-actions {
          display: flex;
          gap: 12px;
          margin-top: 20px;
        }

        .btn-primary {
          padding: 10px 20px;
          background: var(--brand-accent, #0044ff);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
        }

        .btn-primary:hover {
          opacity: 0.9;
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-secondary {
          padding: 10px 20px;
          background: white;
          color: #333;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
        }

        .btn-secondary:hover {
          background: #f5f5f5;
        }

        .message {
          padding: 12px;
          border-radius: 4px;
          font-size: 14px;
        }

        .message.success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .message.error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }
      `}</style>
    </div>
  );
}
