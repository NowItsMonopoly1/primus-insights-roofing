/**
 * Data Import Modal Component
 * CSV import wizard for Leads, Projects, Reps, Installers
 */

import React, { useState, useCallback } from 'react';
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  X,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import {
  parseCSV,
  suggestColumnMapping,
  validateColumns,
  LEAD_FIELDS,
  PROJECT_FIELDS,
  REP_FIELDS,
  INSTALLER_FIELDS
} from '../services/csv';
import { logImport } from '../services/auditLog';
import { getActiveCompanyId } from '../services/companyStore';
import { loadAllLeads, saveLeads, loadAllProjects, saveProjects } from '../utils/storage';

// =============================================================================
// Types
// =============================================================================

type ImportType = 'lead' | 'project' | 'rep' | 'installer';
type Step = 'upload' | 'mapping' | 'preview' | 'complete';

interface DataImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: (type: ImportType, count: number) => void;
}

// =============================================================================
// Field Definitions
// =============================================================================

const FIELD_DEFINITIONS: Record<ImportType, { name: string; aliases: string[] }[]> = {
  lead: LEAD_FIELDS,
  project: PROJECT_FIELDS,
  rep: REP_FIELDS,
  installer: INSTALLER_FIELDS
};

const REQUIRED_FIELDS: Record<ImportType, string[]> = {
  lead: ['name'],
  project: ['customerName'],
  rep: ['name'],
  installer: ['name']
};

// =============================================================================
// Component
// =============================================================================

