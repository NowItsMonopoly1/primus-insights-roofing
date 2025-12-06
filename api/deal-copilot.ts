import type { VercelRequest, VercelResponse } from '@vercel/node';

type ProjectStage = 'SITE_SURVEY' | 'DESIGN' | 'PERMITTING' | 'INSTALL' | 'INSPECTION' | 'PTO';

interface ObjectionRebuttal {
  objection: string;
  rebuttal: string;
}

const stageObjections: Record<string | ProjectStage, ObjectionRebuttal[]> = {
  NEW: [
    { objection: "I need to think about it", rebuttal: "I completely understand. Most of my customers felt the same way. What specific concerns can I address right now to help you make an informed decision?" },
    { objection: "Solar is too expensive", rebuttal: "That's a common concern. The truth is, with the 30% federal tax credit and $0 down financing, most homeowners pay less for solar than their current electric bill from day one." },
    { objection: "I'm not sure if my roof is suitable", rebuttal: "Great question! That's exactly what our free site survey determines. We use satellite imaging and on-site inspection to ensure your roof is perfect for solar." }
  ],
  SITE_SURVEY: [
    { objection: "The system seems too large/small", rebuttal: "Our engineers designed this system specifically for your energy usage. We can adjust the size, but this configuration gives you the best return on investment." },
    { objection: "I don't like how panels look", rebuttal: "I hear you. We offer sleek all-black panels that blend seamlessly with your roof. Many neighbors won't even notice them." },
    { objection: "What about tree shading?", rebuttal: "We've accounted for shading in our design. Our microinverters optimize each panel individually, so partial shade has minimal impact on your production." }
  ],
  DESIGN: [
    { objection: "The design doesn't maximize my roof", rebuttal: "We strategically placed panels for optimal sun exposure and avoided areas that could cause maintenance issues. Quality placement beats quantity every time." },
    { objection: "Can I add more panels later?", rebuttal: "Absolutely! Our system is designed for future expansion. When you're ready, we can add panels to meet increased energy needs." },
    { objection: "What if I sell my house?", rebuttal: "Solar increases home value by an average of 4.1%. Homes with solar sell faster and for more money than comparable homes without it." }
  ],
  PERMITTING: [
    { objection: "Why is permitting taking so long?", rebuttal: "Permitting timelines are set by your local jurisdiction, not us. We're actively monitoring your permit and will install within 48 hours of approval." },
    { objection: "Are there HOA concerns?", rebuttal: "Solar access is protected by state law in most areas. HOAs cannot unreasonably deny solar installations. We'll handle any HOA communication needed." },
    { objection: "What if the permit is denied?", rebuttal: "Permit denials are extremely rare and usually due to minor adjustments. If any changes are needed, we handle them at no additional cost to you." }
  ],
  INSTALL: [
    { objection: "How long will installation take?", rebuttal: "Most residential installations are completed in 1-2 days. Our crews are certified professionals who work efficiently and clean up completely." },
    { objection: "Will this damage my roof?", rebuttal: "Our installation includes a comprehensive roof warranty. We use industry-leading mounting systems that actually protect penetration points better than the original roof." },
    { objection: "It's too disruptive to my schedule", rebuttal: "You don't need to be home during installation. We'll coordinate the best date for you and handle everything. Most homeowners barely notice we were there." }
  ],
  INSPECTION: [
    { objection: "What if inspection fails?", rebuttal: "Our systems pass inspection 99% of the time on the first try. In the rare case of any issues, we fix them immediately at no cost to you." },
    { objection: "How long until I can turn it on?", rebuttal: "Once inspection passes, we submit for utility permission to operate. This typically takes 2-4 weeks depending on your utility company." },
    { objection: "Do I need to be present for inspection?", rebuttal: "No, you don't need to be there. Our team meets the inspector and handles everything. We'll update you immediately after." }
  ],
  PTO: [
    { objection: "My first bill seems wrong", rebuttal: "It takes 1-2 billing cycles for your utility to properly credit your solar production. I'll help you understand exactly what to expect on your bill." },
    { objection: "The system isn't producing what you promised", rebuttal: "Production varies by season - summer months produce more. Let's review your monitoring app together to ensure everything is working optimally." },
    { objection: "How do I monitor my system?", rebuttal: "Great question! Let me walk you through the monitoring app. You can see real-time production, historical data, and even get alerts if anything needs attention." }
  ]
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body || {};
    const lead = body.lead;
    const stage = body.stage || 'NEW';

    if (!lead) {
      return res.status(400).json({ error: 'Invalid request: lead required' });
    }

    const objections = stageObjections[stage] || stageObjections['NEW'];
    
    const suggestions = `## Deal Copilot - ${stage} Stage

**Top Objections & Rebuttals for ${lead.name || 'this lead'}:**

${objections.map((o, i) => `### ${i + 1}. "${o.objection}"
**Say this:** "${o.rebuttal}"
`).join('\n')}

**Pro Tip:** Listen actively, acknowledge their concern, and then guide them to the solution. Never argue - always agree and redirect.`;

    return res.status(200).json({ suggestions });
  } catch (error) {
    console.error('Deal copilot error:', error);
    return res.status(500).json({ error: 'Failed to generate suggestions' });
  }
}
