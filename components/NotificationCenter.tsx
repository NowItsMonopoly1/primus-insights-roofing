// components/NotificationCenter.tsx
// In-App Notification Center - View and manage alerts

import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  X,
  Check,
  CheckCheck,
  Trash2,
  User,
  FolderKanban,
  DollarSign,
  AlertTriangle,
  TrendingDown,
  FileText,
  HardHat,
  Users,
  Filter,
  Clock,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import {
  getNotifications,
  getUnreadCount,
  getUnreadCountByType,
  markRead,
  markAllRead,
  deleteNotification,
  clearOldNotifications,
  Notification,
  NotificationType,
  NOTIFICATION_TYPE_COLORS,
  PRIORITY_COLORS,
} from '../services/notifications';
import { getActiveCompanyId } from '../services/companyStore';

// Icon mapping
const TYPE_ICONS: Record<NotificationType, React.ReactNode> = {
  lead: <User size={16} />,
  project: <FolderKanban size={16} />,
  commission: <DollarSign size={16} />,
  sla: <AlertTriangle size={16} />,
  revenue: <TrendingDown size={16} />,
  digest: <FileText size={16} />,
  system: <Bell size={16} />,
  installer: <HardHat size={16} />,
  rep: <Users size={16} />,
};

interface NotificationCenterProps {
  userId?: string;
}

