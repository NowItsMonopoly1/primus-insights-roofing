import type { VercelRequest, VercelResponse } from '@vercel/node';

interface Lead {
  id: string;
  name: string;
  address: string;
  status: string;
  estimatedBill?: number;
}

interface SolarAnalysis {
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
  estimatedUtilityBillBefore: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body || {};
    const lead: Lead = body.lead;

    if (!lead || !lead.id) {
      return res.status(400).json({ error: 'Invalid lead data', received: body });
    }

    const bill = lead.estimatedBill ?? 220;
    const systemSizeKw = Math.max(4, Math.min(12, Math.round((bill / 35) * 10) / 10));
    
    // Financial calculations
    const costPerWatt = 2.85;
    const systemCost = Math.round(systemSizeKw * 1000 * costPerWatt);
    const taxCredit30 = Math.round(systemCost * 0.3);
    const netCost = systemCost - taxCredit30;
    const r = 0.0499 / 12;
    const n = 240;
    const estimatedMonthlyPayment = Math.round((netCost * r) / (1 - Math.pow(1 + r, -n)));
    const estimatedMonthlySavings = Math.round(Math.max(0, bill - estimatedMonthlyPayment - (bill * 0.15)));

    const analysis: SolarAnalysis = {
      leadId: lead.id,
      roofPitch: "Medium",
      usableAreaSqft: Math.round(systemSizeKw * 65),
      sunHoursPerDay: 5.5,
      systemSizeKw,
      viabilityScore: Math.round(Math.min(98, Math.max(72, 80 + ((bill - 150) / 10)))),
      summary: `Based on a $${bill}/month utility bill, we recommend a ${systemSizeKw}kW system. This home shows excellent solar potential with good roof orientation.`,
      systemCost,
      taxCredit30,
      netCost,
      estimatedMonthlyPayment,
      estimatedMonthlySavings,
      estimatedUtilityBillBefore: bill,
    };

    return res.status(200).json(analysis);
  } catch (error) {
    return res.status(500).json({ error: 'Failed', details: String(error) });
  }
}
