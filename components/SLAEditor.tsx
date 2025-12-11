// components/SLAEditor.tsx
// SLA Rules Editor - Customize SLA thresholds per stage

import React, { useState, useEffect } from 'react';
import {
  Clock,
  AlertTriangle,
  XCircle,
  Save,
  RotateCcw,
  Check,
  Info,
} from 'lucide-react';
import {
  loadSLA,
  saveSLA,
  resetSLAToDefaults,
  initializeSLAForPipeline,
  SLAConfig,
  DEFAULT_SLA,
  getTotalPipelineDays,
} from '../services/slaRules';
import { loadPipeline, PipelineStage } from '../services/pipelineConfig';
import { getActiveCompanyId } from '../services/companyStore';

export default function SLAEditor() {
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [slaConfig, setSLAConfig] = useState<SLAConfig>({});
  const [isSaved, setIsSaved] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const companyId = getActiveCompanyId();

  useEffect(() => {
    const loadedStages = loadPipeline(companyId);
    setStages(loadedStages);
    
    // Initialize SLA for any new stages
    const config = initializeSLAForPipeline(companyId);
    setSLAConfig(config);
  }, [companyId]);

  const validateRule = (stageId: string, field: string, value: number): string | null => {
    if (isNaN(value) || value < 0) {
      return 'Must be a positive number';
    }
    
    const rule = slaConfig[stageId] || { target: 0, risk: 0, late: 0 };
    const newRule = { ...rule, [field]: value };
    
    if (newRule.risk > newRule.late) {
      return 'Risk threshold must be less than late threshold';
    }
    if (newRule.target > newRule.late) {
      return 'Target days should not exceed late threshold';
    }
    
    return null;
  };

  const handleChange = (stageId: string, field: 'target' | 'risk' | 'late', value: string) => {
    const numValue = parseInt(value) || 0;
    
    // Validate
    const error = validateRule(stageId, field, numValue);
    setErrors(prev => ({
      ...prev,
      [`${stageId}-${field}`]: error || '',
    }));
    
    // Update config
    setSLAConfig(prev => ({
      ...prev,
      [stageId]: {
        ...prev[stageId],
        [field]: numValue,
      },
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    // Check for errors
    const hasErrors = Object.values(errors).some(e => e);
    if (hasErrors) {
      alert('Please fix validation errors before saving');
      return;
    }
    
    saveSLA(companyId, slaConfig);
    setIsSaved(true);
    setHasChanges(false);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleResetDefaults = () => {
    if (confirm('Reset all SLA rules to defaults?')) {
      resetSLAToDefaults(companyId);
      setSLAConfig({ ...DEFAULT_SLA });
      setHasChanges(true);
      setErrors({});
    }
  };

  const totalDays = getTotalPipelineDays(companyId);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-white">SLA Rules</h3>
          <p className="text-sm text-slate-400 mt-1">
            Configure target days and thresholds for each pipeline stage
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-all"
          >
            <RotateCcw size={14} />
            Reset Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              hasChanges
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            {isSaved ? <Check size={16} /> : <Save size={16} />}
            {isSaved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Clock size={20} className="text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Pipeline Duration</p>
              <p className="text-2xl font-bold text-white">{totalDays} days</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-400">Based on target days</p>
            <p className="text-sm text-slate-500">{stages.length} stages</p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-emerald-500/20 border border-emerald-500/30 rounded"></div>
          <span className="text-slate-400">Target Days - Ideal completion time</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-amber-500/20 border border-amber-500/30 rounded"></div>
          <span className="text-slate-400">At Risk - Warning threshold</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500/20 border border-red-500/30 rounded"></div>
          <span className="text-slate-400">Late - Critical threshold</span>
        </div>
      </div>

      {/* SLA Rules Table */}
      <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700/50 bg-slate-800/50">
          <div className="grid grid-cols-12 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <div className="col-span-4">Stage</div>
            <div className="col-span-2 text-center">
              <div className="flex items-center justify-center gap-1">
                <Clock size={12} className="text-emerald-400" />
                Target Days
              </div>
            </div>
            <div className="col-span-3 text-center">
              <div className="flex items-center justify-center gap-1">
                <AlertTriangle size={12} className="text-amber-400" />
                At Risk (days)
              </div>
            </div>
            <div className="col-span-3 text-center">
              <div className="flex items-center justify-center gap-1">
                <XCircle size={12} className="text-red-400" />
                Late (days)
              </div>
            </div>
          </div>
        </div>
        
        <div className="divide-y divide-slate-700/50">
          {stages.sort((a, b) => a.order - b.order).map((stage) => {
            const rule = slaConfig[stage.id] || { target: 7, risk: 5, late: 14 };
            const targetError = errors[`${stage.id}-target`];
            const riskError = errors[`${stage.id}-risk`];
            const lateError = errors[`${stage.id}-late`];
            
            return (
              <div
                key={stage.id}
                className="px-4 py-4 hover:bg-slate-800/30 transition-colors"
              >
                <div className="grid grid-cols-12 items-center gap-4">
                  {/* Stage Name */}
                  <div className="col-span-4">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 text-xs font-mono">
                        {stage.order + 1}.
                      </span>
                      <span className="text-white font-medium">{stage.name}</span>
                    </div>
                    <span className="text-slate-600 text-xs">{stage.id}</span>
                  </div>

                  {/* Target Days */}
                  <div className="col-span-2">
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        value={rule.target}
                        onChange={(e) => handleChange(stage.id, 'target', e.target.value)}
                        className={`w-full bg-slate-950 border rounded-lg px-3 py-2 text-center text-white text-sm focus:outline-none transition-all ${
                          targetError
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-emerald-500/30 focus:border-emerald-500'
                        }`}
                        aria-label={`Target days for ${stage.name}`}
                      />
                      {targetError && (
                        <p className="text-red-400 text-xs mt-1">{targetError}</p>
                      )}
                    </div>
                  </div>

                  {/* Risk Threshold */}
                  <div className="col-span-3">
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        value={rule.risk}
                        onChange={(e) => handleChange(stage.id, 'risk', e.target.value)}
                        className={`w-full bg-slate-950 border rounded-lg px-3 py-2 text-center text-white text-sm focus:outline-none transition-all ${
                          riskError
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-amber-500/30 focus:border-amber-500'
                        }`}
                        aria-label={`Risk threshold for ${stage.name}`}
                      />
                      <p className="text-slate-500 text-xs text-center mt-1">
                        Days until "At Risk"
                      </p>
                      {riskError && (
                        <p className="text-red-400 text-xs mt-1">{riskError}</p>
                      )}
                    </div>
                  </div>

                  {/* Late Threshold */}
                  <div className="col-span-3">
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        value={rule.late}
                        onChange={(e) => handleChange(stage.id, 'late', e.target.value)}
                        className={`w-full bg-slate-950 border rounded-lg px-3 py-2 text-center text-white text-sm focus:outline-none transition-all ${
                          lateError
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-red-500/30 focus:border-red-500'
                        }`}
                        aria-label={`Late threshold for ${stage.name}`}
                      />
                      <p className="text-slate-500 text-xs text-center mt-1">
                        Days until "Late"
                      </p>
                      {lateError && (
                        <p className="text-red-400 text-xs mt-1">{lateError}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex items-start gap-3">
        <Info size={18} className="text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-300">
          <p className="font-medium mb-1">How SLA Thresholds Work</p>
          <ul className="list-disc list-inside text-blue-300/80 space-y-1">
            <li><strong>Target Days:</strong> The ideal number of days to complete each stage</li>
            <li><strong>At Risk:</strong> Projects in a stage longer than this will be flagged as "At Risk"</li>
            <li><strong>Late:</strong> Projects exceeding this threshold will be marked as "Late"</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
