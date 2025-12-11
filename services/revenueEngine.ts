/**
 * Predictive Revenue Engine
 * Computes 30/60/90 day revenue forecasts based on lead pipeline and project data
 */

import { Lead, Project, Commission } from '../types';

// Probability weights by lead status
const STATUS_PROBABILITY: Record<string, number> = {
  NEW: 0.10,
  QUALIFIED: 0.25,
  PROPOSAL_SENT: 0.45,
  CLOSED_WON: 0.95,
  CLOSED_LOST: 0.0,
};

// Project stages override lead probability (already won)
const STAGE_PROBABILITY: Record<string, number> = {
  SITE_SURVEY: 0.90,
  DESIGN: 0.92,
  PERMITTING: 0.95,
  INSTALL: 1.0,
  INSPECTION: 1.0,
  PTO: 1.0,
};

// Default commission rate
const COMMISSION_RATE = 0.06;

// Average days per stage (for velocity calculations)
const AVG_STAGE_DAYS: Record<string, number> = {
  SITE_SURVEY: 3,
  DESIGN: 7,
  PERMITTING: 5,
  INSTALL: 14,
  INSPECTION: 7,
  PTO: 10,
};

// SLA penalty days
const SLA_PENALTIES: Record<string, number> = {
  onTrack: 0,
  atRisk: 4,
  late: 10,
};

export interface RevenueForecast {
  revenue30: number;
  revenue60: number;
  revenue90: number;
  expectedCommissions: number;
  expectedInstalls: number;
  confidence: number;
  breakdown: {
    byStage: Record<string, number>;
    byRep: Record<string, number>;
    byPriority: Record<string, number>;
  };
}

/**
 * Calculate expected days until a project completes
 */
function getExpectedDaysToComplete(project: Project): number {
  const stageOrder = ['SITE_SURVEY', 'DESIGN', 'PERMITTING', 'INSTALL', 'INSPECTION', 'PTO'];
  const currentIndex = stageOrder.indexOf(project.stage);
  
  if (currentIndex === -1 || project.stage === 'PTO') return 0;
  
  // Sum remaining stage days
  let remainingDays = 0;
  for (let i = currentIndex; i < stageOrder.length; i++) {
    remainingDays += AVG_STAGE_DAYS[stageOrder[i]] || 7;
  }
  
  // Apply SLA penalty
  const penalty = SLA_PENALTIES[project.slaStatus || 'onTrack'] || 0;
  remainingDays += penalty;
  
  return remainingDays;
}

/**
 * Estimate when a lead will convert to revenue
 */
function getLeadConversionDays(lead: Lead): number {
  // Average days from status to closed won
  const statusDays: Record<string, number> = {
    NEW: 45,
    QUALIFIED: 30,
    PROPOSAL_SENT: 14,
    CLOSED_WON: 0,
    CLOSED_LOST: Infinity,
  };
  
  const baseDays = statusDays[lead.status] || 30;
  
  // Adjust by priority
  const priorityMultiplier: Record<string, number> = {
    high: 0.7,
    medium: 1.0,
    low: 1.3,
  };
  
  return Math.round(baseDays * (priorityMultiplier[lead.priority || 'medium'] || 1));
}

/**
 * Calculate expected revenue from a lead
 */
function calculateLeadRevenue(lead: Lead): number {
  const probability = STATUS_PROBABILITY[lead.status] || 0;
  const estimatedBill = lead.estimatedBill || 0;
  
  // Boost probability for high AI scores
  let scoreBoost = 1.0;
  if (lead.aiScore && lead.aiScore >= 80) scoreBoost = 1.15;
  else if (lead.aiScore && lead.aiScore >= 60) scoreBoost = 1.05;
  
  return estimatedBill * COMMISSION_RATE * probability * scoreBoost;
}

/**
 * Calculate expected revenue from a project
 */
function calculateProjectRevenue(project: Project): number {
  const probability = STAGE_PROBABILITY[project.stage] || 0.9;
  const systemSize = project.kW || 8; // Default 8kW
  const pricePerWatt = 3.0; // Average $/W
  const systemValue = systemSize * 1000 * pricePerWatt;
  
  return systemValue * COMMISSION_RATE * probability;
}

/**
 * Main forecast computation
 */
