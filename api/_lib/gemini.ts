import { GoogleGenerativeAI } from "@google/generative-ai";

// Server-side Gemini client - API key stays secure
let aiClient: GoogleGenerativeAI | null = null;

export function getAiClient(): GoogleGenerativeAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set");
    }
    aiClient = new GoogleGenerativeAI(apiKey);
  }
  return aiClient;
}

export async function callGemini(prompt: string): Promise<string> {
  try {
    const ai = getAiClient();
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text() || "";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("AI Service Unavailable");
  }
}

// Financial computation helper (mirrored from frontend for backend use)
export function computeFinancials(
  systemSizeKw: number,
  estimatedBill?: number
): {
  systemCost: number;
  taxCredit30: number;
  netCost: number;
  estimatedMonthlyPayment: number;
  estimatedMonthlySavings: number;
  estimatedUtilityBillBefore: number;
} {
  const costPerWatt = 2.85;
  const systemCost = systemSizeKw * 1000 * costPerWatt;
  const taxCredit30 = systemCost * 0.3;
  const netCost = systemCost - taxCredit30;

  const years = 20;
  const annualRate = 0.0499;
  const n = years * 12;
  const r = annualRate / 12;
  
  const estimatedMonthlyPayment = (netCost * r) / (1 - Math.pow(1 + r, -n));

  const baselineBill = estimatedBill ?? 220;
  const offset = 0.85;
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
