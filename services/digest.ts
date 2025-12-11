// services/digest.ts
// Morning Digest System - Daily summary of important metrics and alerts

import { getActiveCompanyId, loadCompanyState } from './companyStore';
import { loadOrDefault } from '../utils/storage';
import { Lead, Project, Commission } from '../types';
import { notify, setLastDigestTime, isDigestNeeded, getLastDigestTime } from './notifications';
import { loadSLA, calculateSLAStatus } from './slaRules';

const LEADS_KEY = 'primus_leads';
const PROJECTS_KEY = 'primus_projects';
const COMMISSIONS_KEY = 'primus_commissions';

export interface DigestSection {
  title: string;
  items: string[];
  severity: 'info' | 'warning' | 'critical';
  count: number;
}

export interface DailyDigest {
  companyId: string;
  generatedAt: number;
  sections: DigestSection[];
  summary: string;
  stats: {
    newLeads: number;
    staleLeads: number;
    atRiskProjects: number;
    lateProjects: number;
    pendingCommissions: number;
    approvedCommissions: number;
  };
}

// Get days since a date string (YYYY-MM-DD)
function daysSince(dateStr: string): number {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// Generate the daily digest
export function generateDailyDigest(companyId?: string): DailyDigest {
  const activeCompany = companyId || getActiveCompanyId();
  const companyState = loadCompanyState();
  const company = companyState.companies.find(c => c.id === activeCompany);
  
  // Load data
  const allLeads = loadOrDefault<Lead[]>(LEADS_KEY, []);
  const allProjects = loadOrDefault<Project[]>(PROJECTS_KEY, []);
  const allCommissions = loadOrDefault<Commission[]>(COMMISSIONS_KEY, []);
  
  // Filter to company
  const leads = allLeads.filter(l => !l.companyId || l.companyId === activeCompany);
  const projects = allProjects.filter(p => !p.companyId || p.companyId === activeCompany);
  const commissions = allCommissions.filter(c => !c.companyId || c.companyId === activeCompany);

  const sections: DigestSection[] = [];
  const stats = {
    newLeads: 0,
    staleLeads: 0,
    atRiskProjects: 0,
    lateProjects: 0,
    pendingCommissions: 0,
    approvedCommissions: 0,
  };

  // ========================================
  // 1. NEW LEADS (Last 24 hours)
  // ========================================
  const yesterday = Date.now() - (24 * 60 * 60 * 1000);
  const newLeads = leads.filter(l => {
    const createdDate = new Date(l.createdAt).getTime();
    return createdDate >= yesterday;
  });
  
  stats.newLeads = newLeads.length;
  
  if (newLeads.length > 0) {
    const highPriority = newLeads.filter(l => l.priority === 'high');
    sections.push({
      title: '🆕 New Leads',
      items: [
        `${newLeads.length} new lead${newLeads.length > 1 ? 's' : ''} in the last 24 hours`,
        ...(highPriority.length > 0 
          ? [`${highPriority.length} marked as HIGH PRIORITY`] 
          : []),
        ...newLeads.slice(0, 5).map(l => `• ${l.name} (${l.status})`)
      ],
      severity: highPriority.length > 0 ? 'warning' : 'info',
      count: newLeads.length,
    });
  }

  // ========================================
  // 2. STALE LEADS (48+ hours untouched)
  // ========================================
  const staleLeads = leads.filter(l => {
    if (l.status === 'WON' || l.status === 'LOST') return false;
    const lastActivity = l.lastContactedAt || l.createdAt;
    return daysSince(lastActivity) >= 2;
  });
  
  stats.staleLeads = staleLeads.length;
  
  if (staleLeads.length > 0) {
    sections.push({
      title: '⏰ Stale Leads',
      items: [
        `${staleLeads.length} lead${staleLeads.length > 1 ? 's' : ''} not contacted in 48+ hours`,
        ...staleLeads.slice(0, 5).map(l => {
          const days = daysSince(l.lastContactedAt || l.createdAt);
          return `• ${l.name} - ${days} days since last contact`;
        })
      ],
      severity: staleLeads.length > 5 ? 'critical' : 'warning',
      count: staleLeads.length,
    });
  }

  // ========================================
  // 3. AT-RISK PROJECTS
  // ========================================
  const atRiskProjects = projects.filter(p => {
    const status = p.slaStatus || calculateSLAStatus(p.stage, 0, activeCompany);
    return status === 'atRisk';
  });
  
  stats.atRiskProjects = atRiskProjects.length;
  
  if (atRiskProjects.length > 0) {
    sections.push({
      title: '⚠️ Projects At Risk',
      items: [
        `${atRiskProjects.length} project${atRiskProjects.length > 1 ? 's' : ''} approaching SLA deadline`,
        ...atRiskProjects.slice(0, 5).map(p => `• ${p.id} - Stage: ${p.stage}`)
      ],
      severity: 'warning',
      count: atRiskProjects.length,
    });
  }

  // ========================================
  // 4. LATE PROJECTS
  // ========================================
  const lateProjects = projects.filter(p => {
    const status = p.slaStatus || calculateSLAStatus(p.stage, 0, activeCompany);
    return status === 'late';
  });
  
  stats.lateProjects = lateProjects.length;
  
  if (lateProjects.length > 0) {
    sections.push({
      title: '🚨 Late Projects',
      items: [
        `${lateProjects.length} project${lateProjects.length > 1 ? 's' : ''} past SLA deadline`,
        ...lateProjects.slice(0, 5).map(p => `• ${p.id} - Stage: ${p.stage}`)
      ],
      severity: 'critical',
      count: lateProjects.length,
    });
  }

  // ========================================
  // 5. COMMISSION STATUS
  // ========================================
  const pendingCommissions = commissions.filter(c => c.status === 'Pending');
  const approvedCommissions = commissions.filter(c => c.status === 'Approved');
  
  stats.pendingCommissions = pendingCommissions.length;
  stats.approvedCommissions = approvedCommissions.length;
  
  const totalPending = pendingCommissions.reduce((sum, c) => sum + c.amount, 0);
  const totalApproved = approvedCommissions.reduce((sum, c) => sum + c.amount, 0);
  
  if (pendingCommissions.length > 0 || approvedCommissions.length > 0) {
    sections.push({
      title: '💰 Commission Highlights',
      items: [
        `${pendingCommissions.length} pending ($${totalPending.toLocaleString()})`,
        `${approvedCommissions.length} approved ($${totalApproved.toLocaleString()})`,
      ],
      severity: 'info',
      count: pendingCommissions.length + approvedCommissions.length,
    });
  }

  // ========================================
  // 6. INSTALLER PERFORMANCE (if any issues)
  // ========================================
  const installers = company?.installers || [];
  const lowRatedInstallers = installers.filter(i => i.rating && i.rating < 3);
  
  if (lowRatedInstallers.length > 0) {
    sections.push({
      title: '👷 Installer Alerts',
      items: [
        `${lowRatedInstallers.length} installer${lowRatedInstallers.length > 1 ? 's' : ''} with low ratings`,
        ...lowRatedInstallers.map(i => `• ${i.name} - Rating: ${i.rating}/5`)
      ],
      severity: 'warning',
      count: lowRatedInstallers.length,
    });
  }

  // ========================================
  // 7. REP COACHING NEEDS
  // ========================================
  // Find reps with low conversion or high stale lead counts
  const reps = company?.reps || [];
  const repLeadCounts = new Map<string, { total: number; won: number; stale: number }>();
  
  leads.forEach(lead => {
    if (lead.assignedTo) {
      const current = repLeadCounts.get(lead.assignedTo) || { total: 0, won: 0, stale: 0 };
      current.total++;
      if (lead.status === 'WON') current.won++;
      if (staleLeads.includes(lead)) current.stale++;
      repLeadCounts.set(lead.assignedTo, current);
    }
  });
  
  const repsNeedingCoaching = reps.filter(rep => {
    const counts = repLeadCounts.get(rep.id);
    if (!counts || counts.total < 5) return false;
    const conversionRate = counts.won / counts.total;
    const staleRate = counts.stale / counts.total;
    return conversionRate < 0.1 || staleRate > 0.3;
  });
  
  if (repsNeedingCoaching.length > 0) {
    sections.push({
      title: '📊 Rep Coaching Needed',
      items: [
        `${repsNeedingCoaching.length} rep${repsNeedingCoaching.length > 1 ? 's' : ''} may need attention`,
        ...repsNeedingCoaching.slice(0, 3).map(r => {
          const counts = repLeadCounts.get(r.id)!;
          const convRate = ((counts.won / counts.total) * 100).toFixed(0);
          return `• ${r.name} - ${convRate}% conversion, ${counts.stale} stale leads`;
        })
      ],
      severity: 'info',
      count: repsNeedingCoaching.length,
    });
  }

  // Build summary
  const criticalCount = sections.filter(s => s.severity === 'critical').reduce((sum, s) => sum + s.count, 0);
  const warningCount = sections.filter(s => s.severity === 'warning').reduce((sum, s) => sum + s.count, 0);
  
  let summary = '☀️ Good morning! ';
  if (criticalCount > 0) {
    summary += `⚠️ ${criticalCount} critical items need attention. `;
  }
  if (warningCount > 0) {
    summary += `${warningCount} warnings to review. `;
  }
  if (criticalCount === 0 && warningCount === 0) {
    summary += 'All systems looking good! ';
  }
  summary += `You have ${stats.newLeads} new leads and ${projects.length} active projects.`;

  return {
    companyId: activeCompany,
    generatedAt: Date.now(),
    sections,
    summary,
    stats,
  };
}

// Send digest as a notification
export function sendDigestToNotificationCenter(companyId?: string): void {
  const activeCompany = companyId || getActiveCompanyId();
  const digest = generateDailyDigest(activeCompany);
  
  // Build message from sections
  const messageLines: string[] = [digest.summary, ''];
  
  digest.sections.forEach(section => {
    messageLines.push(`**${section.title}**`);
    section.items.forEach(item => messageLines.push(item));
    messageLines.push('');
  });
  
  // Create notification
  notify({
    companyId: activeCompany,
    userId: null,
    type: 'digest',
    title: '☀️ Morning Digest',
    message: messageLines.join('\n'),
    priority: digest.sections.some(s => s.severity === 'critical') ? 'high' : 'normal',
    data: {
      stats: digest.stats,
      generatedAt: digest.generatedAt,
    },
  });
  
  // Update last digest time
  setLastDigestTime(activeCompany);
}

// Check and run digest if needed (call on app startup)
export function checkAndRunDigest(companyId?: string): boolean {
  const activeCompany = companyId || getActiveCompanyId();
  
  if (isDigestNeeded(activeCompany)) {
    sendDigestToNotificationCenter(activeCompany);
    return true;
  }
  
  return false;
}

// Get last digest info
export function getLastDigestInfo(companyId?: string): { lastRun: number; nextRun: number } {
  const lastRun = getLastDigestTime(companyId);
  const nextRun = lastRun + (24 * 60 * 60 * 1000); // 24 hours later
  
  return { lastRun, nextRun };
}

// Format digest as readable text (for export/display)
export function formatDigestAsText(digest: DailyDigest): string {
  const lines: string[] = [
    '═══════════════════════════════════════',
    '        PRIMUS HOME PRO - DAILY DIGEST',
    `        ${new Date(digest.generatedAt).toLocaleDateString()}`,
    '═══════════════════════════════════════',
    '',
    digest.summary,
    '',
  ];
  
  digest.sections.forEach(section => {
    const icon = section.severity === 'critical' ? '🚨' : section.severity === 'warning' ? '⚠️' : 'ℹ️';
    lines.push(`${icon} ${section.title}`);
    lines.push('─'.repeat(40));
    section.items.forEach(item => lines.push(`  ${item}`));
    lines.push('');
  });
  
  lines.push('═══════════════════════════════════════');
  lines.push('Quick Stats:');
  lines.push(`  • New Leads: ${digest.stats.newLeads}`);
  lines.push(`  • Stale Leads: ${digest.stats.staleLeads}`);
  lines.push(`  • At-Risk Projects: ${digest.stats.atRiskProjects}`);
  lines.push(`  • Late Projects: ${digest.stats.lateProjects}`);
  lines.push(`  • Pending Commissions: ${digest.stats.pendingCommissions}`);
  lines.push('═══════════════════════════════════════');
  
  return lines.join('\n');
}
