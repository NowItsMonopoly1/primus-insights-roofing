/**
 * Audit Logging System
 * Enterprise-grade change tracking for Primus Home Pro
 * 
 * Tracks: who, when, what, before/after values for all critical operations
 */

import { getActiveCompanyId } from './companyStore';

// =============================================================================
// Types
// =============================================================================

export type AuditObjectType = 
  | 'Lead'
  | 'Project'
  | 'Commission'
  | 'Settings'
  | 'SLA'
  | 'Stage'
  | 'Pipeline'
  | 'Rep'
  | 'Installer'
  | 'CustomField'
  | 'CommissionRule'
  | 'Team'
  | 'Company';

export type AuditActionType = 'create' | 'update' | 'delete' | 'override' | 'import' | 'export';

export interface AuditLogEntry {
  id: string;
  companyId: string;
  userId: string;
  userName: string;
  timestamp: number;
  objectType: AuditObjectType;
  objectId: string;
  action: AuditActionType;
  before: any | null;
  after: any | null;
  metadata?: Record<string, any>;
}

export interface AuditLogFilters {
  startDate?: number;
  endDate?: number;
  userId?: string;
  objectType?: AuditObjectType;
  action?: AuditActionType;
  objectId?: string;
}

// =============================================================================
// Storage Keys
// =============================================================================

const AUDIT_LOG_KEY = (companyId: string) => `primus_audit_log_${companyId}`;
const MAX_LOG_ENTRIES = 10000; // Prevent localStorage overflow

// =============================================================================
// UUID Generator
// =============================================================================

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// =============================================================================
// Core Functions
// =============================================================================

/**
 * Load all audit logs for a company
 */
export function loadAuditLogs(companyId?: string): AuditLogEntry[] {
  const targetCompanyId = companyId || getActiveCompanyId();
  try {
    const stored = localStorage.getItem(AUDIT_LOG_KEY(targetCompanyId));
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('Failed to load audit logs:', e);
    return [];
  }
}

/**
 * Save audit logs for a company
 */
function saveAuditLogs(companyId: string, logs: AuditLogEntry[]): void {
  try {
    // Trim to max entries (keep most recent)
    const trimmedLogs = logs.slice(-MAX_LOG_ENTRIES);
    localStorage.setItem(AUDIT_LOG_KEY(companyId), JSON.stringify(trimmedLogs));
  } catch (e) {
    console.error('Failed to save audit logs:', e);
  }
}

/**
 * Log an action to the audit trail
 */
