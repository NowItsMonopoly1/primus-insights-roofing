import type { VercelRequest, VercelResponse } from '@vercel/node';

interface Lead {
  id: string;
  name: string;
  address: string;
  estimatedBill?: number;
  age?: number;
  notes?: string;
}

interface LeadRouting {
  score: number;
  quality: "HOT" | "WARM" | "COLD";
  recommendedAgentType: string;
  reasoning: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body || {};
    const lead: Lead = body.lead;

    if (!lead || !lead.id) {
      return res.status(400).json({ error: 'Invalid lead data' });
    }

    // Simple rule-based routing
    const bill = lead.estimatedBill ?? 150;
    const age = lead.age ?? 40;
    const notes = (lead.notes || '').toLowerCase();
    
    let score = 50;
    let quality: "HOT" | "WARM" | "COLD" = "WARM";
    let recommendedAgentType = "Standard Rep";
    let reasoning = "Standard lead profile";

    // Score based on bill
    if (bill > 300) { score = 85; quality = "HOT"; }
    else if (bill > 200) { score = 70; quality = "WARM"; }
    else if (bill < 100) { score = 30; quality = "COLD"; }
    else { score = 55; quality = "WARM"; }

    // Agent matching
    if (age > 65) {
      recommendedAgentType = "Senior Specialist";
      reasoning = "Senior customer - empathy focus";
    } else if (bill > 250) {
      recommendedAgentType = "Senior Closer";
      reasoning = "High-value lead";
    } else if (notes.includes('spanish') || notes.includes('bilingual')) {
      recommendedAgentType = "Bilingual Specialist";
      reasoning = "Language preference noted";
    }

    const routing: LeadRouting = { score, quality, recommendedAgentType, reasoning };
    return res.status(200).json(routing);
  } catch (error) {
    console.error('Route lead error:', error);
    return res.status(500).json({ error: 'Failed to route lead' });
  }
}
