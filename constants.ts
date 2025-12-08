
import type {
  Commission,
  Lead,
  Project,
  ProjectStage,
  SolarAnalysis,
  ChartDataPoint,
} from "./types";

export const PROJECT_STAGES: ProjectStage[] = [
  "SITE_SURVEY",
  "DESIGN",
  "PERMITTING",
  "INSTALL",
  "INSPECTION",
  "PTO",
];

export const STAGE_LABELS: Record<ProjectStage, string> = {
  SITE_SURVEY: "Site Survey",
  DESIGN: "Design",
  PERMITTING: "Permitting",
  INSTALL: "Install",
  INSPECTION: "Inspection",
  PTO: "PTO",
};

export const COMMISSION_SCHEDULE: Record<ProjectStage | "SIGNED", number> = {
  SIGNED: 200,
  SITE_SURVEY: 50,
  DESIGN: 0,
  PERMITTING: 100,
  INSTALL: 300,
  INSPECTION: 150,
  PTO: 200,
};

export const AVATAR_OPTIONS = [
  { id: 'avatar-1', gradient: 'bg-gradient-to-br from-blue-500 to-cyan-400', label: 'Cyan' },
  { id: 'avatar-2', gradient: 'bg-gradient-to-br from-emerald-500 to-green-400', label: 'Emerald' },
  { id: 'avatar-3', gradient: 'bg-gradient-to-br from-orange-500 to-amber-400', label: 'Solar' },
  { id: 'avatar-4', gradient: 'bg-gradient-to-br from-purple-600 to-pink-500', label: 'Neon' },
  { id: 'avatar-5', gradient: 'bg-gradient-to-br from-slate-700 to-slate-500', label: 'Stealth' },
  { id: 'avatar-6', gradient: 'bg-gradient-to-br from-red-600 to-orange-600', label: 'Magma' },
];

export const SUBSCRIPTION_PLANS = [
  {
    id: 'FREE',
    name: 'Scout',
    price: 0,
    priceYearly: 0,
    description: 'For new reps just getting started.',
    features: ['Basic Lead Board', 'Manual Entry', 'Standard Commission Log', 'Project Tracker'],
    highlight: false,
    color: 'text-slate-400',
    btnColor: 'bg-slate-800 text-slate-300 hover:bg-slate-700'
  },
  {
    id: 'PRO',
    name: 'Closer',
    price: 48,
    priceYearly: 468, // ~20% off
    description: 'For active reps who need to close NOW.',
    features: ['AI Proposal Engine', 'Solar Intelligence (Roof Analysis)', 'Deal Copilot & Objection Scripts', 'Digital Contracts & E-Sign', 'Mobile Field Mode'],
    highlight: true,
    color: 'text-solar-orange',
    btnColor: 'bg-solar-orange text-white hover:bg-orange-600 shadow-lg shadow-orange-500/20'
  },
  {
    id: 'TEAM',
    name: 'Empire',
    price: 198,
    priceYearly: 1908,
    description: 'For team leaders managing 2-10 reps.',
    features: ['Everything in Closer', 'AI Lead Routing (Hot/Warm/Cold)', 'Team Dashboards & Analytics', 'Role-Based Permissions', 'JobNimbus Integration (Beta)'],
    highlight: false,
    color: 'text-emerald-400',
    btnColor: 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-500/20'
  },
  {
    id: 'DEALER',
    name: 'Titan',
    price: 498,
    priceYearly: 4788,
    description: 'Complete OS for Dealers & Installers.',
    features: ['Everything in Empire', 'Unlimited Rep Seats', 'Multi-Market Routing', 'Compliance Shield (Ethics Audit)', 'White Label Options', 'API Access'],
    highlight: false,
    color: 'text-purple-400',
    btnColor: 'bg-purple-600 text-white hover:bg-purple-500 shadow-lg shadow-purple-500/20'
  }
];

export const SEED_LEADS: Lead[] = [
  {
    id: "L-001",
    name: "Maria Lopez",
    address: "123 Sunridge Dr, Antioch, CA",
    email: "maria@example.com",
    phone: "555-123-4567",
    status: "QUALIFIED",
    estimatedBill: 240,
    age: 42,
    createdAt: "2025-12-01",
    notes: "South-facing roof, minimal shading. Spanish speaking preferred.",
  },
  {
    id: "L-002",
    name: "James Carter",
    address: "88 Hillcrest Ave, Pittsburg, CA",
    status: "NEW",
    estimatedBill: 310,
    age: 35,
    createdAt: "2025-12-03",
    notes: "Referred by neighbor. Concerned about roof age.",
  },
  {
    id: "L-003",
    name: "Lisa Huang",
    address: "44 Goldenridge Ct, Concord, CA",
    status: "PROPOSAL_SENT",
    estimatedBill: 190,
    age: 55,
    createdAt: "2025-11-28",
  },
  {
    id: "L-004",
    name: "Sarah Miller",
    address: "992 Pine Way, Oakley, CA",
    status: "CLOSED_WON",
    estimatedBill: 180,
    age: 29,
    createdAt: "2025-11-15"
  },
  {
    id: "L-005",
    name: "Gertrude Higgins",
    address: "55 Retirement Ln, Walnut Creek, CA",
    status: "NEW",
    estimatedBill: 160,
    age: 78,
    createdAt: "2025-12-05",
    notes: "Fixed income. Told her it would be free solar and zero electric bill forever. Very interested."
  }
];

