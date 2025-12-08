import { GoogleGenAI } from "@google/genai";
import { Lead, SolarAnalysis, ProjectStage, ComplianceAnalysis, LeadRouting, Commission, BusinessInsight, UserProfile } from "../types";
import { loadOrDefault } from "../utils/storage";

// ============================================================================
// HYBRID MODE: Backend API for main functions, Client-Side for image analysis
// ============================================================================

const USER_PROFILE_KEY = 'primus_user_profile';

// Lazy initialization for client-side only functions (image analysis, outreach)
let aiClient: GoogleGenAI | null = null;

function getAiClient() {
  if (!aiClient) {
    const profile = loadOrDefault<UserProfile>(USER_PROFILE_KEY, {} as any);
    if (profile && profile.apiKey) {
      aiClient = new GoogleGenAI({ apiKey: profile.apiKey });
    }
  }
  return aiClient;
}

// Helper for client-side Gemini calls (only used for features not in backend)
async function callGeminiClientSide(
  prompt: string, 
  model: string = 'gemini-2.5-flash'
): Promise<{ text: string, urls: string[] }> {
  try {
    const ai = getAiClient();
    if (!ai) {
      throw new Error("Missing API Key. Please add it in Settings.");
    }

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return { text: response.text || "", urls: [] };
  } catch (error) {
    console.error("Gemini Client-Side Error:", error);
    return { text: "⚠️ AI Unavailable: Please check your API Key settings.", urls: [] };
  }
}

// ============================================================================
// BACKEND API CALLS - Secure server-side AI processing
// ============================================================================

const API_BASE = '/api';

async function callBackendAPI<T>(endpoint: string, body: object): Promise<T> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Backend API Error (${endpoint}):`, error);
    throw error;
  }
}

// ============================================================================
// EXPORTED FUNCTIONS - Now calling Backend API Routes
// ============================================================================

/**
 * Solar Analysis - POST /api/solar-analysis
 * Analyzes roof and generates financial projections
 */
export async function simulateSolarAnalysis(lead: Lead): Promise<SolarAnalysis> {
  try {
    const result = await callBackendAPI<SolarAnalysis>('/solar-analysis', { lead });
    return result;
  } catch (e) {
    console.error("Solar Analysis Error:", e);
    // Fallback with basic calculations
    const bill = lead.estimatedBill ?? 220;
    const systemSizeKw = Math.max(4, Math.min(12, Math.round((bill / 35) * 10) / 10));
    return {
      leadId: lead.id,
      roofPitch: "Medium",
      usableAreaSqft: Math.round(systemSizeKw * 65),
      sunHoursPerDay: 5.5,
      systemSizeKw,
      viabilityScore: 75,
      summary: "⚠️ Analysis temporarily unavailable. Basic estimate shown.",
      groundingUrls: [],
      systemCost: Math.round(systemSizeKw * 1000 * 2.85),
      taxCredit30: Math.round(systemSizeKw * 1000 * 2.85 * 0.3),
      netCost: Math.round(systemSizeKw * 1000 * 2.85 * 0.7),
      estimatedMonthlyPayment: Math.round((systemSizeKw * 1000 * 2.85 * 0.7) / 240),
      estimatedMonthlySavings: Math.round(bill * 0.3),
      estimatedUtilityBillBefore: bill,
    };
  }
}

/**
 * Proposal Strategy - POST /api/proposal-strategy
 * Generates sales proposal talking points
 */
export async function generateProposalStrategy(
  lead: Lead,
  analysis: SolarAnalysis
): Promise<string> {
  try {
    const result = await callBackendAPI<{ strategy: string }>('/proposal-strategy', { lead, analysis });
    return result.strategy;
  } catch (e) {
    console.error("Proposal Strategy Error:", e);
    return `**Value Points:**
• Monthly savings of ~$${analysis.estimatedMonthlySavings} with a ${analysis.systemSizeKw}kW system
• 30% Federal Tax Credit = $${analysis.taxCredit30} back
• Lock in energy costs before utility rate increases

**Close:** "Based on your roof, we can get you saving money in 6-8 weeks. Want me to reserve your installation slot?"`;
  }
}

/**
 * Deal Copilot - POST /api/deal-copilot
 * Provides objection handling and deal coaching
 */
export async function dealCopilotSuggestions(
  lead: Lead,
  stage: ProjectStage | "NEW"
): Promise<{ text: string, groundingUrls: string[] }> {
  try {
    const result = await callBackendAPI<{ text: string, groundingUrls: string[] }>('/deal-copilot', { lead, stage });
    return result;
  } catch (e) {
    console.error("Deal Copilot Error:", e);
    return {
      text: `**Common Objections at ${stage}:**

1. **"I need to think about it"**
   → "Totally understand. What specific part would you like to sleep on - the savings or the installation process?"

