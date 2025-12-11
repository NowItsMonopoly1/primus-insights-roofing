// services/commissionRules.ts
// Commission Structure Builder - Configurable commission tiers and bonuses

import { getActiveCompanyId } from './companyStore';

const COMMISSION_RULES_KEY = 'primus_commission_rules';

// Simple UUID generator
function generateId(): string {
  return 'cr_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
}

// Commission tier applies to these deal types
export type DealType = 'install' | 'bankFinance' | 'cash' | 'lease' | 'ppa' | 'loan';

export interface CommissionTier {
  id: string;
  label: string;
  rate: number; // Decimal (e.g., 0.06 = 6%)
  appliesTo: DealType[];
  minDealValue?: number;
  maxDealValue?: number;
  isDefault?: boolean;
}

export interface BonusCondition {
  field: string; // e.g., "estimatedBill", "systemSize", "kW"
  operator: 'gte' | 'lte' | 'eq' | 'gt' | 'lt';
  value: number;
}

export interface CommissionBonus {
  id: string;
  label: string;
  condition: BonusCondition;
  amount: number; // Flat bonus amount in dollars
  isPercentage?: boolean; // If true, amount is a percentage
  isActive: boolean;
}

export interface CommissionRules {
  companyId: string;
  tiers: CommissionTier[];
  bonuses: CommissionBonus[];
  version: number;
  updatedAt: string;
}

// Default commission tiers for solar sales
export const DEFAULT_COMMISSION_TIERS: CommissionTier[] = [
  {
    id: 'tier_standard',
    label: 'Standard Install',
    rate: 0.06, // 6%
    appliesTo: ['install', 'cash'],
    isDefault: true,
  },
  {
    id: 'tier_financed',
    label: 'Financed Deal',
    rate: 0.05, // 5%
    appliesTo: ['bankFinance', 'loan'],
  },
  {
    id: 'tier_lease_ppa',
    label: 'Lease/PPA',
    rate: 0.04, // 4%
    appliesTo: ['lease', 'ppa'],
  },
];

// Default bonuses
export const DEFAULT_COMMISSION_BONUSES: CommissionBonus[] = [
  {
    id: 'bonus_high_bill',
    label: 'High Bill Bonus',
    condition: { field: 'estimatedBill', operator: 'gte', value: 200 },
    amount: 150,
    isActive: true,
  },
  {
    id: 'bonus_large_system',
    label: 'Large System Bonus',
    condition: { field: 'kW', operator: 'gte', value: 10 },
    amount: 250,
    isActive: true,
  },
  {
    id: 'bonus_quick_close',
    label: 'Quick Close Bonus',
    condition: { field: 'daysToClose', operator: 'lte', value: 14 },
    amount: 100,
    isActive: false,
  },
];

// Load commission rules for a company
export function loadCommissionRules(companyId?: string): CommissionRules {
  const activeCompany = companyId || getActiveCompanyId();
  const key = `${COMMISSION_RULES_KEY}_${activeCompany}`;

  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Failed to load commission rules:', e);
  }

  // Return default rules
  return {
    companyId: activeCompany,
    tiers: [...DEFAULT_COMMISSION_TIERS],
    bonuses: [...DEFAULT_COMMISSION_BONUSES],
    version: 1,
    updatedAt: new Date().toISOString(),
  };
}

// Save commission rules for a company
export function saveCommissionRules(companyId: string | undefined, rules: CommissionRules): void {
  const activeCompany = companyId || getActiveCompanyId();
  const key = `${COMMISSION_RULES_KEY}_${activeCompany}`;

  rules.companyId = activeCompany;
  rules.version = (rules.version || 0) + 1;
  rules.updatedAt = new Date().toISOString();

  localStorage.setItem(key, JSON.stringify(rules));
}

// Add a new commission tier
export function addCommissionTier(companyId: string | undefined, tier: Omit<CommissionTier, 'id'>): CommissionTier {
  const rules = loadCommissionRules(companyId);
  const newTier: CommissionTier = {
    ...tier,
    id: generateId(),
  };
  rules.tiers.push(newTier);
  saveCommissionRules(companyId, rules);
  return newTier;
}

