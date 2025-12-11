
export type LeadStatus =
  | "NEW"
  | "QUALIFIED"
  | "PROPOSAL_SENT"
  | "CLOSED_WON"
  | "CLOSED_LOST";

export interface LeadRouting {
  score: number; // 0-100
  quality: "HOT" | "WARM" | "COLD";
  recommendedAgentType: string; // e.g. "Senior Closer", "Bilingual Expert", "Tech Specialist"
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
  routing?: LeadRouting; // New field for AI Router data
  // AI Lead Intelligence fields
  aiScore?: number;
  aiTags?: string[];
  priority?: 'low' | 'medium' | 'high';
  // Assigned Rep
  assignedTo?: string | null;
}

export type ProjectStage =
  | "SITE_SURVEY"
  | "DESIGN"
  | "PERMITTING"
  | "INSTALL"
  | "INSPECTION"
  | "PTO";

export interface Project {
  id: string;
  leadId: string;
  stage: ProjectStage;
  kW: number;
  createdAt: string;
  lastUpdated: string;
  // SLA Tracking fields
  targetDates?: { [stage: string]: string };
  actualDates?: { [stage: string]: string };
  slaStatus?: 'onTrack' | 'atRisk' | 'late';
}

export interface SolarAnalysis {
  leadId: string;
  roofPitch: string;
  usableAreaSqft: number;
  sunHoursPerDay: number;
  systemSizeKw: number;
  viabilityScore: number; // 0–100
  summary: string;
  groundingUrls?: string[]; // URLs from Google Maps/Search grounding

  // Financials
  systemCost: number;
  taxCredit30: number;
  netCost: number;
  estimatedMonthlyPayment: number;
  estimatedMonthlySavings: number;
  estimatedUtilityBillBefore?: number;
}

export interface ComplianceAnalysis {
  score: number; // 0-100 (100 is perfectly compliant)
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
  impactScore: number; // 1-10
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

export type PlanId = "FREE" | "PRO" | "TEAM" | "DEALER";

export interface UserProfile {
  id: string;
  name: string;
  role: "REP" | "CLOSER" | "OWNER";
  market: string;
  avatarId?: string;
  plan: PlanId;
  apiKey?: string; // New field for user-provided API key
}

// Charting Types
export interface ChartDataPoint {
  name: string;
  commissions: number;
  kwSold: number;
  leads: number;
}