
import { GoogleGenAI } from "@google/genai";
import { Lead, SolarAnalysis, ProjectStage, ComplianceAnalysis, LeadRouting, Commission, BusinessInsight, UserProfile } from "../types";
import { loadOrDefault } from "../utils/storage";

// Lazy initialization to prevent "process is not defined" crashes in browser
let aiClient: GoogleGenAI | null = null;
const USER_PROFILE_KEY = 'primus_user_profile';

function getAiClient() {
  if (!aiClient) {
    // 1. Try process.env (Build time)
    let key = process.env.API_KEY;
    
    // 2. Try LocalStorage (User provided)
    if (!key) {
        const profile = loadOrDefault<UserProfile>(USER_PROFILE_KEY, {} as any);
        if (profile && profile.apiKey) {
            key = profile.apiKey;
        }
    }

    if (key) {
        aiClient = new GoogleGenAI({ apiKey: key });
    }
  }
  return aiClient;
}

// Helper to simulate calling the AI models with optional tools
async function callGemini(
  prompt: string, 
  model: string = 'gemini-2.5-flash',
  tools: any[] = []
): Promise<{ text: string, urls: string[] }> {
  try {
    const ai = getAiClient();
    
    if (!ai) {
        throw new Error("Missing API Key. Please add it in Settings.");
    }

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        tools: tools.length > 0 ? tools : undefined
      }
    });

    const text = response.text || "";
    
    // Extract Grounding URLs (Maps or Search)
    const urls: string[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    chunks.forEach((chunk: any) => {
        if (chunk.web?.uri) {
            urls.push(chunk.web.uri);
        }
        if (chunk.maps?.uri) {
            urls.push(chunk.maps.uri);
        }
        // Google Maps grounding chunks might also contain placeAnswerSources
        if (chunk.maps?.placeAnswerSources?.reviewSnippets) {
             chunk.maps.placeAnswerSources.reviewSnippets.forEach((snippet: any) => {
                 if (snippet.reviewUrl) urls.push(snippet.reviewUrl);
             });
        }
    });

    return { text, urls: Array.from(new Set(urls)) }; // Dedup URLs
  } catch (error) {
    console.error("Gemini API Error:", error);
    return { text: "⚠️ AI Unavailable: Please check your API Key settings.", urls: [] };
  }
}

function computeFinancials(
  systemSizeKw: number,
  estimatedBill?: number
): Pick<
  SolarAnalysis,
  | "systemCost"
  | "taxCredit30"
  | "netCost"
  | "estimatedMonthlyPayment"
  | "estimatedMonthlySavings"
  | "estimatedUtilityBillBefore"
> {
  // Financial Assumptions
  const costPerWatt = 2.85; // Aggressive pricing per watt
  const systemCost = systemSizeKw * 1000 * costPerWatt;
  const taxCredit30 = systemCost * 0.3;
  const netCost = systemCost - taxCredit30;

  // Loan Calculation (20 year, 4.99%)
  const years = 20;
  const annualRate = 0.0499;
  const n = years * 12;
  const r = annualRate / 12;
  
  // Amortization formula
  const estimatedMonthlyPayment = (netCost * r) / (1 - Math.pow(1 + r, -n));

  // Savings Calculation
  const baselineBill = estimatedBill ?? 220;
  const offset = 0.85; // Assume 85% offset on average
  const estimatedMonthlySavings = Math.max(0, baselineBill - estimatedMonthlyPayment - (baselineBill * (1 - offset)));

  return {
    systemCost: Math.round(systemCost),
    taxCredit30: Math.round(taxCredit30),
    netCost: Math.round(netCost),
    estimatedMonthlyPayment: Math.round(estimatedMonthlyPayment),
    estimatedMonthlySavings: Math.round(estimatedMonthlySavings),
    estimatedUtilityBillBefore: baselineBill,
  };
}

