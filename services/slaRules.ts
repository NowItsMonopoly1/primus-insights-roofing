// services/slaRules.ts
// SLA Rules Configuration System - Customizable SLA thresholds per company

import { getActiveCompanyId } from './companyStore';
import { loadPipeline, DEFAULT_PIPELINE_STAGES } from './pipelineConfig';

// ============================================================================
// TYPES
// ============================================================================

export interface SLARule {
  stageId: string;
  targetDays: number;    // Target days to complete stage
  riskDays: number;      // Days at which project becomes "at risk"
  lateDays: number;      // Days at which project becomes "late"
}

export interface SLAConfig {
  [stageId: string]: {
    target: number;
    risk: number;
    late: number;
  };
}

// ============================================================================
// DEFAULT SLA RULES
// ============================================================================

export const DEFAULT_SLA: SLAConfig = {
  'SITE_SURVEY': { target: 3, risk: 2, late: 5 },
  'DESIGN': { target: 7, risk: 5, late: 10 },
  'PERMITTING': { target: 14, risk: 10, late: 20 },
  'INSTALL': { target: 5, risk: 3, late: 7 },
  'INSPECTION': { target: 3, risk: 2, late: 5 },
  'PTO': { target: 10, risk: 7, late: 15 },
};

// ============================================================================
// STORAGE KEY
// ============================================================================

const SLA_STORAGE_KEY = 'primus_sla_config';

// ============================================================================
// LOAD / SAVE FUNCTIONS
// ============================================================================

/**
 * Load SLA configuration for a company
 */
export function loadSLA(companyId?: string): SLAConfig {
  const id = companyId || getActiveCompanyId();
  try {
    const stored = localStorage.getItem(SLA_STORAGE_KEY);
    if (stored) {
      const allConfigs = JSON.parse(stored);
      if (allConfigs[id]) {
        return allConfigs[id];
      }
    }
  } catch (error) {
    console.error('Failed to load SLA config:', error);
  }
  return { ...DEFAULT_SLA };
}

/**
 * Save SLA configuration for a company
 */
export function saveSLA(companyId: string, slaConfig: SLAConfig): void {
  try {
    const stored = localStorage.getItem(SLA_STORAGE_KEY);
    const allConfigs = stored ? JSON.parse(stored) : {};
    allConfigs[companyId] = slaConfig;
    localStorage.setItem(SLA_STORAGE_KEY, JSON.stringify(allConfigs));
  } catch (error) {
    console.error('Failed to save SLA config:', error);
  }
}

/**
 * Get SLA rule for a specific stage
 */
export function getSLARuleForStage(stageId: string, companyId?: string): { target: number; risk: number; late: number } {
  const slaConfig = loadSLA(companyId);
  return slaConfig[stageId] || { target: 7, risk: 5, late: 14 }; // Default fallback
}

/**
 * Update SLA rule for a specific stage
 */
export function updateSLARule(
  companyId: string,
  stageId: string,
  rule: { target: number; risk: number; late: number }
): void {
  const slaConfig = loadSLA(companyId);
  slaConfig[stageId] = rule;
  saveSLA(companyId, slaConfig);
}

/**
 * Reset SLA to defaults
 */
export function resetSLAToDefaults(companyId: string): void {
  saveSLA(companyId, { ...DEFAULT_SLA });
}

/**
 * Initialize SLA for custom stages (fills in defaults for new stages)
 */
export function initializeSLAForPipeline(companyId: string): SLAConfig {
  const stages = loadPipeline(companyId);
  const slaConfig = loadSLA(companyId);
  
  let updated = false;
  stages.forEach(stage => {
    if (!slaConfig[stage.id]) {
      // Default SLA for new stages
      slaConfig[stage.id] = { target: 7, risk: 5, late: 14 };
      updated = true;
    }
  });
  
  if (updated) {
    saveSLA(companyId, slaConfig);
  }
  
  return slaConfig;
}

// ============================================================================
// SLA STATUS CALCULATION
// ============================================================================

export type SLAStatus = 'onTrack' | 'atRisk' | 'late';

/**
 * Calculate SLA status for a project stage
 */
export function calculateSLAStatus(
  stageId: string,
  daysInStage: number,
  companyId?: string
): SLAStatus {
  const rule = getSLARuleForStage(stageId, companyId);
  
  if (daysInStage >= rule.late) {
    return 'late';
  }
  if (daysInStage >= rule.risk) {
    return 'atRisk';
  }
  return 'onTrack';
}

/**
 * Get days remaining before risk/late
 */
export function getDaysUntilRisk(
  stageId: string,
  daysInStage: number,
  companyId?: string
): { untilRisk: number; untilLate: number } {
  const rule = getSLARuleForStage(stageId, companyId);
  return {
    untilRisk: Math.max(0, rule.risk - daysInStage),
    untilLate: Math.max(0, rule.late - daysInStage),
  };
}

/**
 * Get SLA status color class
 */
export function getSLAStatusColor(status: SLAStatus): string {
  switch (status) {
    case 'onTrack':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'atRisk':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'late':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    default:
      return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  }
}

/**
 * Get SLA status badge text
 */
export function getSLAStatusText(status: SLAStatus): string {
  switch (status) {
    case 'onTrack':
      return 'On Track';
    case 'atRisk':
      return 'At Risk';
    case 'late':
      return 'Late';
    default:
      return 'Unknown';
  }
}

/**
 * Calculate overall project SLA health
 */
export function calculateProjectSLAHealth(
  stages: { stageId: string; daysInStage: number }[],
  companyId?: string
): { score: number; status: SLAStatus; lateCount: number; atRiskCount: number } {
  let lateCount = 0;
  let atRiskCount = 0;
  
  stages.forEach(({ stageId, daysInStage }) => {
    const status = calculateSLAStatus(stageId, daysInStage, companyId);
    if (status === 'late') lateCount++;
    if (status === 'atRisk') atRiskCount++;
  });
  
  // Calculate health score (100 = perfect, 0 = very bad)
  const totalStages = stages.length || 1;
  const score = Math.max(0, 100 - (lateCount * 30) - (atRiskCount * 10));
  
  let status: SLAStatus = 'onTrack';
  if (lateCount > 0) status = 'late';
  else if (atRiskCount > 0) status = 'atRisk';
  
  return { score, status, lateCount, atRiskCount };
}

/**
 * Get total expected days for full pipeline
 */
export function getTotalPipelineDays(companyId?: string): number {
  const stages = loadPipeline(companyId);
  const sla = loadSLA(companyId);
  
  return stages.reduce((total, stage) => {
    const rule = sla[stage.id] || { target: 7 };
    return total + rule.target;
  }, 0);
}
