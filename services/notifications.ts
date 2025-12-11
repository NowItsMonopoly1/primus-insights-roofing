// services/notifications.ts
// Notifications Engine - In-app alerts and notification management

import { getActiveCompanyId } from './companyStore';

const NOTIFICATIONS_KEY = 'primus_notifications';

// Simple UUID generator
function generateId(): string {
  return 'notif_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
}

// Notification types
export type NotificationType = 
  | 'lead'
  | 'project'
  | 'commission'
  | 'sla'
  | 'revenue'
  | 'digest'
  | 'system'
  | 'installer'
  | 'rep';

// Priority levels
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Notification {
  id: string;
  companyId: string;
  userId: string | null; // null = company-wide alert
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>; // Additional context (lead ID, project ID, etc.)
  priority: NotificationPriority;
  createdAt: number; // Unix timestamp
  read: boolean;
  readAt?: number;
  actionUrl?: string; // Optional deep link
  expiresAt?: number; // Optional expiration
}

export interface NotificationStore {
  notifications: Notification[];
  lastDigestAt: number; // Last time digest was generated
}

// Load all notifications for a company
export function loadNotifications(companyId?: string): NotificationStore {
  const activeCompany = companyId || getActiveCompanyId();
  const key = `${NOTIFICATIONS_KEY}_${activeCompany}`;

  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Failed to load notifications:', e);
  }

  return {
    notifications: [],
    lastDigestAt: 0,
  };
}

// Save notifications
function saveNotifications(companyId: string, store: NotificationStore): void {
  const key = `${NOTIFICATIONS_KEY}_${companyId}`;
  localStorage.setItem(key, JSON.stringify(store));
}

// Create and save a new notification
export function notify(notification: Omit<Notification, 'id' | 'createdAt' | 'read'>): Notification {
  const companyId = notification.companyId || getActiveCompanyId();
  const store = loadNotifications(companyId);

  const newNotification: Notification = {
    ...notification,
    id: generateId(),
    companyId,
    createdAt: Date.now(),
    read: false,
  };

  store.notifications.unshift(newNotification);
  
  // Keep only the last 500 notifications
  if (store.notifications.length > 500) {
    store.notifications = store.notifications.slice(0, 500);
  }

  saveNotifications(companyId, store);
  
  return newNotification;
}

// Get notifications with optional filters
export interface NotificationFilters {
  type?: NotificationType | NotificationType[];
  userId?: string | null;
  unreadOnly?: boolean;
  limit?: number;
  since?: number; // Unix timestamp
}

export function getNotifications(companyId?: string, filters?: NotificationFilters): Notification[] {
  const activeCompany = companyId || getActiveCompanyId();
  const store = loadNotifications(activeCompany);
  
  let notifications = [...store.notifications];

  // Filter by type
  if (filters?.type) {
    const types = Array.isArray(filters.type) ? filters.type : [filters.type];
    notifications = notifications.filter(n => types.includes(n.type));
  }

  // Filter by user (null = company-wide)
  if (filters?.userId !== undefined) {
    notifications = notifications.filter(n => 
      n.userId === filters.userId || n.userId === null
    );
  }

  // Filter unread only
  if (filters?.unreadOnly) {
    notifications = notifications.filter(n => !n.read);
  }

  // Filter by timestamp
  if (filters?.since) {
    notifications = notifications.filter(n => n.createdAt >= filters.since);
  }

  // Remove expired notifications
  const now = Date.now();
  notifications = notifications.filter(n => !n.expiresAt || n.expiresAt > now);

  // Apply limit
  if (filters?.limit) {
    notifications = notifications.slice(0, filters.limit);
  }

  return notifications;
}

// Get unread count
export function getUnreadCount(companyId?: string, userId?: string): number {
  const notifications = getNotifications(companyId, { 
    userId, 
    unreadOnly: true 
  });
  return notifications.length;
}

// Get unread count by type
export function getUnreadCountByType(companyId?: string): Record<NotificationType, number> {
  const notifications = getNotifications(companyId, { unreadOnly: true });
  
  const counts: Record<NotificationType, number> = {
    lead: 0,
    project: 0,
    commission: 0,
    sla: 0,
    revenue: 0,
    digest: 0,
    system: 0,
    installer: 0,
    rep: 0,
  };

  notifications.forEach(n => {
    counts[n.type]++;
  });

  return counts;
}