export async function simulateSolarAnalysis(
  lead: Lead
): Promise<SolarAnalysis> {
  
  // Heuristic simulation based on lead data
  const bill = lead.estimatedBill ?? 220;
  // Estimate system size needed (Bill / ~35 gives approx kW needed in CA)
  const roughKwNeeded = bill / 35;
  // Clamp system size to realistic residential bounds (4kW - 12kW)
  const systemSizeKw = Math.max(4, Math.min(12, Math.round(roughKwNeeded * 10) / 10));
  
  const roofPitch = "Medium";
  const usableAreaSqft = Math.round(systemSizeKw * 65); // Approx 65 sqft per kW
  const sunHoursPerDay = 5.5;
  const viabilityScore = Math.min(98, Math.max(72, 80 + ((bill - 150) / 10))); // Higher bills = better solar candidates generally

  const financials = computeFinancials(systemSizeKw, bill);

  // Use Google Maps Grounding to get real roof context
  const prompt = `
    You are a Solar Intelligence engine analyzing a property for solar panel installation.
    Target Address: ${lead.address}.
    
    Using Google Maps data, analyze the roof metrics specifically for adding solar panels:
    1. **Roof Material**: Identify if it is Asphalt Shingle, Tile (Clay/Concrete), Metal, or Flat/Tar.
    2. **Roof Pitch & Geometry**: Is it flat, low slope, or steep? What is the primary orientation (South, West, etc)?
    3. **Obstructions**: Identify vents, chimneys, or skylights that would reduce usable array space.
    4. **Shading**: Analyze tree cover or nearby building shadows.
    
    Assess if a ${systemSizeKw} kW system would fit comfortably.
    If Google Maps data is unavailable, provide a general assessment based on the location's climate and typical housing stock.
  `;
  
  // Use gemini-2.5-flash with googleMaps tool
  const result = await callGemini(prompt, 'gemini-2.5-flash', [{ googleMaps: {} }]);

  return { 
    leadId: lead.id,
    roofPitch,
    usableAreaSqft,
    sunHoursPerDay,
    systemSizeKw,
    viabilityScore: Math.round(viabilityScore),
    summary: result.text.slice(0, 700),
    groundingUrls: result.urls,
    ...financials
  };
}

export async function generateProposalStrategy(
  lead: Lead,
  analysis: SolarAnalysis
): Promise<string> {
  const prompt = `
    You are a Solar Sales Closer coaching a rep.
    Create a concise proposal strategy in this structure:
    1) 2–3 bullet points of value anchored to THIS homeowner's numbers (Bill: $${lead.estimatedBill}, Savings: $${analysis.estimatedMonthlySavings}/mo).
    2) Payback & savings in plain language (no jargon).
    3) A simple close question that feels natural.
    
    Lead:
    ${JSON.stringify(lead, null, 2)}
    
    Solar Analysis:
    ${JSON.stringify(analysis, null, 2)}
  `;
  // Standard text generation, no special tools needed
  const result = await callGemini(prompt);
  return result.text;
}

