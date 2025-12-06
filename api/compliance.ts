import type { VercelRequest, VercelResponse } from '@vercel/node';

interface ComplianceAnalysis {
  score: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  flags: string[];
  recommendations: string[];
  disclaimerRequired: boolean;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body || {};
    const lead = body.lead;
    const analysis = body.analysis;

    if (!lead || !analysis) {
      return res.status(400).json({ error: 'Invalid request: lead and analysis required' });
    }

    const flags: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Elder protection check
    const age = lead.age || 0;
    if (age >= 65) {
      flags.push(`Elder Protection Alert: Customer is ${age} years old`);
      recommendations.push('Ensure family member or advocate is present for signing');
      recommendations.push('Provide 72-hour cooling-off period reminder');
      score -= 15;
    }

    // FTC trigger words in notes
    const notes = (lead.notes || '').toLowerCase();
    const ftcTriggers = ['free solar', 'no cost', 'zero bill', 'government program', 'free installation'];
    for (const trigger of ftcTriggers) {
      if (notes.includes(trigger)) {
        flags.push(`FTC Warning: "${trigger}" claim detected in notes`);
        score -= 20;
      }
    }

    // Savings ratio check
    const bill = lead.estimatedBill || 200;
    const savings = analysis.estimatedMonthlySavings || 0;
    if (savings > bill * 0.4) {
      flags.push('High savings claim: Over 40% of current bill');
      recommendations.push('Add "Actual results may vary" disclaimer');
      score -= 10;
    }

    // Determine risk level
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    if (score >= 80) {
      riskLevel = 'LOW';
    } else if (score >= 60) {
      riskLevel = 'MEDIUM';
    } else {
      riskLevel = 'HIGH';
    }

    // Always recommend standard compliance
    if (recommendations.length === 0) {
      recommendations.push('Ensure customer receives standard consumer guide');
    }

    const result: ComplianceAnalysis = {
      score: Math.max(0, score),
      riskLevel,
      flags: flags.length > 0 ? flags : ['No compliance issues detected'],
      recommendations,
      disclaimerRequired: flags.length > 0
    };

    return res.status(200).json(result);
  } catch (error) {
    console.error('Compliance analysis error:', error);
    return res.status(500).json({ error: 'Failed to analyze compliance' });
  }
}
