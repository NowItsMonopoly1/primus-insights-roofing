import { Lead, SolarAnalysis, ProjectStage, ComplianceAnalysis, LeadRouting, Commission, BusinessInsight } from "../types";

// Helper: POST wrapper
async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Backend error: ${res.status}`);
  return res.json();
}

// --- SOLAR ANALYSIS ---
export async function simulateSolarAnalysis(lead: Lead): Promise<SolarAnalysis> {
  return await postJSON<SolarAnalysis>("/api/solar-analysis", { lead });
}

// --- PROPOSAL STRATEGY ---
export async function generateProposalStrategy(lead: Lead, analysis: SolarAnalysis): Promise<string> {
  const data = await postJSON<{ strategy: string }>("/api/proposal-strategy", { lead, analysis });
  return data.strategy;
}

// --- DEAL COPILOT ---
export async function dealCopilotSuggestions(lead: Lead, stage: ProjectStage | "NEW"): Promise<string> {
  const data = await postJSON<{ suggestions: string }>("/api/deal-copilot", { lead, stage });
  return data.suggestions;
}

// --- COMPLIANCE ---
export async function analyzeCompliance(lead: Lead, analysis: SolarAnalysis): Promise<ComplianceAnalysis> {
  return await postJSON<ComplianceAnalysis>("/api/compliance", { lead, analysis });
}

// --- LEAD ROUTING ---
export async function routeLead(lead: Lead): Promise<LeadRouting> {
  return await postJSON<LeadRouting>("/api/route-lead", { lead });
}

// --- BUSINESS INSIGHTS ---
export async function generateBusinessInsights(leads: Lead[], commissions: Commission[]): Promise<BusinessInsight[]> {
  return await postJSON<BusinessInsight[]>("/api/business-insights", { leads, commissions });
}