// Mark a notification as read
export function markRead(notificationId: string, companyId?: string): boolean {
  const activeCompany = companyId || getActiveCompanyId();
  const store = loadNotifications(activeCompany);

  const notification = store.notifications.find(n => n.id === notificationId);
  if (notification && !notification.read) {
    notification.read = true;
    notification.readAt = Date.now();
    saveNotifications(activeCompany, store);
    return true;
  }

  return false;
}

// Mark multiple notifications as read
export function markMultipleRead(notificationIds: string[], companyId?: string): number {
  const activeCompany = companyId || getActiveCompanyId();
  const store = loadNotifications(activeCompany);
  let count = 0;

  notificationIds.forEach(id => {
    const notification = store.notifications.find(n => n.id === id);
    if (notification && !notification.read) {
      notification.read = true;
      notification.readAt = Date.now();
      count++;
    }
  });

  if (count > 0) {
    saveNotifications(activeCompany, store);
  }

  return count;
}

// Mark all notifications as read
export function markAllRead(companyId?: string, type?: NotificationType): number {
  const activeCompany = companyId || getActiveCompanyId();
  const store = loadNotifications(activeCompany);
  let count = 0;

  store.notifications.forEach(n => {
    if (!n.read && (!type || n.type === type)) {
      n.read = true;
      n.readAt = Date.now();
      count++;
    }
  });

  if (count > 0) {
    saveNotifications(activeCompany, store);
  }

  return count;
}

// Delete a notification
export function deleteNotification(notificationId: string, companyId?: string): boolean {
  const activeCompany = companyId || getActiveCompanyId();
  const store = loadNotifications(activeCompany);

  const originalLength = store.notifications.length;
  store.notifications = store.notifications.filter(n => n.id !== notificationId);

  if (store.notifications.length < originalLength) {
    saveNotifications(activeCompany, store);
    return true;
  }

  return false;
}

// Clear all notifications for a company
export function clearAll(companyId?: string): void {
  const activeCompany = companyId || getActiveCompanyId();
  saveNotifications(activeCompany, {
    notifications: [],
    lastDigestAt: loadNotifications(activeCompany).lastDigestAt,
  });
}

// Clear read notifications older than X days
export function clearOldNotifications(daysOld: number = 30, companyId?: string): number {
  const activeCompany = companyId || getActiveCompanyId();
  const store = loadNotifications(activeCompany);
  const cutoff = Date.now() - (daysOld * 24 * 60 * 60 * 1000);

  const originalLength = store.notifications.length;
  store.notifications = store.notifications.filter(n => 
    !n.read || n.createdAt > cutoff
  );

  const removed = originalLength - store.notifications.length;
  if (removed > 0) {
    saveNotifications(activeCompany, store);
  }

  return removed;
}

// Update last digest timestamp
export function setLastDigestTime(companyId?: string): void {
  const activeCompany = companyId || getActiveCompanyId();
  const store = loadNotifications(activeCompany);
  store.lastDigestAt = Date.now();
  saveNotifications(activeCompany, store);
}

// Get last digest timestamp
export function getLastDigestTime(companyId?: string): number {
  const store = loadNotifications(companyId);
  return store.lastDigestAt;
}

// Check if digest is needed (hasn't run in 24 hours)
export function isDigestNeeded(companyId?: string): boolean {
  const lastDigest = getLastDigestTime(companyId);
  const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
  return lastDigest < twentyFourHoursAgo;
}

// ============================================================================
// HELPER FUNCTIONS FOR CREATING COMMON NOTIFICATIONS
// ============================================================================

// Lead notifications
export function notifyNewHighPriorityLead(lead: { id: string; name: string }, companyId?: string): Notification {
  return notify({
    companyId: companyId || getActiveCompanyId(),
    userId: null,
    type: 'lead',
    title: 'New High Priority Lead',
    message: `${lead.name} requires immediate attention.`,
    priority: 'high',
    data: { leadId: lead.id },
    actionUrl: `/leads/${lead.id}`,
  });
}

