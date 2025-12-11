"use client";

import React, { useState, useEffect } from "react";
import { getActiveCompany, addRep, updateRep, deleteRep, type Rep } from "@/services/companyStore";
import { logAudit } from "@/services/auditLog";

interface UserDirectoryProps {
  companyId: string;
}

export default function UserDirectory({ companyId }: UserDirectoryProps) {
  const [users, setUsers] = useState<Rep[]>([]);
  const [editingUser, setEditingUser] = useState<Rep | null>(null);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [formData, setFormData] = useState<Partial<Rep>>({
    name: "",
    email: "",
    phone: "",
    role: "rep",
    teamId: null
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadUsers();
  }, [companyId]);

  const loadUsers = () => {
    const company = getActiveCompany();
    if (company) {
      setUsers(company.reps);
    }
  };

  const handleAddUser = () => {
    if (!formData.name || !formData.email) {
      setMessage("Name and email are required");
      return;
    }

    try {
      const newUser = addRep(companyId, formData);
      if (newUser) {
        logAudit({
          action: "user_added",
          entity: "user",
          entityId: newUser.id,
          userId: "current-user",
          metadata: { name: newUser.name, role: newUser.role }
        });

        setMessage(`User "${formData.name}" added successfully`);
        setIsAddingUser(false);
        setFormData({
          name: "",
          email: "",
          phone: "",
          role: "rep",
          teamId: null
        });
        loadUsers();
      } else {
        setMessage("Failed to add user");
      }
    } catch (error) {
      setMessage("Error adding user");
      console.error(error);
    } finally {
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleUpdateUser = () => {
    if (!editingUser) return;

    try {
      const success = updateRep(companyId, editingUser);
      if (success) {
        logAudit({
          action: "user_updated",
          entity: "user",
          entityId: editingUser.id,
          userId: "current-user",
          metadata: { name: editingUser.name, role: editingUser.role }
        });

        setMessage(`User "${editingUser.name}" updated successfully`);
        setEditingUser(null);
        loadUsers();
      } else {
        setMessage("Failed to update user");
      }
    } catch (error) {
      setMessage("Error updating user");
      console.error(error);
    } finally {
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleDeleteUser = (user: Rep) => {
    if (!confirm(`Are you sure you want to remove "${user.name}"?`)) {
      return;
    }

    try {
      const success = deleteRep(companyId, user.id);
      if (success) {
        logAudit({
          action: "user_removed",
          entity: "user",
          entityId: user.id,
          userId: "current-user",
          metadata: { name: user.name }
        });

        setMessage(`User "${user.name}" removed`);
        loadUsers();
      } else {
        setMessage("Failed to remove user");
      }
    } catch (error) {
      setMessage("Error removing user");
      console.error(error);
    } finally {
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleEditChange = (field: keyof Rep, value: string) => {
    if (editingUser) {
      setEditingUser({ ...editingUser, [field]: value });
    }
  };

  const handleFormChange = (field: keyof Rep, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: "#f44336",
      manager: "#ff9800",
      rep: "#2196f3",
      installer: "#4caf50",
      finance: "#9c27b0"
    };
    return colors[role] || "#666";
  };

  const company = getActiveCompany();
  const teams = company?.teams || [];

  return (
    <div className="user-directory">
      <div className="directory-header">
        <h2>User Directory</h2>
        <button onClick={() => setIsAddingUser(true)} className="btn-add">
          Add User
        </button>
      </div>

      {/* Add User Form */}
      {isAddingUser && (
        <div className="user-form">
          <h3>Add New User</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="add-name">Name</label>
              <input
                id="add-name"
                type="text"
                value={formData.name || ""}
                onChange={(e) => handleFormChange("name", e.target.value)}
                placeholder="Full name"
              />
            </div>
            <div className="form-group">
              <label htmlFor="add-email">Email</label>
              <input
                id="add-email"
                type="email"
                value={formData.email || ""}
                onChange={(e) => handleFormChange("email", e.target.value)}
                placeholder="email@example.com"
              />
            </div>
            <div className="form-group">
              <label htmlFor="add-phone">Phone</label>
              <input
                id="add-phone"
                type="tel"
                value={formData.phone || ""}
                onChange={(e) => handleFormChange("phone", e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
            <div className="form-group">
              <label htmlFor="add-role">Role</label>
              <select
                id="add-role"
                value={formData.role || "rep"}
                onChange={(e) => handleFormChange("role", e.target.value)}
              >
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="rep">Rep</option>
                <option value="installer">Installer</option>
                <option value="finance">Finance</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="add-team">Team</label>
              <select
                id="add-team"
                value={formData.teamId || ""}
                onChange={(e) => handleFormChange("teamId", e.target.value)}
              >
                <option value="">No Team</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-actions">
            <button onClick={handleAddUser} className="btn-primary">
              Add User
            </button>
            <button onClick={() => setIsAddingUser(false)} className="btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Team</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                {editingUser?.id === user.id ? (
                  <>
                    <td>
                      <input
                        type="text"
                        value={editingUser.name}
                        onChange={(e) => handleEditChange("name", e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="email"
                        value={editingUser.email}
                        onChange={(e) => handleEditChange("email", e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="tel"
                        value={editingUser.phone}
                        onChange={(e) => handleEditChange("phone", e.target.value)}
                      />
                    </td>
                    <td>
                      <select
                        value={editingUser.role}
                        onChange={(e) => handleEditChange("role", e.target.value)}
                      >
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                        <option value="rep">Rep</option>
                        <option value="installer">Installer</option>
                        <option value="finance">Finance</option>
                      </select>
                    </td>
                    <td>
                      <select
                        value={editingUser.teamId || ""}
                        onChange={(e) => handleEditChange("teamId", e.target.value)}
                      >
                        <option value="">No Team</option>
                        {teams.map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <span className={`status-badge ${editingUser.isActive ? "active" : "inactive"}`}>
                        {editingUser.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className="actions">
                        <button onClick={handleUpdateUser} className="btn-save" title="Save">
                          Save
                        </button>
                        <button onClick={() => setEditingUser(null)} className="btn-cancel" title="Cancel">
                          Cancel
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td>
                      <strong>{user.name}</strong>
                    </td>
                    <td>{user.email}</td>
                    <td>{user.phone}</td>
                    <td>
                      <span className="role-badge" style={{ backgroundColor: getRoleColor(user.role) }}>
                        {user.role}
                      </span>
                    </td>
                    <td>{teams.find((t) => t.id === user.teamId)?.name || "-"}</td>
                    <td>
                      <span className={`status-badge ${user.isActive ? "active" : "inactive"}`}>
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className="actions">
                        <button onClick={() => setEditingUser(user)} className="btn-edit" title="Edit">
                          Edit
                        </button>
                        <button onClick={() => handleDeleteUser(user)} className="btn-delete" title="Remove">
                          Remove
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="empty-state">
            <p>No users found. Add your first user above.</p>
          </div>
        )}
      </div>

      {message && (
        <div className={`message ${message.includes("success") ? "success" : "error"}`}>
          {message}
        </div>
      )}

      <style jsx>{`
        .user-directory {
          max-width: 1200px;
        }

        .directory-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .directory-header h2 {
          margin: 0;
        }

        .btn-add {
          padding: 10px 20px;
          background: #4caf50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
        }

        .btn-add:hover {
          background: #45a049;
        }

        .user-form {
          background: #f9f9f9;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .user-form h3 {
          margin: 0 0 16px 0;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group label {
          font-weight: 600;
          font-size: 14px;
        }

        .form-group input,
        .form-group select {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .form-actions {
          display: flex;
          gap: 12px;
        }

        .btn-primary {
          padding: 10px 20px;
          background: #2196f3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
        }

        .btn-primary:hover {
          background: #1976d2;
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

        .users-table {
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

        td input,
        td select {
          padding: 6px 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 13px;
          width: 100%;
        }

        .role-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          color: white;
          text-transform: capitalize;
        }

        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .status-badge.active {
          background: #d4edda;
          color: #155724;
        }

        .status-badge.inactive {
          background: #f8d7da;
          color: #721c24;
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

        .btn-edit {
          background: #2196f3;
          color: white;
        }

        .btn-edit:hover {
          background: #1976d2;
        }

        .btn-delete {
          background: #f44336;
          color: white;
        }

        .btn-delete:hover {
          background: #da190b;
        }

        .btn-save {
          background: #4caf50;
          color: white;
        }

        .btn-save:hover {
          background: #45a049;
        }

        .btn-cancel {
          background: #9e9e9e;
          color: white;
        }

        .btn-cancel:hover {
          background: #757575;
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

        @media (max-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr;
          }

          table {
            font-size: 12px;
          }

          th, td {
            padding: 8px;
          }
        }
      `}</style>
    </div>
  );
}