// Update a commission tier
export function updateCommissionTier(companyId: string | undefined, tierId: string, updates: Partial<CommissionTier>): void {
  const rules = loadCommissionRules(companyId);
  const tierIdx = rules.tiers.findIndex(t => t.id === tierId);
  if (tierIdx !== -1) {
    rules.tiers[tierIdx] = { ...rules.tiers[tierIdx], ...updates, id: tierId };
    saveCommissionRules(companyId, rules);
  }
}

// Delete a commission tier
export function deleteCommissionTier(companyId: string | undefined, tierId: string): boolean {
  const rules = loadCommissionRules(companyId);
  const originalLength = rules.tiers.length;
  rules.tiers = rules.tiers.filter(t => t.id !== tierId);
  if (rules.tiers.length < originalLength) {
    saveCommissionRules(companyId, rules);
    return true;
  }
  return false;
}

// Add a new bonus
export function addCommissionBonus(companyId: string | undefined, bonus: Omit<CommissionBonus, 'id'>): CommissionBonus {
  const rules = loadCommissionRules(companyId);
  const newBonus: CommissionBonus = {
    ...bonus,
    id: generateId(),
  };
  rules.bonuses.push(newBonus);
  saveCommissionRules(companyId, rules);
  return newBonus;
}

// Update a bonus
export function updateCommissionBonus(companyId: string | undefined, bonusId: string, updates: Partial<CommissionBonus>): void {
  const rules = loadCommissionRules(companyId);
  const bonusIdx = rules.bonuses.findIndex(b => b.id === bonusId);
  if (bonusIdx !== -1) {
    rules.bonuses[bonusIdx] = { ...rules.bonuses[bonusIdx], ...updates, id: bonusId };
    saveCommissionRules(companyId, rules);
  }
}

// Delete a bonus
export function deleteCommissionBonus(companyId: string | undefined, bonusId: string): boolean {
  const rules = loadCommissionRules(companyId);
  const originalLength = rules.bonuses.length;
  rules.bonuses = rules.bonuses.filter(b => b.id !== bonusId);
  if (rules.bonuses.length < originalLength) {
    saveCommissionRules(companyId, rules);
    return true;
  }
  return false;
}

// Toggle bonus active state
export function toggleBonusActive(companyId: string | undefined, bonusId: string): void {
  const rules = loadCommissionRules(companyId);
  const bonus = rules.bonuses.find(b => b.id === bonusId);
  if (bonus) {
    bonus.isActive = !bonus.isActive;
    saveCommissionRules(companyId, rules);
  }
}

// Reset to defaults
export function resetCommissionRulesToDefaults(companyId?: string): void {
  const activeCompany = companyId || getActiveCompanyId();
  saveCommissionRules(activeCompany, {
    companyId: activeCompany,
    tiers: [...DEFAULT_COMMISSION_TIERS],
    bonuses: [...DEFAULT_COMMISSION_BONUSES],
    version: 1,
    updatedAt: new Date().toISOString(),
  });
}

// Evaluate a bonus condition against project/lead data
function evaluateCondition(condition: BonusCondition, data: Record<string, any>): boolean {
  const fieldValue = data[condition.field];
  if (fieldValue === undefined || fieldValue === null) return false;

  const numValue = Number(fieldValue);
  if (isNaN(numValue)) return false;

  switch (condition.operator) {
    case 'gte': return numValue >= condition.value;
    case 'lte': return numValue <= condition.value;
    case 'gt': return numValue > condition.value;
    case 'lt': return numValue < condition.value;
    case 'eq': return numValue === condition.value;
    default: return false;
  }
}