export const SEED_PROJECTS: Project[] = [
  {
    id: "P-001",
    leadId: "L-004", // Linked to Sarah Miller (Closed Won)
    stage: "PERMITTING",
    kW: 6.2,
    createdAt: "2025-11-20",
    lastUpdated: "2025-12-04",
  },
];

export const SEED_COMMISSIONS: Commission[] = [
  {
    id: "C-001",
    leadId: "L-004",
    amountUsd: 1850,
    status: "PENDING",
    milestone: "PERMITTING",
    expectedPayDate: "2025-12-28"
  },
  {
    id: "C-002",
    leadId: "L-005", // Example previous deal
    amountUsd: 2100,
    status: "PAID",
    milestone: "SIGNED",
    expectedPayDate: "2025-11-20"
  }
];

export const SEED_ANALYSES: SolarAnalysis[] = [
  {
    leadId: "L-001",
    roofPitch: "Medium",
    usableAreaSqft: 420,
    sunHoursPerDay: 5.8,
    systemSizeKw: 6.2,
    viabilityScore: 92,
    summary: "Excellent south-facing roof with minimal shading. Ideal for a 6–7 kW system.",
    groundingUrls: [
        "https://maps.google.com/?q=123+Sunridge+Dr+Antioch+CA",
        "https://www.google.com/maps/contrib/12345"
    ],
    systemCost: 6.2 * 3500, // $3.50/watt
    taxCredit30: 6.2 * 3500 * 0.3,
    netCost: 6.2 * 3500 * 0.7,
    estimatedMonthlyPayment: 135,
    estimatedMonthlySavings: 105,
    estimatedUtilityBillBefore: 240,
  },
];

export const MOCK_CHART_DATA: ChartDataPoint[] = [
  { name: 'Jan', commissions: 4500, kwSold: 24, leads: 14 },
  { name: 'Feb', commissions: 5200, kwSold: 28, leads: 18 },
  { name: 'Mar', commissions: 4800, kwSold: 22, leads: 25 },
  { name: 'Apr', commissions: 6100, kwSold: 35, leads: 32 },
  { name: 'May', commissions: 5500, kwSold: 30, leads: 28 },
  { name: 'Jun', commissions: 8200, kwSold: 45, leads: 40 },
  { name: 'Jul', commissions: 9500, kwSold: 52, leads: 48 },
];

// Aliases for compatibility
export const MOCK_LEADS = SEED_LEADS;
export const MOCK_PROJECTS = SEED_PROJECTS;
export const MOCK_COMMISSIONS = SEED_COMMISSIONS;
export const MOCK_SOLAR_ANALYSIS = SEED_ANALYSES;

export function createProjectForLead(lead: Lead, analysis: SolarAnalysis): Project {
  const idSuffix = Math.floor(Math.random() * 999)
    .toString()
    .padStart(3, "0");
  const today = new Date().toISOString().slice(0, 10);
  return {
    id: `P-${idSuffix}`,
    leadId: lead.id,
    stage: "SITE_SURVEY",
    kW: analysis.systemSizeKw,
    createdAt: today,
    lastUpdated: today,
  };
}

export function generateMilestoneCommissions(project: Project): Commission[] {
  const today = new Date();
  const baseDate = new Date(today.getTime());
  const scheduleOrder: (ProjectStage | "SIGNED")[] = [
    "SIGNED",
    "SITE_SURVEY",
    "PERMITTING",
    "INSTALL",
    "INSPECTION",
    "PTO",
  ];

  return scheduleOrder.map((milestone, index) => {
    const d = new Date(baseDate.getTime());
    d.setDate(d.getDate() + index * 3);
    return {
      id: `${project.id}-${milestone}`,
      leadId: project.leadId,
      amountUsd: COMMISSION_SCHEDULE[milestone],
      status: "PENDING",
      milestone,
      expectedPayDate: d.toISOString().slice(0, 10),
    };
  });
}