2. **"The price seems high"**
   → "I hear you. But with $${lead.estimatedBill}/mo in bills, you're paying the utility anyway. This way you own the asset."

3. **"What about when I sell the house?"**
   → "Solar adds $15-20k to home value on average. It's an investment that transfers."`,
      groundingUrls: []
    };
  }
}

/**
 * Compliance Analysis - POST /api/compliance
 * Checks deal for regulatory compliance
 */
export async function analyzeCompliance(
  lead: Lead,
  analysis: SolarAnalysis
): Promise<ComplianceAnalysis> {
  try {
    const result = await callBackendAPI<ComplianceAnalysis>('/compliance', { lead, analysis });
    return result;
  } catch (e) {
    console.error("Compliance Analysis Error:", e);
    return {
      score: 85,
      riskLevel: "LOW",
      flags: ["Manual review recommended - AI temporarily unavailable"],
      recommendations: ["Ensure customer receives standard consumer guide"],
      disclaimerRequired: true
    };
  }
}

/**
 * Route Lead - POST /api/route-lead
 * Scores and routes incoming leads
 */
export async function routeLead(lead: Lead): Promise<LeadRouting> {
  try {
    const result = await callBackendAPI<LeadRouting>('/route-lead', { lead });
    return result;
  } catch (e) {
    console.error("Lead Routing Error:", e);
    // Fallback routing logic
    const bill = lead.estimatedBill ?? 150;
    let quality: "HOT" | "WARM" | "COLD" = "WARM";
    let score = 50;
    
    if (bill >= 250) { quality = "HOT"; score = 85; }
    else if (bill < 100) { quality = "COLD"; score = 30; }
    
    return {
      score,
      quality,
      recommendedAgentType: "Standard Rep",
      reasoning: "Fallback routing - API unavailable"
    };
  }
}

/**
 * Business Insights - POST /api/business-insights
 * Generates strategic insights from pipeline data
 */
export async function generateBusinessInsights(
  leads: Lead[],
  commissions: Commission[]
): Promise<BusinessInsight[]> {
  try {
    const result = await callBackendAPI<BusinessInsight[]>('/business-insights', { leads, commissions });
    return result;
  } catch (e) {
    console.error("Business Insights Error:", e);
    // Return basic fallback insights
    const won = leads.filter(l => l.status === 'CLOSED_WON').length;
    const hot = leads.filter(l => l.routing?.quality === 'HOT').length;
    
    return [
      {
        id: "1",
        type: "OPPORTUNITY",
        title: `${hot} Hot Leads Ready`,
        description: `You have ${hot} high-scoring leads that should be prioritized.`,
        actionItem: "Call hot leads within 24 hours",
        impactScore: 8
      },
      {
        id: "2", 
        type: "TREND",
        title: `${won}/${leads.length} Close Rate`,
        description: `Current conversion rate from your pipeline.`,
        actionItem: "Review lost deals for patterns",
        impactScore: 6
      }
    ];
  }
}

// ============================================================================
// CLIENT-SIDE ONLY FUNCTIONS (Not in backend yet)
// ============================================================================

/**
 * Outreach Message Generation - CLIENT-SIDE
 * Generates personalized email/SMS (requires user API key)
 */
export async function generateOutreachMessage(
  lead: Lead,
  analysis: SolarAnalysis,
  type: "EMAIL" | "SMS"
): Promise<string> {
  const prompt = `
    You are an expert Solar Sales Copywriter.
    Draft a personalized ${type} to the homeowner.
    
    Context:
    - Customer Name: ${lead.name}
    - Address: ${lead.address}
    - Status: ${lead.status}
    - Key Data: $${analysis.estimatedMonthlySavings}/mo savings, ${analysis.systemSizeKw}kW system.
    
    Rules:
    1. Tone: Professional, helpful, NOT spammy.
    2. If SMS: Keep it under 160 chars.
    3. If Email: Subject line + Body. Focus on specific savings.
    4. Call to action: Schedule a site survey.
  `;

  const result = await callGeminiClientSide(prompt);
  return result.text;
}

/**
 * Solar Image Analysis - CLIENT-SIDE
 * Analyzes roof/bill images (requires user API key)
 */
export async function analyzeSolarImage(
  imageBase64: string, 
  mimeType: string, 
  prompt: string
): Promise<string> {
  const ai = getAiClient();
  if (!ai) return "⚠️ AI Unavailable. Please add your API Key in Settings to use image analysis.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: {
        parts: [
          { inlineData: { mimeType, data: imageBase64 } },
          { text: `Analyze this image for solar installation assessment. 
                   If roof: Estimate pitch, identify material, list obstructions.
                   If utility bill: Extract kWh usage and cost.
                   Context: ${prompt}` 
          }
        ]
      }
    });
    return response.text || "No analysis generated.";
  } catch (e) {
    console.error("Image Analysis Error:", e);
    return "Failed to analyze image. Please check your API key.";
  }
}
