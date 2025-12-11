"use client";

import React, { useState, useEffect } from "react";
import {
  getAllCompanies,
  createCompany,
  deleteCompanyTenant,
  switchToCompany,
  setTenantPlan,
  type TenantInfo
} from "@/services/tenant";
import { PLANS, type PlanType } from "@/services/plans";
import { isBuilderMode } from "@/services/mode";

export default function TenantAdminConsole() {
  const [tenants, setTenants] = useState<TenantInfo[]>([]);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("FREE");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = () => {
    if (!isBuilderMode()) {
      setMessage("Builder mode required");
      return;
    }
    const companies = getAllCompanies();
    setTenants(companies);
  };

  const handleCreateCompany = async () => {
    if (!newCompanyName.trim()) {
      setMessage("Please enter a company name");
      return;
    }

    setLoading(true);
    try {
      const company = createCompany(newCompanyName, selectedPlan);
      if (company) {
        setMessage(`Company "${newCompanyName}" created successfully!`);
        setNewCompanyName("");
        loadTenants();
      } else {
        setMessage("Failed to create company");
      }
    } catch (error) {
      setMessage("Error creating company");
      console.error(error);
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleDeleteCompany = async (companyId: string, companyName: string) => {
    if (!confirm(`Are you sure you want to delete "${companyName}"? This cannot be undone.`)) {
      return;
    }

    setLoading(true);
    try {
      const success = deleteCompanyTenant(companyId);
      if (success) {
        setMessage(`Company "${companyName}" deleted`);
        loadTenants();
      } else {
        setMessage("Failed to delete company");
      }
    } catch (error) {
      setMessage("Error deleting company");
      console.error(error);
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleEnterCompany = (companyId: string) => {
    setLoading(true);
    try {
      const success = switchToCompany(companyId);
      if (success) {
        window.location.reload();
      } else {
        setMessage("Failed to switch company");
        setLoading(false);
      }
    } catch (error) {
      setMessage("Error switching company");
      console.error(error);
      setLoading(false);
    }
  };

  const handleUpdatePlan = (companyId: string, newPlan: PlanType) => {
    try {
      setTenantPlan(companyId, newPlan);
      setMessage("Plan updated successfully");
      loadTenants();
      setTimeout(() => setMessage(""), 2000);
    } catch (error) {
      setMessage("Failed to update plan");
      console.error(error);
    }
  };

  if (!isBuilderMode()) {
    return (
      <div className="tenant-admin-console">
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>Tenant Admin Console is only available in Builder Mode.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tenant-admin-console">
      <div className="console-header">
        <h1>Tenant Admin Console</h1>
        <p>Platform owner view - manage all companies</p>
      </div>

      {/* Create New Company */}
      <div className="create-company-section">
        <h2>Create New Company</h2>
        <div className="create-form">
          <input
            type="text"
            placeholder="Company name"
            value={newCompanyName}
            onChange={(e) => setNewCompanyName(e.target.value)}
            disabled={loading}
          />
          <select
            value={selectedPlan}
            onChange={(e) => setSelectedPlan(e.target.value as PlanType)}
            disabled={loading}
          >
            <option value="FREE">Free Plan</option>
            <option value="PRO">Pro Plan</option>
            <option value="ENTERPRISE">Enterprise Plan</option>
          </select>
          <button onClick={handleCreateCompany} disabled={loading || !newCompanyName.trim()}>
            {loading ? "Creating..." : "Create Company"}
          </button>
        </div>
      </div>

      {/* Companies List */}
      <div className="companies-section">
        <h2>All Companies ({tenants.length})</h2>
        <div className="companies-table">
          <table>
            <thead>
              <tr>
                <th>Company Name</th>
                <th>Reps</th>
                <th>Plan</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => (
                <tr key={tenant.id}>
                  <td>
                    <strong>{tenant.name}</strong>
                  </td>
                  <td>{tenant.repCount}</td>
                  <td>
                    <select
                      value={tenant.plan}
                      onChange={(e) => handleUpdatePlan(tenant.id, e.target.value as PlanType)}
                      className={`plan-badge ${tenant.plan.toLowerCase()}`}
                    >
                      <option value="FREE">Free</option>
                      <option value="PRO">Pro</option>
                      <option value="ENTERPRISE">Enterprise</option>
                    </select>
                  </td>
                  <td>{new Date(tenant.createdDate).toLocaleDateString()}</td>
                  <td>
                    <div className="actions">
                      <button
                        onClick={() => handleEnterCompany(tenant.id)}
                        className="btn-enter"
                        disabled={loading}
                        title="Enter Company"
                      >
                        Enter
                      </button>
                      <button
                        onClick={() => handleDeleteCompany(tenant.id, tenant.name)}
                        className="btn-delete"
                        disabled={loading}
                        title="Delete Company"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {tenants.length === 0 && (
            <div className="empty-state">
              <p>No companies found. Create your first company above.</p>
            </div>
          )}
        </div>
      </div>

      {message && (
        <div className={`message ${message.includes("success") || message.includes("created") ? "success" : "error"}`}>
          {message}
        </div>
      )}

      <style jsx>{`
        .tenant-admin-console {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .console-header {
          margin-bottom: 30px;
        }

        .console-header h1 {
          margin: 0 0 8px 0;
          font-size: 28px;
        }

        .console-header p {
          margin: 0;
          color: #666;
        }

        .create-company-section {
          background: #f9f9f9;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
        }

        .create-company-section h2 {
          margin: 0 0 16px 0;
          font-size: 18px;
        }

        .create-form {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .create-form input {
          flex: 1;
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .create-form select {
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .create-form button {
          padding: 10px 20px;
          background: #00d4ff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
          white-space: nowrap;
        }

        .create-form button:hover {
          background: #00b8e6;
        }

        .create-form button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .companies-section h2 {
          margin: 0 0 16px 0;
          font-size: 18px;
        }

        .companies-table {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        thead {
          background: #f5f5f5;
        }

        th {
          padding: 12px 16px;
          text-align: left;
          font-weight: 600;
          font-size: 14px;
          color: #333;
        }

        td {
          padding: 12px 16px;
          border-top: 1px solid #eee;
          font-size: 14px;
        }

        tbody tr:hover {
          background: #fafafa;
        }

        .plan-badge {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          border: 1px solid;
        }

        .plan-badge.free {
          background: #f0f0f0;
          color: #666;
          border-color: #ddd;
        }

        .plan-badge.pro {
          background: #e3f2fd;
          color: #1976d2;
          border-color: #1976d2;
        }

        .plan-badge.enterprise {
          background: #f3e5f5;
          color: #7b1fa2;
          border-color: #7b1fa2;
        }

        .actions {
          display: flex;
          gap: 8px;
        }

        .actions button {
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
        }

        .btn-enter {
          background: #4caf50;
          color: white;
        }

        .btn-enter:hover {
          background: #45a049;
        }

        .btn-delete {
          background: #f44336;
          color: white;
        }

        .btn-delete:hover {
          background: #da190b;
        }

        .actions button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .empty-state {
          padding: 40px;
          text-align: center;
          color: #666;
        }

        .message {
          position: fixed;
          bottom: 20px;
          right: 20px;
          padding: 12px 20px;
          border-radius: 4px;
          font-size: 14px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          z-index: 1000;
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

        .access-denied {
          text-align: center;
          padding: 60px 20px;
        }

        .access-denied h2 {
          margin: 0 0 12px 0;
          color: #f44336;
        }

        .access-denied p {
          color: #666;
        }

        @media (max-width: 768px) {
          .create-form {
            flex-direction: column;
          }

          .create-form input,
          .create-form select,
          .create-form button {
            width: 100%;
          }

          table {
            font-size: 12px;
          }

          th, td {
            padding: 8px;
          }

          .actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}
