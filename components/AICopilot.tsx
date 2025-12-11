/**
 * AI Copilot - Sales & Ops Intelligent Advisor
 * Real-time recommendations, alerts, coaching, and CEO briefings
 */

import React, { useMemo, useState } from 'react';
import { 
  Bot, AlertTriangle, Users, Wrench, DollarSign, Briefcase,
  TrendingUp, TrendingDown, ChevronDown, ChevronUp, Clock,
  Target, Zap, MessageSquare, Lightbulb, Shield, Calendar
} from 'lucide-react';
import { Lead, Project, Commission } from '../types';
import { computeRevenueForecast } from '../services/revenueEngine';

interface AICopilotProps {
  leads: Lead[];
  projects: Project[];
  commissions: Commission[];
  healthScore?: number;
}

interface RepStats {
  name: string;
  totalLeads: number;
  wonLeads: number;
  winRate: number;
  avgAiScore: number;
  staleLeads: number;
  qualifiedStuck: number;
}

interface InstallerStats {
  installer: string;
  total: number;
  completed: number;
  onTrack: number;
  atRisk: number;
  late: number;
  slaScore: number;
}

interface ActionItem {
  id: string;
  type: 'sales' | 'ops' | 'revenue' | 'urgent';
  priority: 'high' | 'medium' | 'low';
  message: string;
  metric?: string;
  icon: React.ElementType;
}

interface CoachingInsight {
  rep: string;
  insights: string[];
  priority: 'high' | 'medium' | 'low';
}

// Priority badge component
const PriorityBadge: React.FC<{ priority: 'high' | 'medium' | 'low' }> = ({ priority }) => {
  const styles = {
    high: 'bg-red-500/10 text-red-400 border-red-500/20',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    low: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };
  
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${styles[priority]}`}>
      {priority}
    </span>
  );
};

// Action item card
const ActionCard: React.FC<{ action: ActionItem }> = ({ action }) => {
  const Icon = action.icon;
  const borderColors = {
    urgent: 'border-l-red-500',
    sales: 'border-l-blue-500',
    ops: 'border-l-amber-500',
    revenue: 'border-l-emerald-500',
  };
  
  return (
    <div className={`bg-slate-800/50 border border-slate-700/50 border-l-2 ${borderColors[action.type]} rounded-lg p-3`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${
          action.type === 'urgent' ? 'bg-red-500/10' :
          action.type === 'sales' ? 'bg-blue-500/10' :
          action.type === 'ops' ? 'bg-amber-500/10' : 'bg-emerald-500/10'
        }`}>
          <Icon size={14} className={
            action.type === 'urgent' ? 'text-red-400' :
            action.type === 'sales' ? 'text-blue-400' :
            action.type === 'ops' ? 'text-amber-400' : 'text-emerald-400'
          } />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <PriorityBadge priority={action.priority} />
            {action.metric && (
              <span className="text-xs font-mono text-slate-500">{action.metric}</span>
            )}
          </div>
          <p className="text-sm text-slate-300">{action.message}</p>
        </div>
      </div>
    </div>
  );
};

