/**
 * Admin Override Tools Component
 * Allow admins to manually override lead/project/commission fields with audit logging
 */

import React, { useState, useEffect } from 'react';
import {
  Shield,
  AlertTriangle,
  Search,
  Edit3,
  Save,
  X,
  ChevronDown,
  ChevronRight,
  History,
  User,
  Briefcase,
  DollarSign
} from 'lucide-react';
import { logOverride } from '../services/auditLog';
import { getActiveCompanyId, getActiveCompany } from '../services/companyStore';
import { loadAllLeads, saveLeads, loadAllProjects, saveProjects } from '../utils/storage';
import type { Lead, Project } from '../types';

// =============================================================================
// Types
// =============================================================================

type RecordType = 'lead' | 'project' | 'commission';

interface OverrideableRecord {
  id: string;
  type: RecordType;
  name: string;
  data: Record<string, any>;
}

interface FieldOverride {
  field: string;
  originalValue: any;
  newValue: any;
}

// =============================================================================
// Field Definitions
// =============================================================================

const LEAD_OVERRIDE_FIELDS = [
  { key: 'status', label: 'Status', type: 'select', options: ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'] },
  { key: 'priority', label: 'Priority', type: 'select', options: ['low', 'medium', 'high', 'urgent'] },
  { key: 'assignedRep', label: 'Assigned Rep', type: 'text' },
  { key: 'value', label: 'Estimated Value', type: 'number' },
  { key: 'source', label: 'Source', type: 'text' },
  { key: 'notes', label: 'Notes', type: 'textarea' }
];

const PROJECT_OVERRIDE_FIELDS = [
  { key: 'stage', label: 'Stage', type: 'select', options: ['contract', 'permitting', 'installation', 'inspection', 'pto', 'complete'] },
  { key: 'contractAmount', label: 'Contract Amount', type: 'number' },
  { key: 'assignedInstaller', label: 'Assigned Installer', type: 'text' },
  { key: 'systemSize', label: 'System Size (kW)', type: 'number' },
  { key: 'panelCount', label: 'Panel Count', type: 'number' },
  { key: 'installDate', label: 'Install Date', type: 'date' }
];

const COMMISSION_OVERRIDE_FIELDS = [
  { key: 'status', label: 'Status', type: 'select', options: ['pending', 'approved', 'paid', 'clawback'] },
  { key: 'amount', label: 'Amount', type: 'number' },
  { key: 'paidDate', label: 'Paid Date', type: 'date' }
];

// =============================================================================
// Component
// =============================================================================

export default function AdminOverrideTools() {
  const [searchQuery, setSearchQuery] = useState('');
  const [recordType, setRecordType] = useState<RecordType>('lead');
  const [searchResults, setSearchResults] = useState<OverrideableRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<OverrideableRecord | null>(null);
  const [overrides, setOverrides] = useState<FieldOverride[]>([]);
  const [overrideReason, setOverrideReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [recentOverrides, setRecentOverrides] = useState<{ id: string; type: string; field: string; timestamp: string }[]>([]);
  const [expandedFields, setExpandedFields] = useState<string[]>([]);
  
  const companyId = getActiveCompanyId();
  const company = getActiveCompany();
  
  // Search for records
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const results: OverrideableRecord[] = [];
    
    if (recordType === 'lead') {
      const leads = loadAllLeads().filter(l => l.companyId === companyId);
      leads.forEach(lead => {
        if (
          lead.name?.toLowerCase().includes(query) ||
          lead.id?.toLowerCase().includes(query) ||
          lead.email?.toLowerCase().includes(query) ||
          lead.phone?.includes(query)
        ) {
          results.push({
            id: lead.id,
            type: 'lead',
            name: lead.name || lead.id,
            data: lead
          });
        }
      });
    } else if (recordType === 'project') {
      const projects = loadAllProjects().filter(p => p.companyId === companyId);
      projects.forEach(project => {
        // Use 'name' and 'id' fields for search, fallback to id for display
        if (
          project.id?.toLowerCase().includes(query)
        ) {
          results.push({
            id: project.id,
            type: 'project',
            name: project.id,
            data: project
          });
        }
      });
    }
    
    setSearchResults(results.slice(0, 10));
  }, [searchQuery, recordType, companyId]);
  
  // Get field definitions for record type
  const getFieldDefinitions = () => {
    switch (recordType) {
      case 'lead': return LEAD_OVERRIDE_FIELDS;
      case 'project': return PROJECT_OVERRIDE_FIELDS;
      case 'commission': return COMMISSION_OVERRIDE_FIELDS;
      default: return [];
    }
  };
  
  // Handle field override
  const handleFieldChange = (field: string, newValue: any) => {
    if (!selectedRecord) return;
    
    const originalValue = selectedRecord.data[field];
    
    setOverrides(prev => {
      const existing = prev.findIndex(o => o.field === field);
      if (existing >= 0) {
        // Update existing override
        if (newValue === originalValue) {
          // Remove override if value reverted
          return prev.filter((_, idx) => idx !== existing);
        }
        const updated = [...prev];
        updated[existing] = { field, originalValue, newValue };
        return updated;
      } else if (newValue !== originalValue) {
        // Add new override
        return [...prev, { field, originalValue, newValue }];
      }
      return prev;
    });
  };
  
  // Get current value for field (with override)
  const getFieldValue = (field: string) => {
    const override = overrides.find(o => o.field === field);
    if (override) return override.newValue;
    return selectedRecord?.data[field] ?? '';
  };
  
  // Save overrides
  const saveOverrides = async () => {
    if (!selectedRecord || overrides.length === 0) return;
    
    setIsSaving(true);
    
    try {
      const before = { ...selectedRecord.data };
      const after = { ...selectedRecord.data };
      
      overrides.forEach(override => {
        after[override.field] = override.newValue;
      });
      
      // Save based on type
      if (recordType === 'lead') {
        const allLeads = loadAllLeads();
        const updated = allLeads.map(lead => 
          lead.id === selectedRecord.id ? { ...lead, ...after } : lead
        );
        saveLeads(updated);
      } else if (recordType === 'project') {
        const allProjects = loadAllProjects();
        const updated = allProjects.map(project =>
          project.id === selectedRecord.id ? { ...project, ...after } : project
        );
        saveProjects(updated);
      }
      
      // Log the override
      logOverride(
        recordType === 'lead' ? 'Lead' : recordType === 'project' ? 'Project' : 'Commission',
        selectedRecord.id,
        before,
        after,
        JSON.stringify({ reason: overrideReason, fieldsChanged: overrides.map(o => o.field) })
      );
      
      // Track recent overrides
      const timestamp = new Date().toISOString();
      setRecentOverrides(prev => [
        ...overrides.map(o => ({
          id: selectedRecord.id,
          type: recordType,
          field: o.field,
          timestamp
        })),
        ...prev
      ].slice(0, 10));
      
      // Reset state
      setSelectedRecord(null);
      setOverrides([]);
      setOverrideReason('');
      setSearchQuery('');
      
    } catch (error) {
      console.error('Failed to save overrides:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Toggle field expansion
  const toggleFieldExpand = (field: string) => {
    setExpandedFields(prev => 
      prev.includes(field) ? prev.filter(f => f !== field) : [...prev, field]
    );
  };
  
  return (
    <div className="space-y-6">
      {/* Warning Banner */}
      <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
        <AlertTriangle className="text-yellow-400 mt-0.5" size={20} />
        <div>
          <h4 className="font-bold text-yellow-400">Admin Override Mode</h4>
          <p className="text-sm text-yellow-300/80">
            Changes made here bypass normal workflows and are permanently logged in the audit trail.
            Use with caution and always provide a reason for the override.
          </p>
        </div>
      </div>
      
      {/* Record Type Selector */}
      <div>
        <label className="block text-sm font-bold text-slate-400 uppercase mb-2">Record Type</label>
        <div className="flex gap-3">
          {(['lead', 'project'] as RecordType[]).map(type => (
            <button
              aria-label="Expand field"
              key={type}
              onClick={() => { setRecordType(type); setSelectedRecord(null); setOverrides([]); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                recordType === type
                  ? 'bg-orange-500/10 border-orange-500 text-orange-400'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              {type === 'lead' ? <User size={16} /> : type === 'project' ? <Briefcase size={16} /> : <DollarSign size={16} />}
              {type.charAt(0).toUpperCase() + type.slice(1)}s
            </button>
          ))}
        </div>
      </div>
      
      {/* Search */}
      {!selectedRecord && (
        <div>
          <label className="block text-sm font-bold text-slate-400 uppercase mb-2">Search {recordType}s</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search by name, ID, ${recordType === 'lead' ? 'email, phone' : 'address'}...`}
              className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-orange-500"
            />
          </div>
          
          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-2 bg-slate-950 border border-slate-800 rounded-lg divide-y divide-slate-800">
              {searchResults.map(result => (
                <button
                  key={result.id}
                  onClick={() => { setSelectedRecord(result); setSearchResults([]); }}
                  className="w-full flex items-center justify-between p-3 hover:bg-slate-800/50 transition-colors text-left"
                >
                  <div>
                    <span className="text-slate-200 font-medium">{result.name}</span>
                    <span className="text-slate-500 text-sm ml-2">{result.id}</span>
                  </div>
                  <ChevronRight className="text-slate-500" size={16} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Selected Record Editor */}
      {selectedRecord && (
        <div className="space-y-4">
          {/* Record Header */}
          <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800">
            <div>
              <span className="text-xs font-bold text-orange-400 uppercase">Editing {recordType}</span>
              <h3 className="text-lg font-bold text-white">{selectedRecord.name}</h3>
              <span className="text-sm text-slate-500">{selectedRecord.id}</span>
            </div>
            <button
              onClick={() => { setSelectedRecord(null); setOverrides([]); }}
              className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Field Overrides */}
          <div className="bg-slate-950 rounded-lg border border-slate-800 divide-y divide-slate-800">
            {getFieldDefinitions().map(fieldDef => {
              const hasOverride = overrides.some(o => o.field === fieldDef.key);
              const isExpanded = expandedFields.includes(fieldDef.key);
              
              return (
                <div key={fieldDef.key} className="p-3">
                  <button
                    onClick={() => toggleFieldExpand(fieldDef.key)}
                    className="w-full flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? <ChevronDown size={16} className="text-slate-500" /> : <ChevronRight size={16} className="text-slate-500" />}
                      <span className={`font-medium ${hasOverride ? 'text-orange-400' : 'text-slate-300'}`}>
                        {fieldDef.label}
                      </span>
                      {hasOverride && (
                        <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded">Modified</span>
                      )}
                    </div>
                    <span className="text-sm text-slate-500 truncate max-w-[200px]">
                      {String(selectedRecord.data[fieldDef.key] ?? 'Not set')}
                    </span>
                  </button>
                  
                  {isExpanded && (
                    <div className="mt-3 pl-6 space-y-2">
                      <div className="text-xs text-slate-500">
                        Original: <span className="text-slate-400">{String(selectedRecord.data[fieldDef.key] ?? 'Not set')}</span>
                      </div>
                      
                      {fieldDef.type === 'select' ? (
                        <select
                          aria-label={`Override field ${fieldDef.label}`}
                          value={getFieldValue(fieldDef.key)}
                          onChange={(e) => handleFieldChange(fieldDef.key, e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-orange-500"
                        >
                          <option value="">-- Select --</option>
                          {fieldDef.options?.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : fieldDef.type === 'textarea' ? (
                        <textarea
                          placeholder="Enter value"
                          value={getFieldValue(fieldDef.key)}
                          onChange={(e) => handleFieldChange(fieldDef.key, e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-orange-500 resize-none"
                          rows={3}
                        />
                      ) : (
                        <input
                          placeholder="Enter value"
                          type={fieldDef.type}
                          value={getFieldValue(fieldDef.key)}
                          onChange={(e) => handleFieldChange(
                            fieldDef.key, 
                            fieldDef.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value
                          )}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-orange-500"
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Override Reason */}
          {overrides.length > 0 && (
            <div>
              <label className="block text-sm font-bold text-slate-400 uppercase mb-2">
                Override Reason <span className="text-red-400">*</span>
              </label>
              <textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Explain why this override is necessary..."
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-orange-500 resize-none"
                rows={2}
              />
            </div>
          )}
          
          {/* Save Button */}
          {overrides.length > 0 && (
            <div className="flex items-center justify-between p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <div>
                <span className="text-orange-400 font-medium">
                  {overrides.length} field{overrides.length !== 1 ? 's' : ''} modified
                </span>
                <div className="text-xs text-orange-300/60">
                  {overrides.map(o => o.field).join(', ')}
                </div>
              </div>
              <button
                aria-label="Select record"
                onClick={saveOverrides}
                disabled={!overrideReason.trim() || isSaving}
                className="px-6 py-2 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-bold transition-colors flex items-center gap-2"
              >
                {isSaving ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Save size={18} />
                    Apply Override
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Recent Overrides */}
      {recentOverrides.length > 0 && !selectedRecord && (
        <div>
          <h3 className="text-sm font-bold text-slate-400 uppercase mb-2 flex items-center gap-2">
            <History size={14} />
            Recent Session Overrides
          </h3>
          <div className="bg-slate-950 rounded-lg border border-slate-800 divide-y divide-slate-800">
            {recentOverrides.map((override, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 text-sm">
                <div>
                  <span className="text-slate-400">{override.type}</span>
                  <span className="text-slate-500 mx-2">•</span>
                  <span className="text-slate-300">{override.id}</span>
                  <span className="text-slate-500 mx-2">•</span>
                  <span className="text-orange-400">{override.field}</span>
                </div>
                <span className="text-xs text-slate-600">
                  {new Date(override.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