export async function dealCopilotSuggestions(
  lead: Lead,
  stage: ProjectStage | "NEW"
): Promise<{ text: string, groundingUrls: string[] }> {
  const prompt = `
    You are "Deal Copilot" for a solar sales rep.
    Given the current project stage and lead context, list:
    - Top 3 likely objections at this stage.
    - For each, provide a 1–2 sentence rebuttal a rep can say word-for-word.
    
    Also, check for any recent (2024-2025) solar news or incentives in the lead's area that could help close the deal.
    
    Stage: ${stage}
    Lead: ${JSON.stringify(lead, null, 2)}
  `;
  
  // Use gemini-2.5-flash with googleSearch for up-to-date market info
  const result = await callGemini(prompt, 'gemini-2.5-flash', [{ googleSearch: {} }]);
  return { text: result.text, groundingUrls: result.urls };
}

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
    - Roof Insights: ${analysis.summary.slice(0, 100)}...
    
    Rules:
    1. Tone: Professional, helpful, NOT spammy.
    2. If SMS: Keep it under 160 chars.
    3. If Email: Subject line + Body. Focus on the specific roof data to prove we did our homework.
    4. Call to action: Schedule a site survey.
  `;

  const result = await callGemini(prompt);
  return result.text;
}

export async function analyzeCompliance(
  lead: Lead,
  analysis: SolarAnalysis
): Promise<ComplianceAnalysis> {
  const prompt = `
    You are a "Compliance Officer" for a solar company, auditing a potential deal for 2025 regulatory risks (FTC, State AG guidelines).
    Analyze the following deal parameters for consumer protection risks.
    
    Deal Context:
    - Customer Age: ${lead.age ?? 'Unknown (Assume <65)'}
    - Customer Notes: "${lead.notes}"
    - Customer Bill: $${lead.estimatedBill}
    - Proposed Savings: $${analysis.estimatedMonthlySavings}/mo
    - System Cost: $${analysis.systemCost}
    
    Rules for 2025 Compliance:
    1. ELDER PROTECTION: If Age > 65, apply strict scrutiny. Flag any aggression or complexity.
    2. FTC TRIGGERS: Flag "Free Solar", "No Cost", "Zero Bill", or "Government Program" in notes as HIGH RISK.
    3. SAVINGS: If savings > 40% of bill, check for "Actual results may vary" necessity.
    
    Return a strict JSON object (no markdown, just JSON) with this schema:
    {
      "score": number (0-100, 100 is safest),
      "riskLevel": "LOW" | "MEDIUM" | "HIGH",
      "flags": ["string", "string"], (e.g. "Elder Protection Alert: Customer is 78", "FTC Warning: 'Free Solar' claim detected"),
      "recommendations": ["string", "string"],
      "disclaimerRequired": boolean
    }
  `;

  try {
    const result = await callGemini(prompt);
    const jsonStr = result.text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr) as ComplianceAnalysis;
  } catch (e) {
    console.error("Compliance Analysis Error", e);
    return {
      score: 85,
      riskLevel: "LOW",
      flags: ["Manual review recommended due to AI timeout"],
      recommendations: ["Ensure customer receives standard consumer guide"],
      disclaimerRequired: true
    };
  }
}

export async function routeLead(lead: Lead): Promise<LeadRouting> {
  const prompt = `
    You are an AI Lead Router for a solar sales team.
    Analyze this incoming lead and assign it a quality score and the BEST agent type to handle it.
    
    Lead Data:
    - Name: ${lead.name}
    - Bill: $${lead.estimatedBill}/mo (Higher is better)
    - Age: ${lead.age ?? 'Unknown'}
    - Notes: "${lead.notes}"
    - Address: "${lead.address}"

    Routing Logic:
    1. QUALITY: High bill (> $250) + good location = HOT. Low bill (< $100) = COLD.
    2. AGENT MATCH:
       - Hispanic Name or Notes -> "Bilingual Specialist"
       - Age > 65 -> "Empathy / Senior Specialist"
       - Engineer/Technical notes -> "Technical Consultant"
       - High Bill -> "Senior Closer"
       - Default -> "Standard Rep"

    Return STRICT JSON:
    {
      "score": number (0-100),
      "quality": "HOT" | "WARM" | "COLD",
      "recommendedAgentType": string,
      "reasoning": string (max 10 words)
    }
  `;

  try {
    const result = await callGemini(prompt);
    const jsonStr = result.text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr) as LeadRouting;
  } catch (e) {
    console.error("Routing Error", e);
    return {
      score: 50,
      quality: "WARM",
      recommendedAgentType: "Standard Rep",
      reasoning: "AI Routing Offline"
    };
  }
}

export async function generateBusinessInsights(
  leads: Lead[],
  commissions: Commission[]
): Promise<BusinessInsight[]> {
  const totalPipeline = leads.length;
  const won = leads.filter(l => l.status === 'CLOSED_WON').length;
  const revenue = commissions.reduce((sum, c) => sum + c.amountUsd, 0);
  const hotLeads = leads.filter(l => l.routing?.quality === 'HOT').length;

  const prompt = `
    You are a "Chief Revenue Officer" AI for a solar company.
    Analyze this sales snapshot and generate 3 strategic business insights.
    
    Data:
    - Total Leads: ${totalPipeline}
    - Deals Won: ${won}
    - Hot Leads (AI Scored): ${hotLeads}
    - Total Commission Rev: $${revenue}
    
    Generate 3 insights in this STRICT JSON format:
    [
      {
        "id": "1",
        "type": "OPPORTUNITY" | "RISK" | "TREND",
        "title": "Short punchy title",
        "description": "1 sentence explanation",
        "actionItem": "Specific action to take",
        "impactScore": number (1-10)
      }
    ]
  `;

  try {
    const result = await callGemini(prompt);
    const jsonStr = result.text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr) as BusinessInsight[];
  } catch (e) {
    console.error("Insights Error", e);
    return [];
  }
}

// New Feature: Image Analysis using gemini-3-pro-preview
export async function analyzeSolarImage(
    imageBase64: string, 
    mimeType: string, 
    prompt: string
): Promise<string> {
    const ai = getAiClient();
    if (!ai) return "AI Unavailable. Please check API settings.";

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: {
                parts: [
                    { inlineData: { mimeType, data: imageBase64 } },
                    { text: `Analyze this image specifically for solar panel installation metrics. 
                             If it is a roof: Estimate the pitch (degrees), identify the roof material (Asphalt, Tile, etc.), and list any obstructions (vents, chimneys) that would block panel placement.
                             If it is a utility bill: Extract the kWh usage and total cost.
                             Original Prompt: ${prompt}` 
                    }
                ]
            }
        });
        return response.text || "No analysis generated.";
    } catch (e) {
        console.error("Image Analysis Error:", e);
        return "Failed to analyze image.";
    }
}