export function notifyStaleLead(lead: { id: string; name: string; daysSinceContact: number }, companyId?: string): Notification {
  return notify({
    companyId: companyId || getActiveCompanyId(),
    userId: null,
    type: 'lead',
    title: 'Stale Lead Alert',
    message: `${lead.name} has not been contacted in ${lead.daysSinceContact} days.`,
    priority: 'normal',
    data: { leadId: lead.id, daysSinceContact: lead.daysSinceContact },
    actionUrl: `/leads/${lead.id}`,
  });
}

// Project/SLA notifications
export function notifyProjectAtRisk(project: { id: string; stage: string }, companyId?: string): Notification {
  return notify({
    companyId: companyId || getActiveCompanyId(),
    userId: null,
    type: 'sla',
    title: 'Project At Risk',
    message: `Project ${project.id} is at-risk in stage: ${project.stage}`,
    priority: 'high',
    data: { projectId: project.id, stage: project.stage },
    actionUrl: `/projects/${project.id}`,
  });
}

export function notifyProjectLate(project: { id: string; stage: string; daysLate: number }, companyId?: string): Notification {
  return notify({
    companyId: companyId || getActiveCompanyId(),
    userId: null,
    type: 'sla',
    title: 'Project Late',
    message: `Project ${project.id} is ${project.daysLate} days late in stage: ${project.stage}`,
    priority: 'urgent',
    data: { projectId: project.id, stage: project.stage, daysLate: project.daysLate },
    actionUrl: `/projects/${project.id}`,
  });
}

// Commission notifications
export function notifyCommissionApproved(
  commission: { id: string; repName: string; amount: number },
  companyId?: string
): Notification {
  return notify({
    companyId: companyId || getActiveCompanyId(),
    userId: null,
    type: 'commission',
    title: 'Commission Approved',
    message: `${commission.repName}'s commission of $${commission.amount.toLocaleString()} has been approved.`,
    priority: 'normal',
    data: { commissionId: commission.id, repName: commission.repName, amount: commission.amount },
  });
}

export function notifyCommissionPaid(
  commission: { id: string; repName: string; amount: number },
  companyId?: string
): Notification {
  return notify({
    companyId: companyId || getActiveCompanyId(),
    userId: null,
    type: 'commission',
    title: 'Commission Paid',
    message: `$${commission.amount.toLocaleString()} has been paid to ${commission.repName}.`,
    priority: 'low',
    data: { commissionId: commission.id, repName: commission.repName, amount: commission.amount },
  });
}

// Revenue notifications
export function notifyRevenueDecline(
  trend: { percentChange: number; period: string },
  companyId?: string
): Notification {
  return notify({
    companyId: companyId || getActiveCompanyId(),
    userId: null,
    type: 'revenue',
    title: 'Revenue Trend Alert',
    message: `Revenue has declined ${Math.abs(trend.percentChange).toFixed(1)}% over the ${trend.period} period.`,
    priority: 'high',
    data: { percentChange: trend.percentChange, period: trend.period },
    actionUrl: '/dashboard',
  });
}

// System notifications
export function notifySystemAlert(
  alert: { title: string; message: string },
  companyId?: string
): Notification {
  return notify({
    companyId: companyId || getActiveCompanyId(),
    userId: null,
    type: 'system',
    title: alert.title,
    message: alert.message,
    priority: 'normal',
  });
}

// Export notification type colors for UI
export const NOTIFICATION_TYPE_COLORS: Record<NotificationType, { bg: string; text: string; icon: string }> = {
  lead: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: 'User' },
  project: { bg: 'bg-purple-500/20', text: 'text-purple-400', icon: 'FolderKanban' },
  commission: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', icon: 'DollarSign' },
  sla: { bg: 'bg-amber-500/20', text: 'text-amber-400', icon: 'AlertTriangle' },
  revenue: { bg: 'bg-red-500/20', text: 'text-red-400', icon: 'TrendingDown' },
  digest: { bg: 'bg-solar-orange/20', text: 'text-solar-orange', icon: 'FileText' },
  system: { bg: 'bg-slate-500/20', text: 'text-slate-400', icon: 'Bell' },
  installer: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', icon: 'HardHat' },
  rep: { bg: 'bg-pink-500/20', text: 'text-pink-400', icon: 'Users' },
};

// Priority colors
export const PRIORITY_COLORS: Record<NotificationPriority, string> = {
  low: 'text-slate-400',
  normal: 'text-slate-300',
  high: 'text-amber-400',
  urgent: 'text-red-400',
};