export default function DataImportModal({ isOpen, onClose, onImportComplete }: DataImportModalProps) {
  // State
  const [step, setStep] = useState<Step>('upload');
  const [importType, setImportType] = useState<ImportType>('lead');
  const [csvText, setCsvText] = useState('');
  const [parsedData, setParsedData] = useState<Record<string, any>[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; count: number; errors: string[] } | null>(null);
  const [fileName, setFileName] = useState('');
  
  // Reset state
  const resetState = () => {
    setStep('upload');
    setCsvText('');
    setParsedData([]);
    setCsvHeaders([]);
    setColumnMapping({});
    setImportResult(null);
    setFileName('');
  };
  
  // Handle file upload
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
      
      // Parse CSV
      const records = parseCSV(text);
      if (records.length > 0) {
        setParsedData(records);
        const headers = Object.keys(records[0]).filter(h => !h.startsWith('customField:'));
        setCsvHeaders(headers);
        
        // Auto-suggest column mapping
        const fieldDefs = FIELD_DEFINITIONS[importType];
        const suggested = suggestColumnMapping(headers, fieldDefs);
        setColumnMapping(suggested);
      }
    };
    reader.readAsText(file);
  }, [importType]);
  
  // Handle text paste
  const handleTextPaste = (text: string) => {
    setCsvText(text);
    const records = parseCSV(text);
    if (records.length > 0) {
      setParsedData(records);
      const headers = Object.keys(records[0]).filter(h => !h.startsWith('customField:'));
      setCsvHeaders(headers);
      
      const fieldDefs = FIELD_DEFINITIONS[importType];
      const suggested = suggestColumnMapping(headers, fieldDefs);
      setColumnMapping(suggested);
    }
  };
  
  // Update column mapping
  const updateMapping = (csvHeader: string, targetField: string) => {
    setColumnMapping(prev => ({
      ...prev,
      [csvHeader]: targetField
    }));
  };
  
  // Transform data based on mapping
  const transformData = (): Record<string, any>[] => {
    return parsedData.map(row => {
      const transformed: Record<string, any> = {
        id: generateId(),
        companyId: getActiveCompanyId(),
        createdAt: new Date().toISOString().slice(0, 10)
      };
      
      // Apply column mapping
      Object.entries(columnMapping).forEach(([csvHeader, targetField]) => {
        if (targetField && row[csvHeader] !== undefined) {
          transformed[targetField] = row[csvHeader];
        }
      });
      
      // Add unmapped custom fields
      Object.entries(row).forEach(([key, value]) => {
        if (key.startsWith('customField:')) {
          if (!transformed.customFields) transformed.customFields = {};
          const fieldId = key.replace('customField:', '');
          transformed.customFields[fieldId] = value;
        }
      });
      
      // Set defaults based on type
      if (importType === 'lead') {
        transformed.status = transformed.status || 'NEW';
        transformed.priority = transformed.priority || 'medium';
      }
      
      if (importType === 'project') {
        transformed.stage = transformed.stage || 'contract';
      }
      
      return transformed;
    });
  };
  
  // Execute import
  const executeImport = async () => {
    setIsImporting(true);
    const errors: string[] = [];
    
    try {
      const transformedData = transformData();
      const companyId = getActiveCompanyId();
      
      let importedCount = 0;
      
      switch (importType) {
        case 'lead': {
          const allLeads = loadAllLeads();
          // Only save objects that match Lead interface (id, name, address, status, createdAt)
          const newLeads = transformedData.filter(
            (lead): lead is import('..//types').Lead =>
              typeof lead.id === 'string' &&
              typeof lead.name === 'string' &&
              typeof lead.address === 'string' &&
              typeof lead.status === 'string' &&
              typeof lead.createdAt === 'string'
          );
          saveLeads([...allLeads, ...newLeads as import('..//types').Lead[]]);
          importedCount = newLeads.length;
          break;
        }
        case 'project': {
          const allProjects = loadAllProjects();
          // Only save objects that match Project interface (id, leadId, stage, kW, createdAt, lastUpdated)
          const newProjects = transformedData.filter(
            (project): project is import('..//types').Project =>
              typeof project.id === 'string' &&
              typeof project.leadId === 'string' &&
              typeof project.stage === 'string' &&
              typeof project.kW === 'number' &&
              typeof project.createdAt === 'string' &&
              typeof project.lastUpdated === 'string'
          );
          saveProjects([...allProjects, ...newProjects as import('..//types').Project[]]);
          importedCount = newProjects.length;
          break;
        }
        
        case 'rep':
        case 'installer':
          // These would need company store integration
          errors.push('Rep and Installer import requires company store integration');
          break;
      }
      
      // Log the import
      logImport(
        importType === 'lead' ? 'Lead' : 
        importType === 'project' ? 'Project' :
        importType === 'rep' ? 'Rep' : 'Installer',
        importedCount,
        { fileName, totalRows: parsedData.length }
      );
      
      setImportResult({
        success: true,
        count: importedCount,
        errors
      });
      
      setStep('complete');
      onImportComplete?.(importType, importedCount);
      
    } catch (err) {
      setImportResult({
        success: false,
        count: 0,
        errors: [err instanceof Error ? err.message : 'Unknown error']
      });
      setStep('complete');
    } finally {
      setIsImporting(false);
    }
  };
  
  // Generate ID
  const generateId = () => {
    const prefix = importType === 'lead' ? 'L' : importType === 'project' ? 'P' : importType === 'rep' ? 'R' : 'I';
    return `${prefix}-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`;
  };
  
  // Validate current step
  const canProceed = () => {
    switch (step) {
      case 'upload':
        return parsedData.length > 0;
      case 'mapping':
        const required = REQUIRED_FIELDS[importType];
        const mappedFields = Object.values(columnMapping);
        return required.every(field => mappedFields.includes(field));
      case 'preview':
        return true;
      default:
        return false;
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-xl border border-slate-800 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Upload className="text-purple-400" size={24} />
            <h2 className="text-xl font-bold text-white">Import Data</h2>
          </div>
          <button
            aria-label="Continue"
            onClick={() => { resetState(); onClose(); }}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-slate-800">
          <div className="flex items-center justify-between">
            {(['upload', 'mapping', 'preview', 'complete'] as Step[]).map((s, idx) => (
              <React.Fragment key={s}>
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    step === s ? 'bg-purple-500 text-white' :
                    (['upload', 'mapping', 'preview', 'complete'].indexOf(step) > idx) ? 'bg-emerald-500 text-white' :
                    'bg-slate-800 text-slate-500'
                  }`}>
                    {(['upload', 'mapping', 'preview', 'complete'].indexOf(step) > idx) ? <CheckCircle2 size={16} /> : idx + 1}
                  </div>
                  <span className={`text-sm ${step === s ? 'text-white' : 'text-slate-500'}`}>
                    {s === 'upload' ? 'Upload' : s === 'mapping' ? 'Map Columns' : s === 'preview' ? 'Preview' : 'Complete'}
                  </span>
                </div>
                {idx < 3 && <div className="flex-1 h-px bg-slate-700 mx-4" />}
              </React.Fragment>
            ))}
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className="space-y-6">
              {/* Import Type Selection */}
              <div>
                <label className="block text-sm font-bold text-slate-400 uppercase mb-2">Import Type</label>
                <div className="grid grid-cols-4 gap-3">
                  {(['lead', 'project', 'rep', 'installer'] as ImportType[]).map(type => (
                    <button
                      key={type}
                      onClick={() => setImportType(type)}
                      className={`p-3 rounded-lg border text-center transition-colors ${
                        importType === type
                          ? 'bg-purple-500/10 border-purple-500 text-purple-400'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}s
                    </button>
                  ))}
                </div>
              </div>
              
              {/* File Upload */}
              <div>
                <label className="block text-sm font-bold text-slate-400 uppercase mb-2">Upload CSV File</label>
                <label className="block w-full p-8 border-2 border-dashed border-slate-700 rounded-xl hover:border-slate-600 cursor-pointer transition-colors text-center">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <FileText className="mx-auto mb-3 text-slate-500" size={40} />
                  <p className="text-slate-300 font-medium">
                    {fileName || 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-slate-500 text-sm mt-1">CSV files only</p>
                </label>
              </div>
              
              {/* Or paste */}
              <div>
                <label className="block text-sm font-bold text-slate-400 uppercase mb-2">Or Paste CSV Content</label>
                <textarea
                  value={csvText}
                  onChange={(e) => handleTextPaste(e.target.value)}
                  placeholder="name,address,email,phone&#10;John Doe,123 Main St,john@example.com,555-1234"
                  className="w-full h-32 px-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 font-mono text-sm focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>
              
              {/* Preview Count */}
              {parsedData.length > 0 && (
                <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <CheckCircle2 className="text-emerald-400" size={18} />
                  <span className="text-emerald-400">
                    Found {parsedData.length} records with {csvHeaders.length} columns
                  </span>
                </div>
              )}
            </div>
          )}
          
          {/* Step 2: Column Mapping */}
          {step === 'mapping' && (
            <div className="space-y-4">
              <p className="text-slate-400 mb-4">
                Map your CSV columns to the appropriate fields. Required fields are marked with *.
              </p>
              
              <div className="bg-slate-950 rounded-lg border border-slate-800 divide-y divide-slate-800">
                {csvHeaders.map(header => (
                  <div key={header} className="flex items-center p-3 gap-4">
                    <div className="w-1/3 text-slate-300 font-medium truncate" title={header}>
                      {header}
                    </div>
                    <ArrowRight className="text-slate-600" size={16} />
                    <select
                      aria-label={`Map CSV column ${header}`}
                      value={columnMapping[header] || ''}
                      onChange={(e) => updateMapping(header, e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-purple-500"
                    >
                      <option value="">-- Skip this column --</option>
                      {FIELD_DEFINITIONS[importType].map(field => (
                        <option key={field.name} value={field.name}>
                          {field.name}{REQUIRED_FIELDS[importType].includes(field.name) ? ' *' : ''}
                        </option>
                      ))}
                      <option value="__custom__">Custom Field</option>
                    </select>
                  </div>
                ))}
              </div>
              
              {/* Required fields warning */}
              {!canProceed() && (
                <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <AlertCircle className="text-yellow-400" size={18} />
                  <span className="text-yellow-400">
                    Please map all required fields: {REQUIRED_FIELDS[importType].join(', ')}
                  </span>
                </div>
              )}
            </div>
          )}
          
          {/* Step 3: Preview */}
          {step === 'preview' && (
            <div className="space-y-4">
              <p className="text-slate-400 mb-4">
                Review the data before importing. Showing first 10 records.
              </p>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-950">
                      {Object.values(columnMapping).filter(Boolean).map(field => (
                        <th key={field} className="px-3 py-2 text-left text-xs font-bold text-slate-400 uppercase">
                          {field}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {transformData().slice(0, 10).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        {Object.values(columnMapping).filter(Boolean).map(field => (
                          <td key={field} className="px-3 py-2 text-slate-300">
                            {String(row[field] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {parsedData.length > 10 && (
                <p className="text-slate-500 text-sm">
                  ...and {parsedData.length - 10} more records
                </p>
              )}
            </div>
          )}
          
          {/* Step 4: Complete */}
          {step === 'complete' && importResult && (
            <div className="text-center py-8">
              {importResult.success ? (
                <>
                  <CheckCircle2 className="mx-auto mb-4 text-emerald-400" size={64} />
                  <h3 className="text-2xl font-bold text-white mb-2">Import Complete!</h3>
                  <p className="text-slate-400">
                    Successfully imported {importResult.count} {importType}s
                  </p>
                </>
              ) : (
                <>
                  <AlertCircle className="mx-auto mb-4 text-red-400" size={64} />
                  <h3 className="text-2xl font-bold text-white mb-2">Import Failed</h3>
                </>
              )}
              
              {importResult.errors.length > 0 && (
                <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-left">
                  <h4 className="text-sm font-bold text-yellow-400 mb-2">Warnings/Errors:</h4>
                  <ul className="text-sm text-yellow-300/80 space-y-1">
                    {importResult.errors.map((error, idx) => (
                      <li key={idx}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-between">
          <button
            onClick={() => {
              if (step === 'upload') {
                resetState();
                onClose();
              } else if (step === 'complete') {
                resetState();
              } else {
                const steps: Step[] = ['upload', 'mapping', 'preview', 'complete'];
                const currentIdx = steps.indexOf(step);
                if (currentIdx > 0) setStep(steps[currentIdx - 1]);
              }
            }}
            className="px-4 py-2 text-slate-400 hover:text-white transition-colors flex items-center gap-2"
          >
            <ChevronLeft size={18} />
            {step === 'upload' ? 'Cancel' : step === 'complete' ? 'Import More' : 'Back'}
          </button>
          
          {step !== 'complete' && (
            <button
              onClick={() => {
                if (step === 'preview') {
                  executeImport();
                } else {
                  const steps: Step[] = ['upload', 'mapping', 'preview', 'complete'];
                  const currentIdx = steps.indexOf(step);
                  if (currentIdx < steps.length - 1) setStep(steps[currentIdx + 1]);
                }
              }}
              disabled={!canProceed() || isImporting}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-bold transition-colors flex items-center gap-2"
            >
              {isImporting ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  Importing...
                </>
              ) : step === 'preview' ? (
                <>
                  Import {parsedData.length} Records
                  <CheckCircle2 size={18} />
                </>
              ) : (
                <>
                  Continue
                  <ChevronRight size={18} />
                </>
              )}
            </button>
          )}
          
          {step === 'complete' && (
            <button
              onClick={() => { resetState(); onClose(); }}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-colors"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
