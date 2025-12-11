// services/pipelineConfig.ts
// Pipeline Configuration System - Customizable stages per company

import { getActiveCompanyId } from './companyStore';

// ============================================================================
// TYPES
// ============================================================================

export interface PipelineStage {
  id: string;
  name: string;
  order: number;
  color?: string;
  description?: string;
}

// ============================================================================
// DEFAULT PIPELINE (backwards compatible with existing ProjectStage type)
// ============================================================================

export const DEFAULT_PIPELINE_STAGES: PipelineStage[] = [
  { id: 'SITE_SURVEY', name: 'Site Survey', order: 0, color: 'blue' },
  { id: 'DESIGN', name: 'Design', order: 1, color: 'purple' },
  { id: 'PERMITTING', name: 'Permitting', order: 2, color: 'amber' },
  { id: 'INSTALL', name: 'Install', order: 3, color: 'orange' },
  { id: 'INSPECTION', name: 'Inspection', order: 4, color: 'cyan' },
  { id: 'PTO', name: 'PTO', order: 5, color: 'emerald' },
];

export const DEFAULT_PIPELINE = [
  'SITE_SURVEY',
  'DESIGN',
  'PERMITTING',
  'INSTALL',
  'INSPECTION',
  'PTO',
];

// Legacy mapping for display names
export const STAGE_DISPLAY_NAMES: Record<string, string> = {
  'SITE_SURVEY': 'Site Survey',
  'DESIGN': 'Design',
  'PERMITTING': 'Permitting',
  'INSTALL': 'Install',
  'INSPECTION': 'Inspection',
  'PTO': 'PTO',
};

// ============================================================================
// STORAGE KEY
// ============================================================================

const PIPELINE_STORAGE_KEY = 'primus_pipeline_config';

// ============================================================================
// LOAD / SAVE FUNCTIONS
// ============================================================================

/**
 * Load pipeline configuration for a company
 */
export function loadPipeline(companyId?: string): PipelineStage[] {
  const id = companyId || getActiveCompanyId();
  try {
    const stored = localStorage.getItem(PIPELINE_STORAGE_KEY);
    if (stored) {
      const allConfigs = JSON.parse(stored);
      if (allConfigs[id]) {
        return allConfigs[id];
      }
    }
  } catch (error) {
    console.error('Failed to load pipeline config:', error);
  }
  return [...DEFAULT_PIPELINE_STAGES];
}

/**
 * Save pipeline configuration for a company
 */
export function savePipeline(companyId: string, stages: PipelineStage[]): void {
  try {
    const stored = localStorage.getItem(PIPELINE_STORAGE_KEY);
    const allConfigs = stored ? JSON.parse(stored) : {};
    allConfigs[companyId] = stages;
    localStorage.setItem(PIPELINE_STORAGE_KEY, JSON.stringify(allConfigs));
  } catch (error) {
    console.error('Failed to save pipeline config:', error);
  }
}

/**
 * Get pipeline as simple array of stage IDs (for compatibility)
 */
export function getPipelineOrder(companyId?: string): string[] {
  const stages = loadPipeline(companyId);
  return stages.sort((a, b) => a.order - b.order).map(s => s.id);
}

/**
 * Get stage display name
 */
export function getStageDisplayName(stageId: string, companyId?: string): string {
  const stages = loadPipeline(companyId);
  const stage = stages.find(s => s.id === stageId);
  return stage?.name || STAGE_DISPLAY_NAMES[stageId] || stageId;
}

/**
 * Get stage by ID
 */
export function getStageById(stageId: string, companyId?: string): PipelineStage | null {
  const stages = loadPipeline(companyId);
  return stages.find(s => s.id === stageId) || null;
}

/**
 * Get next stage in pipeline
 */
export function getNextStage(currentStageId: string, companyId?: string): string | null {
  const order = getPipelineOrder(companyId);
  const currentIndex = order.indexOf(currentStageId);
  if (currentIndex === -1 || currentIndex >= order.length - 1) {
    return null;
  }
  return order[currentIndex + 1];
}

/**
 * Get stage index (0-based)
 */
export function getStageIndex(stageId: string, companyId?: string): number {
  const order = getPipelineOrder(companyId);
  return order.indexOf(stageId);
}

/**
 * Check if stage is final
 */
export function isFinalStage(stageId: string, companyId?: string): boolean {
  const order = getPipelineOrder(companyId);
  return order.indexOf(stageId) === order.length - 1;
}

/**
 * Add a new stage to pipeline
 */
export function addStage(companyId: string, stageName: string): PipelineStage {
  const stages = loadPipeline(companyId);
  const newStage: PipelineStage = {
    id: stageName.toUpperCase().replace(/\s+/g, '_'),
    name: stageName,
    order: stages.length,
  };
  stages.push(newStage);
  savePipeline(companyId, stages);
  return newStage;
}

/**
 * Remove a stage from pipeline
 */
export function removeStage(companyId: string, stageId: string): boolean {
  const stages = loadPipeline(companyId);
  const index = stages.findIndex(s => s.id === stageId);
  if (index === -1) return false;
  
  stages.splice(index, 1);
  // Reorder remaining stages
  stages.forEach((s, i) => { s.order = i; });
  savePipeline(companyId, stages);
  return true;
}

/**
 * Update stage name
 */
export function updateStageName(companyId: string, stageId: string, newName: string): boolean {
  const stages = loadPipeline(companyId);
  const stage = stages.find(s => s.id === stageId);
  if (!stage) return false;
  
  stage.name = newName;
  savePipeline(companyId, stages);
  return true;
}

/**
 * Reorder stages
 */
export function reorderStages(companyId: string, stageIds: string[]): void {
  const stages = loadPipeline(companyId);
  const reordered = stageIds.map((id, index) => {
    const stage = stages.find(s => s.id === id);
    if (stage) {
      return { ...stage, order: index };
    }
    return null;
  }).filter(Boolean) as PipelineStage[];
  
  savePipeline(companyId, reordered);
}

/**
 * Reset pipeline to defaults
 */
export function resetPipelineToDefaults(companyId: string): void {
  savePipeline(companyId, [...DEFAULT_PIPELINE_STAGES]);
}

/**
 * Get all stage colors for UI
 */
export function getStageColor(stageId: string, companyId?: string): string {
  const stage = getStageById(stageId, companyId);
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    orange: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    cyan: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    red: 'bg-red-500/20 text-red-400 border-red-500/30',
    pink: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  };
  return colorMap[stage?.color || 'blue'] || colorMap.blue;
}