export function logAction(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
  const companyId = entry.companyId || getActiveCompanyId();
  
  const fullEntry: AuditLogEntry = {
    ...entry,
    id: generateUUID(),
    companyId,
    timestamp: Date.now()
  };
  
  const logs = loadAuditLogs(companyId);
  logs.push(fullEntry);
  saveAuditLogs(companyId, logs);
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[AUDIT] ${fullEntry.userName} ${fullEntry.action} ${fullEntry.objectType}:${fullEntry.objectId}`);
  }
  
  return fullEntry;
}

/**
 * Get filtered audit logs
 */
export function getLogs(companyId?: string, filters?: AuditLogFilters): AuditLogEntry[] {
  const targetCompanyId = companyId || getActiveCompanyId();
  let logs = loadAuditLogs(targetCompanyId);
  
  if (!filters) return logs.sort((a, b) => b.timestamp - a.timestamp);
  
  // Apply filters
  if (filters.startDate) {
    logs = logs.filter(log => log.timestamp >= filters.startDate!);
  }
  
  if (filters.endDate) {
    logs = logs.filter(log => log.timestamp <= filters.endDate!);
  }
  
  if (filters.userId) {
    logs = logs.filter(log => log.userId === filters.userId);
  }
  
  if (filters.objectType) {
    logs = logs.filter(log => log.objectType === filters.objectType);
  }
  
  if (filters.action) {
    logs = logs.filter(log => log.action === filters.action);
  }
  
  if (filters.objectId) {
    logs = logs.filter(log => log.objectId === filters.objectId);
  }
  
  // Sort by most recent first
  return logs.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Clear all audit logs for a company
 */
export function clearLogs(companyId?: string): void {
  const targetCompanyId = companyId || getActiveCompanyId();
  localStorage.removeItem(AUDIT_LOG_KEY(targetCompanyId));
}

/**
 * Get audit log statistics
 */
export function getLogStats(companyId?: string): {
  totalEntries: number;
  byAction: Record<AuditActionType, number>;
  byObjectType: Record<string, number>;
  recentActivity: AuditLogEntry[];
} {
  const logs = loadAuditLogs(companyId);
  
  const byAction: Record<string, number> = {};
  const byObjectType: Record<string, number> = {};
  
  logs.forEach(log => {
    byAction[log.action] = (byAction[log.action] || 0) + 1;
    byObjectType[log.objectType] = (byObjectType[log.objectType] || 0) + 1;
  });
  
  return {
    totalEntries: logs.length,
    byAction: byAction as Record<AuditActionType, number>,
    byObjectType,
    recentActivity: logs.slice(-10).reverse()
  };
}

/**
 * Export audit logs as JSON
 */
export function exportAuditLogs(companyId?: string): string {
  const logs = loadAuditLogs(companyId);
  return JSON.stringify(logs, null, 2);
}

/**
 * Get unique users from audit logs
 */
export function getAuditUsers(companyId?: string): { userId: string; userName: string }[] {
  const logs = loadAuditLogs(companyId);
  const userMap = new Map<string, string>();
  
  logs.forEach(log => {
    if (!userMap.has(log.userId)) {
      userMap.set(log.userId, log.userName);
    }
  });
  
  return Array.from(userMap.entries()).map(([userId, userName]) => ({ userId, userName }));
}

// =============================================================================
// Helper: Get Current User Info
// =============================================================================

/**
 * Get current user info for audit logging
 * Falls back to defaults if user profile not available
 */
export function getCurrentAuditUser(): { userId: string; userName: string } {
  // Try to get from localStorage (set by app on login)
  try {
    const stored = localStorage.getItem('primus_current_user');
    if (stored) {
      const user = JSON.parse(stored);
      return { userId: user.id || 'system', userName: user.name || 'System' };
    }
  } catch {
    // Fallback
  }
  
  return { userId: 'admin', userName: 'Admin User' };
}

// =============================================================================
// Convenience Logging Functions
// =============================================================================

/**
 * Log a create action
 */
export function logCreate(
  objectType: AuditObjectType,
  objectId: string,
  data: any,
  metadata?: Record<string, any>
): AuditLogEntry {
  const user = getCurrentAuditUser();
  return logAction({
    companyId: getActiveCompanyId(),
    userId: user.userId,
    userName: user.userName,
    objectType,
    objectId,
    action: 'create',
    before: null,
    after: data,
    metadata
  });
}

/**
 * Log an update action
 */
export function logUpdate(
  objectType: AuditObjectType,
  objectId: string,
  before: any,
  after: any,
  metadata?: Record<string, any>
): AuditLogEntry {
  const user = getCurrentAuditUser();
  return logAction({
    companyId: getActiveCompanyId(),
    userId: user.userId,
    userName: user.userName,
    objectType,
    objectId,
    action: 'update',
    before,
    after,
    metadata
  });
}

/**
 * Log a delete action
 */
export function logDelete(
  objectType: AuditObjectType,
  objectId: string,
  data: any,
  metadata?: Record<string, any>
): AuditLogEntry {
  const user = getCurrentAuditUser();
  return logAction({
    companyId: getActiveCompanyId(),
    userId: user.userId,
    userName: user.userName,
    objectType,
    objectId,
    action: 'delete',
    before: data,
    after: null,
    metadata
  });
}

/**
 * Log an override action (admin intervention)
 */
export function logOverride(
  objectType: AuditObjectType,
  objectId: string,
  before: any,
  after: any,
  reason?: string
): AuditLogEntry {
  const user = getCurrentAuditUser();
  return logAction({
    companyId: getActiveCompanyId(),
    userId: user.userId,
    userName: user.userName,
    objectType,
    objectId,
    action: 'override',
    before,
    after,
    metadata: reason ? { reason } : undefined
  });
}

/**
 * Log an import action
 */
export function logImport(
  objectType: AuditObjectType,
  count: number,
  metadata?: Record<string, any>
): AuditLogEntry {
  const user = getCurrentAuditUser();
  return logAction({
    companyId: getActiveCompanyId(),
    userId: user.userId,
    userName: user.userName,
    objectType,
    objectId: 'bulk-import',
    action: 'import',
    before: null,
    after: { count },
    metadata
  });
}

/**
 * Log an export action
 */
export function logExport(
  objectType: AuditObjectType,
  count: number,
  metadata?: Record<string, any>
): AuditLogEntry {
  const user = getCurrentAuditUser();
  return logAction({
    companyId: getActiveCompanyId(),
    userId: user.userId,
    userName: user.userName,
    objectType,
    objectId: 'bulk-export',
    action: 'export',
    before: null,
    after: { count },
    metadata
  });
}
