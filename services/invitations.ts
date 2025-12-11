/**
 * User Invitation System
 * Local/offline invitation system using one-time codes
 */

export interface Invitation {
  id: string;
  code: string;
  companyId: string;
  role: "admin" | "manager" | "rep" | "installer" | "finance";
  createdAt: string;
  expiresAt: string;
  usedAt?: string;
  usedBy?: string;
}

const STORAGE_KEY = "user_invitations";

/**
 * Generate a random invitation code
 */
function generateInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  // Format as XXXX-XXXX
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

/**
 * Generate a simple ID
 */
function generateId(): string {
  return `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Load all invitations from storage
 */
function loadInvitations(): Invitation[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Failed to load invitations:", error);
  }
  return [];
}

/**
 * Save invitations to storage
 */
function saveInvitations(invitations: Invitation[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invitations));
  } catch (error) {
    console.error("Failed to save invitations:", error);
    throw error;
  }
}

/**
 * Create a new invitation
 */
export function createInvite(
  companyId: string,
  role: Invitation["role"],
  expiresInDays: number = 7
): Invitation {
  const invitations = loadInvitations();

  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000);

  const invitation: Invitation = {
    id: generateId(),
    code: generateInviteCode(),
    companyId,
    role,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString()
  };

  invitations.push(invitation);
  saveInvitations(invitations);

  return invitation;
}

/**
 * Get all invitations for a company
 */
export function getInvites(companyId: string): Invitation[] {
  const invitations = loadInvitations();
  return invitations.filter((inv) => inv.companyId === companyId);
}

/**
 * Get invitation by code
 */
export function getInviteByCode(code: string): Invitation | null {
  const invitations = loadInvitations();
  return invitations.find((inv) => inv.code === code.toUpperCase()) || null;
}

/**
 * Validate an invitation code
 */
export function validateInvite(code: string): {
  valid: boolean;
  reason?: string;
  invitation?: Invitation;
} {
  const invitation = getInviteByCode(code);

  if (!invitation) {
    return { valid: false, reason: "Invalid invitation code" };
  }

  if (invitation.usedAt) {
    return { valid: false, reason: "Invitation code already used" };
  }

  const now = new Date();
  const expiresAt = new Date(invitation.expiresAt);

  if (now > expiresAt) {
    return { valid: false, reason: "Invitation code has expired" };
  }

  return { valid: true, invitation };
}

/**
 * Accept an invitation (mark as used)
 */
export function acceptInvite(code: string, userId: string): Invitation | null {
  const invitations = loadInvitations();
  const index = invitations.findIndex((inv) => inv.code === code.toUpperCase());

  if (index === -1) {
    return null;
  }

  const invitation = invitations[index];

  // Validate before accepting
  const validation = validateInvite(code);
  if (!validation.valid) {
    throw new Error(validation.reason);
  }

  // Mark as used
  invitation.usedAt = new Date().toISOString();
  invitation.usedBy = userId;

  invitations[index] = invitation;
  saveInvitations(invitations);

  return invitation;
}

/**
 * Delete (revoke) an invitation
 */
export function deleteInvite(inviteId: string): boolean {
  const invitations = loadInvitations();
  const index = invitations.findIndex((inv) => inv.id === inviteId);

  if (index === -1) {
    return false;
  }

  invitations.splice(index, 1);
  saveInvitations(invitations);
  return true;
}

/**
 * Clean up expired invitations
 */
export function cleanupExpiredInvites(companyId?: string): number {
  const invitations = loadInvitations();
  const now = new Date();

  const filtered = invitations.filter((inv) => {
    // Skip if company filter is specified and doesn't match
    if (companyId && inv.companyId !== companyId) {
      return true;
    }

    // Remove if expired or used
    const expiresAt = new Date(inv.expiresAt);
    return now <= expiresAt && !inv.usedAt;
  });

  const removed = invitations.length - filtered.length;
  if (removed > 0) {
    saveInvitations(filtered);
  }

  return removed;
}

/**
 * Get invitation statistics for a company
 */
export function getInviteStats(companyId: string) {
  const invitations = getInvites(companyId);
  const now = new Date();

  const active = invitations.filter(
    (inv) => !inv.usedAt && new Date(inv.expiresAt) > now
  ).length;
  const used = invitations.filter((inv) => inv.usedAt).length;
  const expired = invitations.filter(
    (inv) => !inv.usedAt && new Date(inv.expiresAt) <= now
  ).length;

  return {
    total: invitations.length,
    active,
    used,
    expired
  };
}