const AICopilot: React.FC<AICopilotProps> = ({ leads, projects, commissions, healthScore = 70 }) => {
  const [expandedSection, setExpandedSection] = useState<string | null>('actions');

  // === COMPUTE REP STATS ===
  const repStats = useMemo<RepStats[]>(() => {
    const reps = Array.from(new Set(leads.map(l => l.assignedTo).filter(Boolean))) as string[];
    const now = Date.now();
    const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
    const fiveDaysMs = 5 * 24 * 60 * 60 * 1000;

    return reps.map(name => {
      const repLeads = leads.filter(l => l.assignedTo === name);
      const wonLeads = repLeads.filter(l => l.status === 'CLOSED_WON').length;
      const winRate = repLeads.length > 0 ? (wonLeads / repLeads.length) * 100 : 0;
      const avgAiScore = repLeads.length > 0
        ? repLeads.reduce((s, l) => s + (l.aiScore || 50), 0) / repLeads.length
        : 50;
      
      // Stale leads (not won/lost, created > 2 days ago)
      const staleLeads = repLeads.filter(l => 
        !['CLOSED_WON', 'CLOSED_LOST'].includes(l.status) &&
        (now - new Date(l.createdAt).getTime()) > twoDaysMs
      ).length;

      // Stuck in qualified for 5+ days
      const qualifiedStuck = repLeads.filter(l =>
        l.status === 'QUALIFIED' &&
        (now - new Date(l.createdAt).getTime()) > fiveDaysMs
      ).length;

      return {
        name,
        totalLeads: repLeads.length,
        wonLeads,
        winRate,
        avgAiScore,
        staleLeads,
        qualifiedStuck,
      };
    }).sort((a, b) => b.totalLeads - a.totalLeads);
  }, [leads]);

  // === COMPUTE INSTALLER STATS ===
  const installerStats = useMemo<InstallerStats[]>(() => {
    const installers = Array.from(
      new Set(projects.map(p => (p as any).installerName || 'Unassigned'))
    );

    return installers.map(installer => {
      const list = projects.filter(p => ((p as any).installerName || 'Unassigned') === installer);
      const completed = list.filter(p => p.stage === 'PTO').length;
      const onTrack = list.filter(p => p.slaStatus === 'onTrack' || !p.slaStatus).length;
      const atRisk = list.filter(p => p.slaStatus === 'atRisk').length;
      const late = list.filter(p => p.slaStatus === 'late').length;
      const slaScore = list.length > 0 
        ? Math.round(((onTrack * 100) + (atRisk * 50)) / list.length)
        : 100;

      return { installer, total: list.length, completed, onTrack, atRisk, late, slaScore };
    });
  }, [projects]);

  // === COMPUTE FORECAST ===
  const forecast = useMemo(() => {
    return computeRevenueForecast(leads, projects, commissions);
  }, [leads, projects, commissions]);

  // === ANALYSIS: STALE LEADS ===
  const staleLeads = useMemo(() => {
    const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
    return leads.filter(l =>
      !['CLOSED_WON', 'CLOSED_LOST'].includes(l.status) &&
      (Date.now() - new Date(l.createdAt).getTime()) > twoDaysMs
    );
  }, [leads]);

  // === ANALYSIS: HIGH-VALUE UNWORKED ===
  const highValueUnworked = useMemo(() => {
    return leads.filter(l => l.priority === 'high' && l.status === 'NEW');
  }, [leads]);

  // === ANALYSIS: DELAYED PROJECTS ===
  const delayedProjects = useMemo(() => {
    return projects.filter(p => p.slaStatus === 'late' || p.slaStatus === 'atRisk');
  }, [projects]);

  // === ANALYSIS: UNDERPERFORMING INSTALLERS ===
  const underperformingInstallers = useMemo(() => {
    return installerStats.filter(i => i.late >= 2 || i.atRisk >= 3);
  }, [installerStats]);

  // === ANALYSIS: PENDING COMMISSIONS ===
  const pendingCommissions = useMemo(() => {
    return commissions.filter(c => c.status === 'PENDING' || c.status === 'APPROVED');
  }, [commissions]);

  // === ANALYSIS: REVENUE THREAT ===
  const revenueThreat = useMemo(() => {
    return forecast.revenue90 < forecast.revenue30;
  }, [forecast]);

  // === ANALYSIS: CONVERSION RATES ===
  const conversionAnalysis = useMemo(() => {
    const total = leads.length;
    if (total === 0) return { qualifiedRate: 0, proposalRate: 0, winRate: 0, trend: 'stable' };
    
    const qualified = leads.filter(l => l.status !== 'NEW').length;
    const proposals = leads.filter(l => ['PROPOSAL_SENT', 'CLOSED_WON', 'CLOSED_LOST'].includes(l.status)).length;
    const won = leads.filter(l => l.status === 'CLOSED_WON').length;

    return {
      qualifiedRate: (qualified / total) * 100,
      proposalRate: (proposals / total) * 100,
      winRate: (won / total) * 100,
      trend: won > 0 ? 'positive' : 'needs_attention',
    };
  }, [leads]);

  // === GENERATE PRIORITY ACTIONS ===
  const priorityActions = useMemo<ActionItem[]>(() => {
    const actions: ActionItem[] = [];

    // High-value leads needing attention
    if (highValueUnworked.length > 0) {
      actions.push({
        id: 'high-value',
        type: 'urgent',
        priority: 'high',
        message: `${highValueUnworked.length} high-value leads need immediate attention — contact within 24 hours.`,
        metric: `$${highValueUnworked.reduce((s, l) => s + (l.estimatedBill || 0), 0).toLocaleString()} potential`,
        icon: Zap,
      });
    }

    // Stale leads
    if (staleLeads.length > 0) {
      actions.push({
        id: 'stale',
        type: 'sales',
        priority: staleLeads.length > 5 ? 'high' : 'medium',
        message: `${staleLeads.length} leads have not been contacted in over 48 hours.`,
        icon: Clock,
      });
    }

    // Delayed projects
    if (delayedProjects.length > 0) {
      const lateCount = delayedProjects.filter(p => p.slaStatus === 'late').length;
      actions.push({
        id: 'delayed',
        type: 'ops',
        priority: lateCount > 0 ? 'high' : 'medium',
        message: `${delayedProjects.length} projects are at-risk or late — ${lateCount} need immediate intervention.`,
        icon: AlertTriangle,
      });
    }

    // Installer issues
    if (underperformingInstallers.length > 0) {
      actions.push({
        id: 'installers',
        type: 'ops',
        priority: 'medium',
        message: `Installer delays detected: ${underperformingInstallers.map(i => i.installer).join(', ')}`,
        icon: Wrench,
      });
    }

    // Pending commissions
    if (pendingCommissions.length > 3) {
      const totalPending = pendingCommissions.reduce((s, c) => s + (c.amountUsd || 0), 0);
      actions.push({
        id: 'commissions',
        type: 'revenue',
        priority: 'medium',
        message: `${pendingCommissions.length} commission payouts are pending approval.`,
        metric: `$${totalPending.toLocaleString()} pending`,
        icon: DollarSign,
      });
    }

    // Revenue threat
    if (revenueThreat) {
      actions.push({
        id: 'revenue-threat',
        type: 'revenue',
        priority: 'high',
        message: 'Revenue forecast is declining — investigate stalled proposals and at-risk projects.',
        icon: TrendingDown,
      });
    }

    // Low conversion warning
    if (conversionAnalysis.winRate < 15 && leads.length > 5) {
      actions.push({
        id: 'conversion',
        type: 'sales',
        priority: 'medium',
        message: `Win rate is at ${conversionAnalysis.winRate.toFixed(0)}% — review qualification criteria and follow-up process.`,
        icon: Target,
      });
    }

    // Low forecast confidence
    if (forecast.confidence < 50) {
      actions.push({
        id: 'confidence',
        type: 'revenue',
        priority: 'medium',
        message: `Forecast confidence is low (${forecast.confidence}%) — add more qualified leads to stabilize projections.`,
        icon: Shield,
      });
    }

    return actions.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [highValueUnworked, staleLeads, delayedProjects, underperformingInstallers, pendingCommissions, revenueThreat, conversionAnalysis, forecast, leads]);

  // === GENERATE REP COACHING ===
  const repCoaching = useMemo<CoachingInsight[]>(() => {
    return repStats.map(rep => {
      const insights: string[] = [];
      let priority: 'high' | 'medium' | 'low' = 'low';

      // Stuck leads
      if (rep.qualifiedStuck > 0) {
        insights.push(`${rep.qualifiedStuck} leads stuck in 'Qualified' for 5+ days — advance or requalify.`);
        priority = 'high';
      }

      // Stale leads
      if (rep.staleLeads > 2) {
        insights.push(`${rep.staleLeads} leads need follow-up — aging hurts conversion.`);
        if (priority !== 'high') priority = 'medium';
      }

      // Low win rate
      if (rep.winRate < 20 && rep.totalLeads > 3) {
        insights.push(`Win rate is ${rep.winRate.toFixed(0)}% — review pitch and objection handling.`);
        if (priority !== 'high') priority = 'medium';
      }

      // High AI score
      if (rep.avgAiScore > 70) {
        insights.push(`AI lead quality is excellent (${rep.avgAiScore.toFixed(0)}) — prioritize this rep for new canvassing.`);
      }

      // Good performer
      if (rep.winRate > 35 && insights.length === 0) {
        insights.push(`Strong performer! Consider for mentoring newer reps.`);
      }

      // No activity
      if (rep.totalLeads > 0 && rep.staleLeads === rep.totalLeads) {
        insights.push(`All leads are stale — check availability or reassign leads.`);
        priority = 'high';
      }

      return {
        rep: rep.name,
        insights: insights.length > 0 ? insights : ['On track — no immediate actions needed.'],
        priority,
      };
    }).filter(c => c.insights.length > 0).sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [repStats]);

  // === GENERATE CEO SUMMARY ===
  const ceoSummary = useMemo(() => {
    const risks: string[] = [];
    const opportunities: string[] = [];
    const actions: string[] = [];

    // Risks
    if (delayedProjects.length > 0) {
      risks.push(`${delayedProjects.length} projects at risk of missing deadlines`);
    }
    if (revenueThreat) {
      risks.push('Revenue trajectory is declining');
    }
    if (staleLeads.length > 5) {
      risks.push(`${staleLeads.length} leads going cold`);
    }
    if (underperformingInstallers.length > 0) {
      risks.push('Installer performance issues detected');
    }

    // Opportunities
    if (highValueUnworked.length > 0) {
      opportunities.push(`${highValueUnworked.length} high-value leads ready for contact`);
    }
    if (forecast.confidence > 70) {
      opportunities.push(`Strong forecast confidence (${forecast.confidence}%)`);
    }
    const topRep = repStats.find(r => r.winRate > 35);
    if (topRep) {
      opportunities.push(`${topRep.name} is a top performer — leverage for training`);
    }

    // Actions
    if (highValueUnworked.length > 0) {
      actions.push('Prioritize high-value lead outreach today');
    }
    if (delayedProjects.length > 0) {
      actions.push('Review at-risk projects with ops team');
    }
    if (pendingCommissions.length > 3) {
      actions.push('Process pending commission approvals');
    }
    if (staleLeads.length > 3) {
      actions.push('Assign stale leads for immediate follow-up');
    }

    // Overall assessment
    let assessment = '';
    if (healthScore >= 80) {
      assessment = 'Operations and sales are well-synchronized. Focus on scaling successful patterns.';
    } else if (healthScore >= 60) {
      assessment = 'System is stable with room for optimization. Address the priority items below.';
    } else if (healthScore >= 40) {
      assessment = 'Performance is below target. Concentrate resources on resolving bottlenecks.';
    } else {
      assessment = 'Immediate intervention required. Revenue and operations need urgent attention.';
    }

    return { risks, opportunities, actions, assessment };
  }, [delayedProjects, revenueThreat, staleLeads, underperformingInstallers, highValueUnworked, forecast, repStats, pendingCommissions, healthScore]);

  // Section toggle helper
  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-5 bg-gradient-to-r from-purple-500/10 via-slate-900 to-blue-500/10 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/20 rounded-xl">
              <Bot size={22} className="text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">AI Copilot</h3>
              <p className="text-xs text-slate-500">Real-time sales & operations advisor</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
            <span className="text-xs font-mono text-purple-400">ANALYZING</span>
          </div>
        </div>
      </div>

      {/* Priority Actions */}
      <div className="border-b border-slate-800">
        <button
          onClick={() => toggleSection('actions')}
          className="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-800/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-amber-400" />
            <span className="text-sm font-medium text-slate-200">Priority Actions</span>
            {priorityActions.length > 0 && (
              <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-mono">
                {priorityActions.length}
              </span>
            )}
          </div>
          {expandedSection === 'actions' ? (
            <ChevronUp size={16} className="text-slate-500" />
          ) : (
            <ChevronDown size={16} className="text-slate-500" />
          )}
        </button>
        {expandedSection === 'actions' && (
          <div className="px-5 pb-4 space-y-2">
            {priorityActions.length > 0 ? (
              priorityActions.map(action => (
                <ActionCard key={action.id} action={action} />
              ))
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">
                ✓ No urgent actions — operations running smoothly
              </p>
            )}
          </div>
        )}
      </div>

      {/* Rep Coaching */}
      <div className="border-b border-slate-800">
        <button
          onClick={() => toggleSection('coaching')}
          className="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-800/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Users size={16} className="text-blue-400" />
            <span className="text-sm font-medium text-slate-200">Rep Coaching Insights</span>
            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-mono">
              {repCoaching.length}
            </span>
          </div>
          {expandedSection === 'coaching' ? (
            <ChevronUp size={16} className="text-slate-500" />
          ) : (
            <ChevronDown size={16} className="text-slate-500" />
          )}
        </button>
        {expandedSection === 'coaching' && (
          <div className="px-5 pb-4 space-y-3">
            {repCoaching.length > 0 ? (
              repCoaching.map((coaching, idx) => (
                <div key={idx} className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-blue-400">{coaching.rep}</span>
                    <PriorityBadge priority={coaching.priority} />
                  </div>
                  <ul className="space-y-1">
                    {coaching.insights.map((insight, i) => (
                      <li key={i} className="text-xs text-slate-400 flex items-start gap-2">
                        <Lightbulb size={12} className="text-amber-500 mt-0.5 flex-shrink-0" />
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">No rep data available</p>
            )}
          </div>
        )}
      </div>

      {/* Ops & Installer Alerts */}
      <div className="border-b border-slate-800">
        <button
          onClick={() => toggleSection('ops')}
          className="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-800/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Wrench size={16} className="text-amber-400" />
            <span className="text-sm font-medium text-slate-200">Ops & Installer Alerts</span>
            {underperformingInstallers.length > 0 && (
              <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-mono">
                {underperformingInstallers.length} issues
              </span>
            )}
          </div>
          {expandedSection === 'ops' ? (
            <ChevronUp size={16} className="text-slate-500" />
          ) : (
            <ChevronDown size={16} className="text-slate-500" />
          )}
        </button>
        {expandedSection === 'ops' && (
          <div className="px-5 pb-4 space-y-2">
            {underperformingInstallers.length > 0 ? (
              underperformingInstallers.map((installer, idx) => (
                <div key={idx} className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-200">{installer.installer}</span>
                    <span className="text-xs text-red-400">SLA: {installer.slaScore}%</span>
                  </div>
                  <p className="text-xs text-red-300 mt-1">
                    {installer.late} late installs, {installer.atRisk} at-risk projects
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-emerald-400 text-center py-4">
                ✓ All installers performing within SLA targets
              </p>
            )}

            {/* Stage bottleneck summary */}
            {delayedProjects.length > 0 && (
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 mt-2">
                <p className="text-xs text-amber-300">
                  <AlertTriangle size={12} className="inline mr-1" />
                  {delayedProjects.filter(p => p.slaStatus === 'atRisk').length} projects at risk, {' '}
                  {delayedProjects.filter(p => p.slaStatus === 'late').length} late
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Revenue Analysis */}
      <div className="border-b border-slate-800">
        <button
          onClick={() => toggleSection('revenue')}
          className="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-800/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <DollarSign size={16} className="text-emerald-400" />
            <span className="text-sm font-medium text-slate-200">Revenue Analysis</span>
          </div>
          {expandedSection === 'revenue' ? (
            <ChevronUp size={16} className="text-slate-500" />
          ) : (
            <ChevronDown size={16} className="text-slate-500" />
          )}
        </button>
        {expandedSection === 'revenue' && (
          <div className="px-5 pb-4 space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                <p className="text-lg font-mono font-bold text-slate-200">${(forecast.revenue30/1000).toFixed(1)}k</p>
                <p className="text-xs text-slate-500">30-Day</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                <p className="text-lg font-mono font-bold text-slate-200">${(forecast.revenue60/1000).toFixed(1)}k</p>
                <p className="text-xs text-slate-500">60-Day</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                <p className="text-lg font-mono font-bold text-slate-200">${(forecast.revenue90/1000).toFixed(1)}k</p>
                <p className="text-xs text-slate-500">90-Day</p>
              </div>
            </div>
            
            <div className={`rounded-lg p-3 ${revenueThreat ? 'bg-red-500/10 border border-red-500/20' : 'bg-emerald-500/10 border border-emerald-500/20'}`}>
              <div className="flex items-center gap-2">
                {revenueThreat ? (
                  <>
                    <TrendingDown size={16} className="text-red-400" />
                    <p className="text-sm text-red-300">
                      Revenue trajectory is declining — investigate stalled proposals.
                    </p>
                  </>
                ) : (
                  <>
                    <TrendingUp size={16} className="text-emerald-400" />
                    <p className="text-sm text-emerald-300">
                      Revenue trajectory is positive with {forecast.confidence}% confidence.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CEO Morning Briefing */}
      <div>
        <button
          onClick={() => toggleSection('ceo')}
          className="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-800/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Briefcase size={16} className="text-purple-400" />
            <span className="text-sm font-medium text-slate-200">CEO Morning Briefing</span>
          </div>
          {expandedSection === 'ceo' ? (
            <ChevronUp size={16} className="text-slate-500" />
          ) : (
            <ChevronDown size={16} className="text-slate-500" />
          )}
        </button>
        {expandedSection === 'ceo' && (
          <div className="px-5 pb-5 space-y-4">
            {/* Assessment */}
            <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-4">
              <p className="text-sm text-slate-300">{ceoSummary.assessment}</p>
            </div>

            {/* Risks */}
            {ceoSummary.risks.length > 0 && (
              <div>
                <h5 className="text-xs font-bold text-red-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <AlertTriangle size={12} /> Top Risks
                </h5>
                <ul className="space-y-1">
                  {ceoSummary.risks.map((risk, i) => (
                    <li key={i} className="text-xs text-slate-400 flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-red-500" />
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Opportunities */}
            {ceoSummary.opportunities.length > 0 && (
              <div>
                <h5 className="text-xs font-bold text-emerald-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <TrendingUp size={12} /> Opportunities
                </h5>
                <ul className="space-y-1">
                  {ceoSummary.opportunities.map((opp, i) => (
                    <li key={i} className="text-xs text-slate-400 flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-emerald-500" />
                      {opp}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            {ceoSummary.actions.length > 0 && (
              <div>
                <h5 className="text-xs font-bold text-blue-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <Calendar size={12} /> Today's Actions
                </h5>
                <ul className="space-y-1">
                  {ceoSummary.actions.map((action, i) => (
                    <li key={i} className="text-xs text-slate-400 flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-blue-500" />
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AICopilot;