export function computeRevenueForecast(
  leads: Lead[],
  projects: Project[],
  commissions: Commission[]
): RevenueForecast {
  let revenue30 = 0;
  let revenue60 = 0;
  let revenue90 = 0;
  
  const byStage: Record<string, number> = {};
  const byRep: Record<string, number> = {};
  const byPriority: Record<string, number> = {};
  
  // Process leads
  leads.forEach(lead => {
    if (lead.status === 'CLOSED_LOST') return;
    
    const expectedRevenue = calculateLeadRevenue(lead);
    const daysToConvert = getLeadConversionDays(lead);
    
    // Add to appropriate time bucket
    if (daysToConvert <= 30) {
      revenue30 += expectedRevenue;
      revenue60 += expectedRevenue;
      revenue90 += expectedRevenue;
    } else if (daysToConvert <= 60) {
      revenue60 += expectedRevenue;
      revenue90 += expectedRevenue;
    } else if (daysToConvert <= 90) {
      revenue90 += expectedRevenue;
    }
    
    // Breakdown by status (using status as stage proxy)
    byStage[lead.status] = (byStage[lead.status] || 0) + expectedRevenue;
    
    // Breakdown by rep
    const rep = lead.assignedTo || 'Unassigned';
    byRep[rep] = (byRep[rep] || 0) + expectedRevenue;
    
    // Breakdown by priority
    const priority = lead.priority || 'medium';
    byPriority[priority] = (byPriority[priority] || 0) + expectedRevenue;
  });
  
  // Process projects (these are more certain revenue)
  let expectedInstalls = 0;
  
  projects.forEach(project => {
    if (project.stage === 'PTO') return; // Already completed
    
    const expectedRevenue = calculateProjectRevenue(project);
    const daysToComplete = getExpectedDaysToComplete(project);
    
    // Add to time buckets
    if (daysToComplete <= 30) {
      revenue30 += expectedRevenue;
      revenue60 += expectedRevenue;
      revenue90 += expectedRevenue;
      expectedInstalls++;
    } else if (daysToComplete <= 60) {
      revenue60 += expectedRevenue;
      revenue90 += expectedRevenue;
      if (daysToComplete <= 45) expectedInstalls++;
    } else if (daysToComplete <= 90) {
      revenue90 += expectedRevenue;
    }
    
    // Breakdown by stage
    byStage[project.stage] = (byStage[project.stage] || 0) + expectedRevenue;
  });
  
  // Calculate expected commissions from pending/approved
  const expectedCommissions = commissions
    .filter(c => c.status === 'PENDING' || c.status === 'APPROVED')
    .reduce((sum, c) => sum + (c.amountUsd || 0), 0);
  
  // Calculate confidence score
  const confidence = calculateConfidence(leads, projects);
  
  return {
    revenue30: Math.round(revenue30),
    revenue60: Math.round(revenue60),
    revenue90: Math.round(revenue90),
    expectedCommissions: Math.round(expectedCommissions),
    expectedInstalls,
    confidence,
    breakdown: {
      byStage,
      byRep,
      byPriority,
    },
  };
}

/**
 * Calculate forecast confidence (0-100)
 */
function calculateConfidence(leads: Lead[], projects: Project[]): number {
  if (leads.length === 0 && projects.length === 0) return 0;
  
  let confidencePoints = 50; // Base confidence
  
  // More projects = higher confidence (they're further in pipeline)
  const projectRatio = projects.length / Math.max(leads.length, 1);
  confidencePoints += Math.min(projectRatio * 20, 20);
  
  // High priority leads boost confidence (they convert faster)
  const highPriorityRatio = leads.filter(l => l.priority === 'high').length / Math.max(leads.length, 1);
  confidencePoints += highPriorityRatio * 10;
  
  // Leads with high AI scores boost confidence
  const highScoreLeads = leads.filter(l => (l.aiScore || 0) >= 70).length;
  confidencePoints += (highScoreLeads / Math.max(leads.length, 1)) * 10;
  
  // Projects on track boost confidence
  const onTrackProjects = projects.filter(p => p.slaStatus === 'onTrack' || !p.slaStatus).length;
  confidencePoints += (onTrackProjects / Math.max(projects.length, 1)) * 10;
  
  // Penalize for at-risk/late projects
  const atRiskProjects = projects.filter(p => p.slaStatus === 'atRisk' || p.slaStatus === 'late').length;
  confidencePoints -= (atRiskProjects / Math.max(projects.length, 1)) * 15;
  
  return Math.max(0, Math.min(100, Math.round(confidencePoints)));
}

/**
 * Get confidence label
 */
export function getConfidenceLabel(confidence: number): { label: string; color: string } {
  if (confidence >= 80) return { label: 'High', color: 'text-emerald-400' };
  if (confidence >= 50) return { label: 'Medium', color: 'text-amber-400' };
  return { label: 'Low', color: 'text-red-400' };
}
