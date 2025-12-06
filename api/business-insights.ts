import type { VercelRequest, VercelResponse } from '@vercel/node';

interface BusinessInsight {
  id: string;
  type: "OPPORTUNITY" | "RISK" | "TREND";
  title: string;
  description: string;
  actionItem: string;
  impactScore: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body || {};
    const leads = body.leads || [];
    const commissions = body.commissions || [];

    const totalPipeline = leads.length;
    const won = leads.filter((l: any) => l.status === 'CLOSED_WON').length;
    const revenue = commissions.reduce((sum: number, c: any) => sum + (c.amountUsd || 0), 0);

    // Generate static insights based on data
    const insights: BusinessInsight[] = [
      {
        id: "1",
        type: totalPipeline > 5 ? "OPPORTUNITY" : "RISK",
        title: totalPipeline > 5 ? "Strong Pipeline" : "Pipeline Needs Growth",
        description: `You have ${totalPipeline} leads in your pipeline with ${won} closed deals.`,
        actionItem: totalPipeline > 5 ? "Focus on converting warm leads" : "Increase lead generation efforts",
        impactScore: totalPipeline > 5 ? 8 : 6
      },
      {
        id: "2",
        type: "TREND",
        title: "Revenue Tracking",
        description: `Total commission revenue: $${revenue.toLocaleString()}`,
        actionItem: "Review commission milestones for pending projects",
        impactScore: 7
      },
      {
        id: "3",
        type: won > 0 ? "OPPORTUNITY" : "RISK",
        title: won > 0 ? "Conversion Success" : "Close Rate Focus",
        description: won > 0 ? `${won} deals closed - momentum building` : "No closed deals yet - focus on follow-ups",
        actionItem: won > 0 ? "Replicate winning approach" : "Review objection handling",
        impactScore: won > 0 ? 9 : 5
      }
    ];

    return res.status(200).json(insights);
  } catch (error) {
    console.error('Business insights error:', error);
    return res.status(200).json([]);
  }
}