export default function NotificationCenter({ userId }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<NotificationType | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const companyId = getActiveCompanyId();

  // Load notifications
  const loadData = () => {
    const filterType = filter === 'all' ? undefined : filter;
    const notifs = getNotifications(companyId, {
      type: filterType,
      userId,
      limit: 50,
    });
    setNotifications(notifs);
    setUnreadCount(getUnreadCount(companyId, userId));
  };

  useEffect(() => {
    loadData();
    // Refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [companyId, userId, filter]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkRead = (id: string) => {
    markRead(id, companyId);
    loadData();
  };

  const handleMarkAllRead = () => {
    const filterType = filter === 'all' ? undefined : filter;
    markAllRead(companyId, filterType);
    loadData();
  };

  const handleDelete = (id: string) => {
    deleteNotification(id, companyId);
    loadData();
  };

  const handleClearOld = () => {
    const removed = clearOldNotifications(7, companyId);
    if (removed > 0) {
      loadData();
    }
  };

  const formatTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const unreadByType = getUnreadCountByType(companyId);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
        title="Notifications"
        aria-label="Open notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 max-h-[80vh] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in">
          {/* Header */}
          <div className="p-4 border-b border-slate-800 bg-slate-900/95 sticky top-0">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Bell size={18} className="text-solar-orange" />
                Notifications
                {unreadCount > 0 && (
                  <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={loadData}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-all"
                  title="Refresh"
                >
                  <RefreshCw size={14} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-all"
                  title="Close"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1 overflow-x-auto pb-1">
              <FilterTab
                label="All"
                count={notifications.length}
                active={filter === 'all'}
                onClick={() => setFilter('all')}
              />
              <FilterTab
                label="Leads"
                count={unreadByType.lead}
                active={filter === 'lead'}
                onClick={() => setFilter('lead')}
                color="blue"
              />
              <FilterTab
                label="SLA"
                count={unreadByType.sla}
                active={filter === 'sla'}
                onClick={() => setFilter('sla')}
                color="amber"
              />
              <FilterTab
                label="Commission"
                count={unreadByType.commission}
                active={filter === 'commission'}
                onClick={() => setFilter('commission')}
                color="emerald"
              />
              <FilterTab
                label="Revenue"
                count={unreadByType.revenue}
                active={filter === 'revenue'}
                onClick={() => setFilter('revenue')}
                color="red"
              />
            </div>
          </div>

          {/* Actions Bar */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-b border-slate-800 flex justify-between items-center bg-slate-800/30">
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                <CheckCheck size={12} />
                Mark all read
              </button>
              <button
                onClick={handleClearOld}
                className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1 transition-colors"
              >
                <Trash2 size={12} />
                Clear old
              </button>
            </div>
          )}

          {/* Notifications List */}
          <div className="overflow-y-auto max-h-[50vh]">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Bell size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/50">
                {notifications.map((notif) => (
                  <NotificationItem
                    key={notif.id}
                    notification={notif}
                    isExpanded={expandedId === notif.id}
                    onToggle={() => setExpandedId(expandedId === notif.id ? null : notif.id)}
                    onMarkRead={() => handleMarkRead(notif.id)}
                    onDelete={() => handleDelete(notif.id)}
                    formatTime={formatTime}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-slate-800 bg-slate-900/95">
            <button
              onClick={() => {
                setIsOpen(false);
                // Could navigate to full notifications page
              }}
              className="w-full text-center text-sm text-slate-400 hover:text-white transition-colors"
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface FilterTabProps {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  color?: string;
}

function FilterTab({ label, count, active, onClick, color }: FilterTabProps) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap transition-all ${
        active
          ? 'bg-slate-700 text-white'
          : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
      }`}
    >
      {label}
      {count > 0 && (
        <span
          className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${
            active
              ? 'bg-slate-600 text-white'
              : color
              ? `bg-${color}-500/20 text-${color}-400`
              : 'bg-slate-700 text-slate-400'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

interface NotificationItemProps {
  notification: Notification;
  isExpanded: boolean;
  onToggle: () => void;
  onMarkRead: () => void;
  onDelete: () => void;
  formatTime: (timestamp: number) => string;
}

function NotificationItem({
  notification,
  isExpanded,
  onToggle,
  onMarkRead,
  onDelete,
  formatTime,
}: NotificationItemProps) {
  const colors = NOTIFICATION_TYPE_COLORS[notification.type];

  return (
    <div
      className={`p-3 hover:bg-slate-800/30 transition-colors cursor-pointer ${
        !notification.read ? 'bg-slate-800/20' : ''
      }`}
      onClick={onToggle}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colors.bg}`}
        >
          <span className={colors.text}>{TYPE_ICONS[notification.type]}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4
                  className={`text-sm font-medium ${
                    notification.read ? 'text-slate-400' : 'text-white'
                  }`}
                >
                  {notification.title}
                </h4>
                {!notification.read && (
                  <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                )}
              </div>
              <p
                className={`text-xs mt-0.5 ${
                  isExpanded ? 'whitespace-normal' : 'truncate'
                } ${notification.read ? 'text-slate-600' : 'text-slate-400'}`}
              >
                {notification.message}
              </p>
            </div>

            {/* Time */}
            <span className="text-[10px] text-slate-600 whitespace-nowrap flex items-center gap-1">
              <Clock size={10} />
              {formatTime(notification.createdAt)}
            </span>
          </div>

          {/* Expanded Actions */}
          {isExpanded && (
            <div className="mt-2 flex items-center gap-2 pt-2 border-t border-slate-800">
              {!notification.read && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkRead();
                  }}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-400 transition-colors"
                >
                  <Check size={12} />
                  Mark read
                </button>
              )}
              {notification.actionUrl && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Navigate to action URL
                    console.log('Navigate to:', notification.actionUrl);
                  }}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-blue-400 transition-colors"
                >
                  <ChevronRight size={12} />
                  View details
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-400 transition-colors ml-auto"
              >
                <Trash2 size={12} />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// NOTIFICATION BELL FOR HEADER (Compact version)
// ============================================================================

export function NotificationBell({ userId }: { userId?: string }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const companyId = getActiveCompanyId();

  useEffect(() => {
    const updateCount = () => {
      setUnreadCount(getUnreadCount(companyId, userId));
    };
    updateCount();
    const interval = setInterval(updateCount, 30000);
    return () => clearInterval(interval);
  }, [companyId, userId]);

  return (
    <NotificationCenter userId={userId} />
  );
}
