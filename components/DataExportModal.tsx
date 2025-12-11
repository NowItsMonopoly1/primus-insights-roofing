/**
 * Data Export Modal Component
 * Export Leads, Projects, Reps, Installers to CSV
 */

import React, { useState, useMemo } from 'react';
import {
  Download,
  FileSpreadsheet,
  CheckCircle2,
  X,
  Filter,
  Calendar,
  Building2
} from 'lucide-react';
import { toCSV, downloadCSV, getExportHeaders } from '../services/csv';
import { logExport } from '../services/auditLog';
import { getActiveCompanyId, getActiveCompany } from '../services/companyStore';
import { loadAllLeads, loadAllProjects } from '../utils/storage';

// =============================================================================
// Types
// =============================================================================

type ExportType = 'lead' | 'project' | 'rep' | 'installer';

interface DataExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// =============================================================================
// Component
// =============================================================================

export default function DataExportModal({ isOpen, onClose }: DataExportModalProps) {
  const [exportType, setExportType] = useState<ExportType>('lead');
  const [includeCustomFields, setIncludeCustomFields] = useState(true);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: ''
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);
  const [exportedCount, setExportedCount] = useState(0);
  
  const companyId = getActiveCompanyId();
  const company = getActiveCompany();
  
  // Get available data counts
  const dataCounts = useMemo(() => {
    const allLeads = loadAllLeads();
    const allProjects = loadAllProjects();
    
    const companyLeads = allLeads.filter(l => l.companyId === companyId);
    const companyProjects = allProjects.filter(p => p.companyId === companyId);
    
    return {
      lead: companyLeads.length,
      project: companyProjects.length,
      rep: company?.reps?.length || 0,
      installer: company?.installers?.length || 0
    };
  }, [companyId, company]);
  
  // Get data to export
  const getExportData = (): Record<string, any>[] => {
    switch (exportType) {
      case 'lead': {
        let leads = loadAllLeads().filter(l => l.companyId === companyId);
        
        // (No archived field on Lead, skip this filter)
        
        // Filter by date range
        if (dateRange.start) {
          leads = leads.filter(l => l.createdAt >= dateRange.start);
        }
        if (dateRange.end) {
          leads = leads.filter(l => l.createdAt <= dateRange.end);
        }
        
        return leads;
      }
      
      case 'project': {
        let projects = loadAllProjects().filter(p => p.companyId === companyId);
        
        // (No archived field on Project, skip this filter)
        
        if (dateRange.start) {
          projects = projects.filter(p => p.createdAt >= dateRange.start);
        }
        if (dateRange.end) {
          projects = projects.filter(p => p.createdAt <= dateRange.end);
        }
        
        return projects;
      }
      
      case 'rep': {
        return company?.reps || [];
      }
      
      case 'installer': {
        return company?.installers || [];
      }
      
      default:
        return [];
    }
  };
  
  // Execute export
  const executeExport = () => {
    setIsExporting(true);
    
    try {
      const data = getExportData();
      const headers = getExportHeaders(exportType);
      
      const csvContent = toCSV(data);
      
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `${company?.name?.replace(/\s+/g, '_') || 'export'}_${exportType}s_${timestamp}.csv`;
      
      downloadCSV(filename, csvContent);
      
      // Log the export
      logExport(
        exportType === 'lead' ? 'Lead' :
        exportType === 'project' ? 'Project' :
        exportType === 'rep' ? 'Rep' : 'Installer',
        data.length,
        { filename, includeCustomFields, includeArchived, dateRange }
      );
      
      setExportedCount(data.length);
      setExportComplete(true);
      
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };
  
  // Reset state
  const resetState = () => {
    setExportComplete(false);
    setExportedCount(0);
    setDateRange({ start: '', end: '' });
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-xl border border-slate-800 w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Download className="text-cyan-400" size={24} />
            <h2 className="text-xl font-bold text-white">Export Data</h2>
          </div>
          <button
            aria-label="Export Data"
            onClick={() => { resetState(); onClose(); }}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6">
          {!exportComplete ? (
            <>
              {/* Export Type Selection */}
              <div>
                <label className="block text-sm font-bold text-slate-400 uppercase mb-2">Export Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['lead', 'project', 'rep', 'installer'] as ExportType[]).map(type => (
                    <button
                      key={type}
                      onClick={() => setExportType(type)}
                      className={`p-4 rounded-lg border text-left transition-colors ${
                        exportType === type
                          ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <FileSpreadsheet size={18} />
                        <span className="text-xs bg-slate-800 px-2 py-0.5 rounded">
                          {dataCounts[type]}
                        </span>
                      </div>
                      <span className="font-medium">{type.charAt(0).toUpperCase() + type.slice(1)}s</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Date Range Filter (for leads and projects) */}
              {(exportType === 'lead' || exportType === 'project') && (
                <div>
                  <label className="text-sm font-bold text-slate-400 uppercase mb-2 flex items-center gap-2">
                    <Calendar size={14} />
                    Date Range (Optional)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">From</label>
                      <input
                        placeholder="Enter value"
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">To</label>
                      <input
                        placeholder="Enter value"
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Options */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-400 uppercase flex items-center gap-2">
                  <Filter size={14} />
                  Options
                </label>
                
                <label className="flex items-center gap-3 p-3 bg-slate-950 rounded-lg cursor-pointer hover:bg-slate-900 transition-colors">
                  <input
                    type="checkbox"
                    checked={includeCustomFields}
                    onChange={(e) => setIncludeCustomFields(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
                  />
                  <div>
                    <span className="text-slate-200">Include custom fields</span>
                    <p className="text-xs text-slate-500">Export all custom field values as additional columns</p>
                  </div>
                </label>
                
                {(exportType === 'lead' || exportType === 'project') && (
                  <label className="flex items-center gap-3 p-3 bg-slate-950 rounded-lg cursor-pointer hover:bg-slate-900 transition-colors">
                    <input
                      type="checkbox"
                      checked={includeArchived}
                      onChange={(e) => setIncludeArchived(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
                    />
                    <div>
                      <span className="text-slate-200">Include archived records</span>
                      <p className="text-xs text-slate-500">Export archived {exportType}s as well</p>
                    </div>
                  </label>
                )}
              </div>
              
              {/* Company Info */}
              <div className="flex items-center gap-2 p-3 bg-slate-950 rounded-lg border border-slate-800">
                <Building2 className="text-slate-500" size={16} />
                <span className="text-sm text-slate-400">
                  Exporting from: <span className="text-slate-200">{company?.name || 'Unknown Company'}</span>
                </span>
              </div>
            </>
          ) : (
            // Export Complete
            <div className="text-center py-8">
              <CheckCircle2 className="mx-auto mb-4 text-emerald-400" size={64} />
              <h3 className="text-2xl font-bold text-white mb-2">Export Complete!</h3>
              <p className="text-slate-400">
                Successfully exported {exportedCount} {exportType}s to CSV
              </p>
              <p className="text-slate-500 text-sm mt-2">
                Check your downloads folder
              </p>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-end gap-3">
          <button
            onClick={() => { resetState(); onClose(); }}
            className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
          >
            {exportComplete ? 'Close' : 'Cancel'}
          </button>
          
          {!exportComplete && (
            <button
              onClick={executeExport}
              disabled={isExporting || dataCounts[exportType] === 0}
              className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-bold transition-colors flex items-center gap-2"
            >
              {isExporting ? (
                <>
                  <Download size={18} className="animate-bounce" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download size={18} />
                  Export {dataCounts[exportType]} {exportType}s
                </>
              )}
            </button>
          )}
          
          {exportComplete && (
            <button
              onClick={resetState}
              className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold transition-colors"
            >
              Export More
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
