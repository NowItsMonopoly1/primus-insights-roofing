import type { VercelRequest, VercelResponse } from '@vercel/node';

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

    const bill = lead.estimatedBill || 200;
    const savings = analysis.estimatedMonthlySavings || 50;
    const systemSize = analysis.systemSizeKw || 6;
    const netCost = analysis.netCost || 15000;

    const strategy = `## Proposal Strategy for ${lead.name}

**Value Points:**
• Your current bill of $${bill}/month can be reduced significantly with solar
• Estimated monthly savings of $${savings} - that's $${savings * 12}/year back in your pocket
• ${systemSize}kW system perfectly sized for your home's energy needs

**Financial Summary:**
After the 30% federal tax credit, your net investment is $${netCost.toLocaleString()}. At current utility rates, you're looking at a payback period of approximately ${Math.round(netCost / (savings * 12))} years, with 20+ years of additional savings after that.

**Close Question:**
"${lead.name}, if we could lock in these savings and protect you from rising utility rates, would you like to move forward with the site survey this week?"`;

    return res.status(200).json({ strategy });
  } catch (error) {
    console.error('Proposal strategy error:', error);
    return res.status(500).json({ error: 'Failed to generate proposal strategy' });
  }
}
