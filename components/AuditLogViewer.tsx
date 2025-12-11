/**
 * Audit Log Viewer Component
 * Enterprise-grade activity log viewer for Primus Home Pro
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  History,
  Filter,
  Search,
  ChevronDown,
  ChevronRight,
  User,
  Calendar,
  FileText,
  Trash2,
  Download,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import {
  getLogs,
  getAuditUsers,
  clearLogs,
  exportAuditLogs,
  AuditLogEntry,
  AuditObjectType,
  AuditActionType,
  AuditLogFilters
} from '../services/auditLog';
import { getActiveCompanyId } from '../services/companyStore';
import { downloadCSV } from '../services/csv';

// =============================================================================
// Types
// =============================================================================

interface AuditLogViewerProps {
  companyId?: string;
  maxHeight?: string;
}

// =============================================================================
// Constants
// =============================================================================

const OBJECT_TYPES: AuditObjectType[] = [
  'Lead', 'Project', 'Commission', 'Settings', 'SLA', 'Stage', 
  'Pipeline', 'Rep', 'Installer', 'CustomField', 'CommissionRule', 'Team', 'Company'
];

const ACTION_TYPES: AuditActionType[] = ['create', 'update', 'delete', 'override', 'import', 'export'];

const ACTION_COLORS: Record<AuditActionType, string> = {
  create: 'text-emerald-400 bg-emerald-500/10',
  update: 'text-blue-400 bg-blue-500/10',
  delete: 'text-red-400 bg-red-500/10',
  override: 'text-orange-400 bg-orange-500/10',
  import: 'text-purple-400 bg-purple-500/10',
  export: 'text-cyan-400 bg-cyan-500/10'
};

const ACTION_LABELS: Record<AuditActionType, string> = {
  create: 'Created',
  update: 'Updated',
  delete: 'Deleted',
  override: 'Override',
  import: 'Imported',
  export: 'Exported'
};

// =============================================================================
// Component
// =============================================================================

export default function AuditLogViewer({ companyId, maxHeight = '600px' }: AuditLogViewerProps) {
  const targetCompanyId = companyId || getActiveCompanyId();
  
  // State
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  
  // Filter state
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Date range state
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Available users for filter
  const [users, setUsers] = useState<{ userId: string; userName: string }[]>([]);
  
  // Load logs
  useEffect(() => {
    loadLogs();
  }, [targetCompanyId, filters]);
  
  // Load users for filter dropdown
  useEffect(() => {
    const auditUsers = getAuditUsers(targetCompanyId);
    setUsers(auditUsers);
  }, [targetCompanyId]);
  
  const loadLogs = () => {
    setIsLoading(true);
    try {
      // Apply date filters
      const appliedFilters: AuditLogFilters = { ...filters };
      if (dateFrom) {
        appliedFilters.startDate = new Date(dateFrom).getTime();
      }
      if (dateTo) {
        appliedFilters.endDate = new Date(dateTo).setHours(23, 59, 59, 999);
      }
      
      const fetchedLogs = getLogs(targetCompanyId, appliedFilters);
      setLogs(fetchedLogs);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Filter logs by search term
  const filteredLogs = useMemo(() => {
    if (!searchTerm) return logs;
    
    const term = searchTerm.toLowerCase();
    return logs.filter(log =>
      log.userName.toLowerCase().includes(term) ||
      log.objectType.toLowerCase().includes(term) ||
      log.objectId.toLowerCase().includes(term) ||
      log.action.toLowerCase().includes(term)
    );
  }, [logs, searchTerm]);
  
  // Toggle expanded state
  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };
  
  // Clear all logs
  const handleClearLogs = () => {
    if (window.confirm('Are you sure you want to clear all audit logs? This cannot be undone.')) {
      clearLogs(targetCompanyId);
      setLogs([]);
    }
  };
  
  // Export logs
  const handleExportLogs = () => {
    const jsonContent = exportAuditLogs(targetCompanyId);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit_log_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };
  
  // Format relative time
  const formatRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return formatTimestamp(timestamp);
  };
  
  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <History className="text-blue-400" size={24} />
            <h3 className="text-xl font-bold text-white">Audit Log</h3>
            <span className="text-sm text-slate-500">({filteredLogs.length} entries)</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={loadLogs}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw size={18} />
            </button>
            <button
              onClick={handleExportLogs}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Export logs"
            >
              <Download size={18} />
            </button>
            <button
              onClick={handleClearLogs}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              title="Clear logs"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
        
        {/* Search and Filter Toggle */}
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
              showFilters || Object.keys(filters).length > 0
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Filter size={16} />
            Filters
          </button>
        </div>
        
        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-slate-950 rounded-lg border border-slate-800 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date From */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">From Date</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
            
            {/* Date To */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">To Date</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
            
            {/* User Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">User</label>
              <select
                value={filters.userId || ''}
                onChange={(e) => setFilters({ ...filters, userId: e.target.value || undefined })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="">All Users</option>
                {users.map(user => (
                  <option key={user.userId} value={user.userId}>{user.userName}</option>
                ))}
              </select>
            </div>
            
            {/* Object Type Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Object Type</label>
              <select
                value={filters.objectType || ''}
                onChange={(e) => setFilters({ ...filters, objectType: e.target.value as AuditObjectType || undefined })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="">All Types</option>
                {OBJECT_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            {/* Action Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Action</label>
              <select
                value={filters.action || ''}
                onChange={(e) => setFilters({ ...filters, action: e.target.value as AuditActionType || undefined })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="">All Actions</option>
                {ACTION_TYPES.map(action => (
                  <option key={action} value={action}>{ACTION_LABELS[action]}</option>
                ))}
              </select>
            </div>
            
            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilters({});
                  setDateFrom('');
                  setDateTo('');
                }}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Log List */}
      <div className="overflow-y-auto" style={{ maxHeight }}>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <AlertCircle size={48} className="mb-3 opacity-50" />
            <p>No audit logs found</p>
            {Object.keys(filters).length > 0 && (
              <button
                onClick={() => {
                  setFilters({});
                  setDateFrom('');
                  setDateTo('');
                }}
                className="mt-2 text-blue-400 hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filteredLogs.map(log => (
              <LogEntry
                key={log.id}
                log={log}
                expanded={expandedIds.has(log.id)}
                onToggle={() => toggleExpanded(log.id)}
                formatTimestamp={formatTimestamp}
                formatRelativeTime={formatRelativeTime}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Sub-Components
// =============================================================================

interface LogEntryProps {
  log: AuditLogEntry;
  expanded: boolean;
  onToggle: () => void;
  formatTimestamp: (ts: number) => string;
  formatRelativeTime: (ts: number) => string;
}

function LogEntry({ log, expanded, onToggle, formatTimestamp, formatRelativeTime }: LogEntryProps) {
  return (
    <div className="p-4 hover:bg-slate-800/30 transition-colors">
      <div 
        className="flex items-start gap-3 cursor-pointer"
        onClick={onToggle}
      >
        {/* Expand Icon */}
        <button className="text-slate-500 hover:text-slate-300 mt-1">
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        
        {/* Action Badge */}
        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${ACTION_COLORS[log.action]}`}>
          {ACTION_LABELS[log.action]}
        </span>
        
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <p className="text-slate-200">
            <span className="font-medium text-white">{log.userName}</span>
            {' '}{log.action === 'create' ? 'created' : 
                  log.action === 'update' ? 'updated' :
                  log.action === 'delete' ? 'deleted' :
                  log.action === 'override' ? 'overrode' :
                  log.action === 'import' ? 'imported' :
                  'exported'}{' '}
            <span className="text-blue-400">{log.objectType}</span>
            {log.objectId !== 'bulk-import' && log.objectId !== 'bulk-export' && (
              <span className="text-slate-500 ml-1">({log.objectId})</span>
            )}
          </p>
          
          <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {formatRelativeTime(log.timestamp)}
            </span>
            <span title={formatTimestamp(log.timestamp)}>
              {new Date(log.timestamp).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
      
      {/* Expanded Details */}
      {expanded && (
        <div className="mt-3 ml-9 p-3 bg-slate-950 rounded-lg border border-slate-800">
          <div className="text-xs text-slate-400 mb-2">
            <strong>Timestamp:</strong> {formatTimestamp(log.timestamp)}
          </div>
          
          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <div className="text-xs text-slate-400 mb-2">
              <strong>Metadata:</strong>
              <pre className="mt-1 text-slate-500 overflow-x-auto">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Before */}
            {log.before !== null && (
              <div>
                <div className="text-xs font-bold text-red-400 uppercase mb-1">Before</div>
                <pre className="text-xs text-slate-400 bg-slate-900 p-2 rounded overflow-x-auto max-h-48">
                  {JSON.stringify(log.before, null, 2)}
                </pre>
              </div>
            )}
            
            {/* After */}
            {log.after !== null && (
              <div>
                <div className="text-xs font-bold text-emerald-400 uppercase mb-1">After</div>
                <pre className="text-xs text-slate-400 bg-slate-900 p-2 rounded overflow-x-auto max-h-48">
                  {JSON.stringify(log.after, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