// Get the applicable commission tier for a project
export function getApplicableTier(project: Record<string, any>, rules: CommissionRules): CommissionTier | null {
  const dealType = project.financingType || project.dealType || 'install';
  
  // Find tier that applies to this deal type
  let tier = rules.tiers.find(t => t.appliesTo.includes(dealType as DealType));
  
  // If no specific tier, use default
  if (!tier) {
    tier = rules.tiers.find(t => t.isDefault);
  }
  
  // Check min/max deal value constraints
  if (tier && project.dealValue) {
    if (tier.minDealValue && project.dealValue < tier.minDealValue) return null;
    if (tier.maxDealValue && project.dealValue > tier.maxDealValue) return null;
  }

  return tier || null;
}

// Get all applicable bonuses for a project/lead
export function getApplicableBonuses(data: Record<string, any>, rules: CommissionRules): CommissionBonus[] {
  return rules.bonuses.filter(bonus => 
    bonus.isActive && evaluateCondition(bonus.condition, data)
  );
}

// Calculate total commission for a project
export interface CommissionCalculation {
  baseAmount: number;
  tierUsed: CommissionTier | null;
  bonusesApplied: { bonus: CommissionBonus; amount: number }[];
  totalBonuses: number;
  totalCommission: number;
  breakdown: string;
}

export function calculateCommission(
  project: Record<string, any>,
  rules?: CommissionRules,
  companyId?: string
): CommissionCalculation {
  const effectiveRules = rules || loadCommissionRules(companyId);
  
  // Get deal value (could be systemValue, dealValue, or calculated from kW)
  const dealValue = project.dealValue || project.systemValue || (project.kW || 0) * 3000; // ~$3/watt estimate
  
  // Find applicable tier
  const tier = getApplicableTier(project, effectiveRules);
  const baseAmount = tier ? dealValue * tier.rate : 0;
  
  // Calculate bonuses
  const applicableBonuses = getApplicableBonuses(project, effectiveRules);
  const bonusDetails = applicableBonuses.map(bonus => ({
    bonus,
    amount: bonus.isPercentage ? dealValue * (bonus.amount / 100) : bonus.amount,
  }));
  
  const totalBonuses = bonusDetails.reduce((sum, b) => sum + b.amount, 0);
  const totalCommission = baseAmount + totalBonuses;
  
  // Build breakdown string
  const breakdownParts: string[] = [];
  if (tier) {
    breakdownParts.push(`Base (${tier.label} @ ${(tier.rate * 100).toFixed(1)}%): $${baseAmount.toLocaleString()}`);
  }
  bonusDetails.forEach(bd => {
    breakdownParts.push(`+ ${bd.bonus.label}: $${bd.amount.toLocaleString()}`);
  });
  
  return {
    baseAmount,
    tierUsed: tier,
    bonusesApplied: bonusDetails,
    totalBonuses,
    totalCommission,
    breakdown: breakdownParts.join('\n'),
  };
}

// Deal type options for UI
export const DEAL_TYPE_OPTIONS: { value: DealType; label: string }[] = [
  { value: 'install', label: 'Standard Install' },
  { value: 'cash', label: 'Cash Purchase' },
  { value: 'bankFinance', label: 'Bank Finance' },
  { value: 'loan', label: 'Solar Loan' },
  { value: 'lease', label: 'Solar Lease' },
  { value: 'ppa', label: 'PPA' },
];

// Condition field options for bonuses
export const CONDITION_FIELD_OPTIONS: { value: string; label: string }[] = [
  { value: 'estimatedBill', label: 'Monthly Electric Bill ($)' },
  { value: 'kW', label: 'System Size (kW)' },
  { value: 'dealValue', label: 'Deal Value ($)' },
  { value: 'daysToClose', label: 'Days to Close' },
  { value: 'panelCount', label: 'Number of Panels' },
];

// Operator options
export const OPERATOR_OPTIONS: { value: BonusCondition['operator']; label: string }[] = [
  { value: 'gte', label: '≥ (Greater or Equal)' },
  { value: 'gt', label: '> (Greater Than)' },
  { value: 'lte', label: '≤ (Less or Equal)' },
  { value: 'lt', label: '< (Less Than)' },
  { value: 'eq', label: '= (Equals)' },
];
