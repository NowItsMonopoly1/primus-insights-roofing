// Backend-only types that mirror frontend types for API contracts
// These are duplicated intentionally to keep backend independent

export type LeadStatus =
  | "NEW"
  | "QUALIFIED"
  | "PROPOSAL_SENT"
  | "CLOSED_WON"
  | "CLOSED_LOST";

export interface LeadRouting {
  score: number;
  quality: "HOT" | "WARM" | "COLD";
  recommendedAgentType: string;
  reasoning: string;
}

export interface Lead {
  id: string;
  name: string;
  address: string;
  email?: string;
  phone?: string;
  notes?: string;
  status: LeadStatus;
  estimatedBill?: number;
  age?: number;
  createdAt: string;
  routing?: LeadRouting;
}

export type ProjectStage =
  | "SITE_SURVEY"
  | "DESIGN"
  | "PERMITTING"
  | "INSTALL"
  | "INSPECTION"
  | "PTO";

export interface SolarAnalysis {
  leadId: string;
  roofPitch: string;
  usableAreaSqft: number;
  sunHoursPerDay: number;
  systemSizeKw: number;
  viabilityScore: number;
  summary: string;
  systemCost: number;
  taxCredit30: number;
  netCost: number;
  estimatedMonthlyPayment: number;
  estimatedMonthlySavings: number;
  estimatedUtilityBillBefore?: number;
}

export interface ComplianceAnalysis {
  score: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  flags: string[];
  recommendations: string[];
  disclaimerRequired: boolean;
}

export interface BusinessInsight {
  id: string;
  type: "OPPORTUNITY" | "RISK" | "TREND";
  title: string;
  description: string;
  actionItem: string;
  impactScore: number;
}

export type CommissionStatus = "PENDING" | "PAID";

export interface Commission {
  id: string;
  leadId: string;
  amountUsd: number;
  status: CommissionStatus;
  milestone: ProjectStage | "SIGNED";
  expectedPayDate?: string;
}
