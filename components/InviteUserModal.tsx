"use client";

import React, { useState, useEffect } from "react";
import { createInvite, getInvites, acceptInvite, deleteInvite, type Invitation } from "@/services/invitations";
import { logAudit } from "@/services/auditLog";

interface InviteUserModalProps {
  companyId: string;
  onClose: () => void;
}

export default function InviteUserModal({ companyId, onClose }: InviteUserModalProps) {
  const [invites, setInvites] = useState<Invitation[]>([]);
  const [selectedRole, setSelectedRole] = useState<"admin" | "manager" | "rep" | "installer" | "finance">("rep");
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [message, setMessage] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");

  useEffect(() => {
    loadInvites();
  }, [companyId]);

  const loadInvites = () => {
    const allInvites = getInvites(companyId);
    setInvites(allInvites);
  };

  const handleCreateInvite = () => {
    try {
      const invite = createInvite(companyId, selectedRole, expiresInDays);

      logAudit({
        action: "invitation_created",
        entity: "invitation",
        entityId: invite.id,
        userId: "current-user",
        metadata: { role: selectedRole, expiresAt: invite.expiresAt }
      });

      setGeneratedCode(invite.code);
      setMessage("Invitation created successfully!");
      loadInvites();
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage("Failed to create invitation");
      console.error(error);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setMessage("Code copied to clipboard!");
    setTimeout(() => setMessage(""), 2000);
  };

  const handleDeleteInvite = (inviteId: string) => {
    if (!confirm("Are you sure you want to revoke this invitation?")) {
      return;
    }

    try {
      deleteInvite(inviteId);
      setMessage("Invitation revoked");
      loadInvites();
      setTimeout(() => setMessage(""), 2000);
    } catch (error) {
      setMessage("Failed to revoke invitation");
      console.error(error);
    }
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>User Invitations</h2>
          <button onClick={onClose} className="close-button" title="Close">
            ×
          </button>
        </div>

        <div className="modal-body">
          {/* Create New Invitation */}
          <div className="create-section">
            <h3>Create New Invitation</h3>
            <p className="info-text">
              Generate a one-time invitation code that users can enter to join your company.
            </p>

            <div className="form-group">
              <label htmlFor="invite-role">Role</label>
              <select
                id="invite-role"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as any)}
              >
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="rep">Rep</option>
                <option value="installer">Installer</option>
                <option value="finance">Finance</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="invite-expires">Expires In (days)</label>
              <input
                id="invite-expires"
                type="number"
                min="1"
                max="90"
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(parseInt(e.target.value) || 7)}
              />
            </div>

            <button onClick={handleCreateInvite} className="btn-create">
              Generate Invitation Code
            </button>

            {generatedCode && (
              <div className="generated-code">
                <h4>Generated Code:</h4>
                <div className="code-display">
                  <code>{generatedCode}</code>
                  <button onClick={() => handleCopyCode(generatedCode)} className="btn-copy" title="Copy code">
                    Copy
                  </button>
                </div>
                <p className="code-note">
                  Share this code with the user. They can enter it during sign-up to join your company.
                </p>
              </div>
            )}
          </div>

          {/* Active Invitations */}
          <div className="invites-section">
            <h3>Active Invitations ({invites.filter(i => !isExpired(i.expiresAt)).length})</h3>

            {invites.length > 0 ? (
              <div className="invites-list">
                {invites.map((invite) => (
                  <div
                    key={invite.id}
                    className={`invite-item ${isExpired(invite.expiresAt) ? "expired" : ""}`}
                  >
                    <div className="invite-info">
                      <div className="invite-code">
                        <strong>Code:</strong> <code>{invite.code}</code>
                        <button
                          onClick={() => handleCopyCode(invite.code)}
                          className="btn-copy-small"
                          title="Copy"
                        >
                          Copy
                        </button>
                      </div>
                      <div className="invite-details">
                        <span className="invite-role">Role: {invite.role}</span>
                        <span className="invite-expires">
                          {isExpired(invite.expiresAt) ? "Expired" : "Expires"}: {formatDate(invite.expiresAt)}
                        </span>
                        {invite.usedAt && (
                          <span className="invite-used">Used: {formatDate(invite.usedAt)}</span>
                        )}
                      </div>
                    </div>
                    <div className="invite-actions">
                      {!invite.usedAt && !isExpired(invite.expiresAt) && (
                        <button
                          onClick={() => handleDeleteInvite(invite.id)}
                          className="btn-revoke"
                          title="Revoke"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-text">No invitations created yet.</p>
            )}
          </div>
        </div>

        {message && (
          <div className={`message ${message.includes("success") || message.includes("copied") ? "success" : "error"}`}>
            {message}
          </div>
        )}

        <style jsx>{`
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }

          .modal-content {
            background: white;
            border-radius: 8px;
            width: 90%;
            max-width: 700px;
            max-height: 90vh;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            border-bottom: 1px solid #eee;
          }

          .modal-header h2 {
            margin: 0;
            font-size: 22px;
          }

          .close-button {
            background: none;
            border: none;
            font-size: 32px;
            cursor: pointer;
            color: #666;
            line-height: 1;
            padding: 0;
            width: 32px;
            height: 32px;
          }

          .close-button:hover {
            color: #000;
          }

          .modal-body {
            padding: 20px;
            overflow-y: auto;
          }

          .create-section {
            background: #f9f9f9;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 24px;
          }

          .create-section h3 {
            margin: 0 0 8px 0;
            font-size: 18px;
          }

          .info-text {
            margin: 0 0 16px 0;
            color: #666;
            font-size: 14px;
          }

          .form-group {
            margin-bottom: 16px;
          }

          .form-group label {
            display: block;
            font-weight: 600;
            margin-bottom: 6px;
            font-size: 14px;
          }

          .form-group select,
          .form-group input {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
          }

          .btn-create {
            padding: 10px 20px;
            background: #4caf50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 600;
            width: 100%;
          }

          .btn-create:hover {
            background: #45a049;
          }

          .generated-code {
            margin-top: 20px;
            padding: 16px;
            background: white;
            border-radius: 4px;
            border: 2px solid #4caf50;
          }

          .generated-code h4 {
            margin: 0 0 12px 0;
            font-size: 16px;
            color: #4caf50;
          }

          .code-display {
            display: flex;
            gap: 12px;
            align-items: center;
            margin-bottom: 12px;
          }

          .code-display code {
            flex: 1;
            padding: 12px;
            background: #f5f5f5;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 16px;
            font-weight: 600;
            letter-spacing: 2px;
          }

          .btn-copy {
            padding: 10px 16px;
            background: #2196f3;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 600;
            white-space: nowrap;
          }

          .btn-copy:hover {
            background: #1976d2;
          }

          .code-note {
            margin: 0;
            font-size: 13px;
            color: #666;
          }

          .invites-section h3 {
            margin: 0 0 16px 0;
            font-size: 18px;
          }

          .invites-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .invite-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px;
            background: #f9f9f9;
            border-radius: 6px;
            border: 1px solid #eee;
          }

          .invite-item.expired {
            opacity: 0.6;
            background: #fafafa;
          }

          .invite-info {
            flex: 1;
          }

          .invite-code {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 8px;
          }

          .invite-code code {
            padding: 4px 8px;
            background: white;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
            font-weight: 600;
          }

          .btn-copy-small {
            padding: 4px 12px;
            background: #2196f3;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 600;
          }

          .btn-copy-small:hover {
            background: #1976d2;
          }

          .invite-details {
            display: flex;
            gap: 16px;
            flex-wrap: wrap;
            font-size: 13px;
            color: #666;
          }

          .invite-role {
            font-weight: 600;
          }

          .invite-used {
            color: #4caf50;
            font-weight: 600;
          }

          .btn-revoke {
            padding: 8px 16px;
            background: #f44336;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 600;
          }

          .btn-revoke:hover {
            background: #da190b;
          }

          .empty-text {
            color: #666;
            font-size: 14px;
            text-align: center;
            padding: 20px;
          }

          .message {
            position: absolute;
            bottom: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 4px;
            font-size: 14px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
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
            .modal-content {
              width: 95%;
              max-height: 95vh;
            }

            .code-display {
              flex-direction: column;
            }

            .btn-copy {
              width: 100%;
            }

            .invite-item {
              flex-direction: column;
              align-items: flex-start;
              gap: 12px;
            }

            .invite-code {
              flex-direction: column;
              align-items: flex-start;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
