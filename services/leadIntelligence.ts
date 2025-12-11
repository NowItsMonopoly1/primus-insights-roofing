import { Lead } from '../types';

interface LeadAnalysis {
  score: number;
  tags: string[];
  priority: 'low' | 'medium' | 'high';
}

/**
 * AI Lead Scoring Engine
 * Deterministic rule-based scoring for solar leads
 */
export function scoreLead(lead: Partial<Lead>): LeadAnalysis {
  let score = 50; // Base score
  const tags: string[] = [];

  // === BILL ANALYSIS (Major Factor) ===
  const bill = lead.estimatedBill ?? 0;
  
  if (bill >= 400) {
    score += 30;
    tags.push('High Bill');
    tags.push('Premium Prospect');
  } else if (bill >= 250) {
    score += 20;
    tags.push('Strong Bill');
  } else if (bill >= 150) {
    score += 10;
    tags.push('Moderate Bill');
  } else if (bill > 0) {
    score += 5;
    tags.push('Low Bill');
  } else {
    score -= 10;
    tags.push('No Bill Data');
  }

  // === ADDRESS COMPLETENESS ===
  if (lead.address && lead.address.length > 10) {
    score += 10;
    tags.push('Complete Address');
  } else if (lead.address && lead.address.length > 0) {
    score += 5;
  } else {
    score -= 15;
    tags.push('Missing Address');
  }

  // === AGE ANALYSIS ===
  const age = lead.age;
  
  if (age) {
    if (age >= 65) {
      score += 5; // Seniors often own homes, stable income
      tags.push('Senior Homeowner');
    } else if (age >= 45 && age < 65) {
      score += 10; // Peak earning years, established homeowner
      tags.push('Prime Demographic');
    } else if (age >= 30 && age < 45) {
      score += 8;
      tags.push('Young Professional');
    } else if (age >= 18 && age < 30) {
      score -= 5; // Less likely to own home
      tags.push('Young Buyer');
    }
  }

  // === NAME COMPLETENESS ===
  if (lead.name && lead.name.includes(' ')) {
    score += 5; // Full name provided
  } else if (!lead.name || lead.name.length < 2) {
    score -= 10;
    tags.push('Incomplete Name');
  }

  // === NOTES ANALYSIS ===
  const notes = (lead.notes || '').toLowerCase();
  
  if (notes.includes('referral') || notes.includes('referred')) {
    score += 15;
    tags.push('Referral Lead');
  }
  
  if (notes.includes('interested') || notes.includes('ready')) {
    score += 10;
    tags.push('High Intent');
  }
  
  if (notes.includes('roof') && (notes.includes('new') || notes.includes('good'))) {
    score += 5;
    tags.push('Good Roof');
  }
  
  if (notes.includes('south') || notes.includes('southern')) {
    score += 5;
    tags.push('South Facing');
  }
  
  if (notes.includes('urgent') || notes.includes('asap')) {
    score += 8;
    tags.push('Urgent');
  }

  if (notes.includes('not interested') || notes.includes('do not call')) {
    score -= 30;
    tags.push('Do Not Contact');
  }

  // === CLAMP SCORE ===
  score = Math.max(0, Math.min(100, score));

  // === DETERMINE PRIORITY ===
  let priority: 'low' | 'medium' | 'high';
  
  if (score >= 75) {
    priority = 'high';
    if (!tags.includes('Premium Prospect') && !tags.includes('High Intent')) {
      tags.push('Hot Lead');
    }
  } else if (score >= 50) {
    priority = 'medium';
  } else {
    priority = 'low';
    if (!tags.includes('Do Not Contact')) {
      tags.push('Needs Nurturing');
    }
  }

  // Limit tags to top 4
  const finalTags = tags.slice(0, 4);

  return {
    score: Math.round(score),
    tags: finalTags,
    priority
  };
}

/**
 * Get score color based on value
 */
export function getScoreColor(score: number): string {
  if (score >= 75) return 'text-emerald-400';
  if (score >= 50) return 'text-yellow-400';
  return 'text-red-400';
}

/**
 * Get priority badge color
 */
export function getPriorityColor(priority: 'low' | 'medium' | 'high'): string {
  switch (priority) {
    case 'high': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'low': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  }
}
