/**
 * Company Health Score System
 * Unified 0-100 score based on leads, sales, projects, revenue, and team performance
 */

import React, { useMemo, useEffect, useState } from 'react';
import { 
  Heart, TrendingUp, TrendingDown, ChevronDown, ChevronUp, 
  Users, Target, Briefcase, DollarSign, UserCheck, Activity,
  AlertTriangle, CheckCircle2, Minus
} from 'lucide-react';
import { Lead, Project, Commission } from '../types';
import { computeRevenueForecast } from '../services/revenueEngine';

interface CompanyHealthScoreProps {
  leads: Lead[];
  projects: Project[];
  commissions: Commission[];
}

interface ScoreBreakdown {
  leadHealth: number;
  salesEfficiency: number;
  projectHealth: number;
  revenueStrength: number;
  teamPerformance: number;
}

interface ScoreHistoryEntry {
  score: number;
  date: number;
}

// LocalStorage key for score history
const SCORE_HISTORY_KEY = 'primus_health_score_history';

// Load score history from localStorage
const loadScoreHistory = (): ScoreHistoryEntry[] => {
  try {
    const data = localStorage.getItem(SCORE_HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

// Save score history to localStorage
const saveScoreHistory = (history: ScoreHistoryEntry[]) => {
  // Keep only last 90 days of history
  const cutoff = Date.now() - (90 * 24 * 60 * 60 * 1000);
  const filtered = history.filter(h => h.date > cutoff);
  localStorage.setItem(SCORE_HISTORY_KEY, JSON.stringify(filtered.slice(-100)));
};

// Category card component
const CategoryCard: React.FC<{
  title: string;
  score: number;
  maxScore: number;
  icon: React.ElementType;
  color: string;
  details?: string[];
}> = ({ title, score, maxScore, icon: Icon, color, details }) => {
  const percentage = (score / maxScore) * 100;
  
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon size={16} className={color} />
          <span className="text-sm font-medium text-slate-300">{title}</span>
        </div>
        <span className={`text-lg font-mono font-bold ${color}`}>
          {score}/{maxScore}
        </span>
      </div>
      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            percentage >= 70 ? 'bg-emerald-500' :
            percentage >= 40 ? 'bg-amber-500' : 'bg-red-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {details && details.length > 0 && (
        <div className="mt-2 space-y-1">
          {details.map((detail, i) => (
            <p key={i} className="text-xs text-slate-500">{detail}</p>
          ))}
        </div>
      )}
    </div>
  );
};

const CompanyHealthScore: React.FC<CompanyHealthScoreProps> = ({ leads, projects, commissions }) => {
  const [expanded, setExpanded] = useState(false);
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable');
  const [trendDelta, setTrendDelta] = useState(0);

  // === 1. LEAD HEALTH (20 points) ===
  const leadHealthData = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const newLeadsThisWeek = leads.filter(l => new Date(l.createdAt) >= weekAgo).length;
    const highPriorityCount = leads.filter(l => l.priority === 'high').length;
    const highPriorityPercent = leads.length > 0 ? (highPriorityCount / leads.length) * 100 : 0;
    const avgAiScore = leads.length > 0 
      ? leads.reduce((sum, l) => sum + (l.aiScore || 50), 0) / leads.length 
      : 50;

    // Score calculation
    let score = 0;
    let details: string[] = [];

    // New lead volume (8 pts max)
    if (newLeadsThisWeek > 15) { score += 8; details.push(`${newLeadsThisWeek} new leads (+8)`); }
    else if (newLeadsThisWeek >= 10) { score += 5; details.push(`${newLeadsThisWeek} new leads (+5)`); }
    else { score += 2; details.push(`${newLeadsThisWeek} new leads (+2)`); }

    // Avg AI Score (6 pts max)
    if (avgAiScore > 70) { score += 6; details.push(`Avg AI: ${avgAiScore.toFixed(0)} (+6)`); }
    else if (avgAiScore >= 50) { score += 3; details.push(`Avg AI: ${avgAiScore.toFixed(0)} (+3)`); }
    else { score += 1; details.push(`Avg AI: ${avgAiScore.toFixed(0)} (+1)`); }

    // High Priority % (6 pts max)
    if (highPriorityPercent > 25) { score += 6; details.push(`${highPriorityPercent.toFixed(0)}% high priority (+6)`); }
    else if (highPriorityPercent >= 15) { score += 4; details.push(`${highPriorityPercent.toFixed(0)}% high priority (+4)`); }
    else { score += 2; details.push(`${highPriorityPercent.toFixed(0)}% high priority (+2)`); }

    return { score, details, newLeadsThisWeek, avgAiScore, highPriorityPercent };
  }, [leads]);

  // === 2. SALES EFFICIENCY (20 points) ===
  const salesEfficiencyData = useMemo(() => {
    const totalLeads = leads.length;
    if (totalLeads === 0) return { score: 10, details: ['No leads to analyze'], winRate: 0, qualifiedRate: 0, proposalRate: 0 };

    const qualified = leads.filter(l => l.status !== 'NEW').length;
    const proposals = leads.filter(l => ['PROPOSAL_SENT', 'CLOSED_WON', 'CLOSED_LOST'].includes(l.status)).length;
    const won = leads.filter(l => l.status === 'CLOSED_WON').length;

    const qualifiedRate = (qualified / totalLeads) * 100;
    const proposalRate = (proposals / totalLeads) * 100;
    const winRate = (won / totalLeads) * 100;

    let score = 0;
    let details: string[] = [];

    // Win Rate (8 pts max)
    if (winRate > 40) { score += 8; details.push(`Win rate: ${winRate.toFixed(0)}% (+8)`); }
    else if (winRate >= 20) { score += 5; details.push(`Win rate: ${winRate.toFixed(0)}% (+5)`); }
    else { score += 2; details.push(`Win rate: ${winRate.toFixed(0)}% (+2)`); }

    // Qualified Rate (6 pts max)
    if (qualifiedRate > 50) { score += 6; details.push(`Qualified: ${qualifiedRate.toFixed(0)}% (+6)`); }
    else if (qualifiedRate >= 30) { score += 4; details.push(`Qualified: ${qualifiedRate.toFixed(0)}% (+4)`); }
    else { score += 2; details.push(`Qualified: ${qualifiedRate.toFixed(0)}% (+2)`); }

    // Proposal Rate (6 pts max)
    if (proposalRate > 40) { score += 6; details.push(`Proposals: ${proposalRate.toFixed(0)}% (+6)`); }
    else if (proposalRate >= 20) { score += 3; details.push(`Proposals: ${proposalRate.toFixed(0)}% (+3)`); }
    else { score += 1; details.push(`Proposals: ${proposalRate.toFixed(0)}% (+1)`); }

    return { score, details, winRate, qualifiedRate, proposalRate };
  }, [leads]);

  // === 3. PROJECT HEALTH / SLA (25 points) ===
  const projectHealthData = useMemo(() => {
    const activeProjects = projects.filter(p => p.stage !== 'PTO');
    const total = activeProjects.length;
    
    if (total === 0) return { score: 15, details: ['No active projects'], onTrackPercent: 100, latePercent: 0 };

    const onTrack = activeProjects.filter(p => p.slaStatus === 'onTrack' || !p.slaStatus).length;
    const late = activeProjects.filter(p => p.slaStatus === 'late').length;

    const onTrackPercent = (onTrack / total) * 100;
    const latePercent = (late / total) * 100;

    let score = 0;
    let details: string[] = [];

    // On Track % (12 pts max)
    if (onTrackPercent > 70) { score += 12; details.push(`${onTrackPercent.toFixed(0)}% on track (+12)`); }
    else if (onTrackPercent >= 50) { score += 8; details.push(`${onTrackPercent.toFixed(0)}% on track (+8)`); }
    else { score += 4; details.push(`${onTrackPercent.toFixed(0)}% on track (+4)`); }

    // Late % (8 pts max)
    if (latePercent < 10) { score += 8; details.push(`${latePercent.toFixed(0)}% late (+8)`); }
    else if (latePercent <= 20) { score += 5; details.push(`${latePercent.toFixed(0)}% late (+5)`); }
    else { score += 2; details.push(`${latePercent.toFixed(0)}% late (+2)`); }

    // Stage duration benchmark (5 pts max) - simplified check
    const completed = projects.filter(p => p.stage === 'PTO').length;
    if (completed > 0) {
      score += 5;
      details.push(`${completed} completed (+5)`);
    } else {
      score += 2;
      details.push('No completions yet (+2)');
    }

    return { score, details, onTrackPercent, latePercent };
  }, [projects]);

  // === 4. REVENUE STRENGTH (20 points) ===
  const revenueStrengthData = useMemo(() => {
    const forecast = computeRevenueForecast(leads, projects, commissions);
    const { revenue30, revenue60, revenue90, confidence } = forecast;

    let score = 0;
    let details: string[] = [];

    // Confidence (10 pts max)
    if (confidence > 80) { score += 10; details.push(`Confidence: ${confidence}% (+10)`); }
    else if (confidence >= 60) { score += 6; details.push(`Confidence: ${confidence}% (+6)`); }
    else { score += 3; details.push(`Confidence: ${confidence}% (+3)`); }

    // Revenue Slope (10 pts max)
    const slope = revenue90 - revenue30;
    const slopePercent = revenue30 > 0 ? (slope / revenue30) * 100 : 0;
    
    if (slope > 0 && slopePercent > 20) { 
      score += 10; 
      details.push(`Strong growth: +${slopePercent.toFixed(0)}% (+10)`); 
    } else if (slope >= 0) { 
      score += 6; 
      details.push(`Stable revenue (+6)`); 
    } else { 
      score += 3; 
      details.push(`Declining trend (+3)`); 
    }

    return { score, details, confidence, slope: slopePercent, revenue30, revenue90 };
  }, [leads, projects, commissions]);

  // === 5. TEAM PERFORMANCE (15 points) ===
  const teamPerformanceData = useMemo(() => {
    // Get unique reps
    const reps = Array.from(new Set(leads.map(l => l.assignedTo).filter(Boolean)));
    
    if (reps.length === 0) return { score: 8, details: ['No rep data'], avgWinRate: 0, avgSlaScore: 0 };

    // Calculate per-rep metrics
    const repStats = reps.map(rep => {
      const repLeads = leads.filter(l => l.assignedTo === rep);
      const won = repLeads.filter(l => l.status === 'CLOSED_WON').length;
      const winRate = repLeads.length > 0 ? (won / repLeads.length) * 100 : 0;
      const avgAi = repLeads.length > 0 
        ? repLeads.reduce((s, l) => s + (l.aiScore || 50), 0) / repLeads.length 
        : 50;
      
      const repProjects = projects.filter(p => {
        const lead = leads.find(l => l.id === p.leadId);
        return lead?.assignedTo === rep;
      });
      const onTrack = repProjects.filter(p => p.slaStatus === 'onTrack' || !p.slaStatus).length;
      const slaScore = repProjects.length > 0 ? (onTrack / repProjects.length) * 100 : 100;

      return { rep, winRate, avgAi, slaScore };
    });

    const avgWinRate = repStats.reduce((s, r) => s + r.winRate, 0) / repStats.length;
    const avgSlaScore = repStats.reduce((s, r) => s + r.slaScore, 0) / repStats.length;
    const avgAiScore = repStats.reduce((s, r) => s + r.avgAi, 0) / repStats.length;

    let score = 0;
    let details: string[] = [];

    // Team avg win rate (6 pts max)
    if (avgWinRate > 35) { score += 6; details.push(`Team win rate: ${avgWinRate.toFixed(0)}% (+6)`); }
    else if (avgWinRate >= 20) { score += 4; details.push(`Team win rate: ${avgWinRate.toFixed(0)}% (+4)`); }
    else { score += 2; details.push(`Team win rate: ${avgWinRate.toFixed(0)}% (+2)`); }

    // Team SLA (6 pts max)
    if (avgSlaScore > 70) { score += 6; details.push(`Team SLA: ${avgSlaScore.toFixed(0)}% (+6)`); }
    else if (avgSlaScore >= 50) { score += 4; details.push(`Team SLA: ${avgSlaScore.toFixed(0)}% (+4)`); }
    else { score += 2; details.push(`Team SLA: ${avgSlaScore.toFixed(0)}% (+2)`); }

    // Avg AI Score (3 pts max)
    if (avgAiScore > 65) { score += 3; details.push(`Avg AI score: ${avgAiScore.toFixed(0)} (+3)`); }
    else { score += 1; details.push(`Avg AI score: ${avgAiScore.toFixed(0)} (+1)`); }

    return { score, details, avgWinRate, avgSlaScore };
  }, [leads, projects]);

  // === FINAL HEALTH SCORE ===
  const breakdown: ScoreBreakdown = useMemo(() => ({
    leadHealth: leadHealthData.score,
    salesEfficiency: salesEfficiencyData.score,
    projectHealth: projectHealthData.score,
    revenueStrength: revenueStrengthData.score,
    teamPerformance: teamPerformanceData.score,
  }), [leadHealthData, salesEfficiencyData, projectHealthData, revenueStrengthData, teamPerformanceData]);

  const healthScore = Math.min(100, 
    breakdown.leadHealth + 
    breakdown.salesEfficiency + 
    breakdown.projectHealth + 
    breakdown.revenueStrength + 
    breakdown.teamPerformance
  );

  // === TREND TRACKING ===
  useEffect(() => {
    const history = loadScoreHistory();
    
    // Calculate trend from last 30 days
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const recentHistory = history.filter(h => h.date > thirtyDaysAgo);
    
    if (recentHistory.length > 0) {
      const oldScore = recentHistory[0].score;
      const delta = healthScore - oldScore;
      setTrendDelta(delta);
      setTrend(delta > 2 ? 'up' : delta < -2 ? 'down' : 'stable');
    }

    // Save current score (once per day max)
    const today = new Date().toDateString();
    const lastEntry = history[history.length - 1];
    const lastDate = lastEntry ? new Date(lastEntry.date).toDateString() : null;
    
    if (today !== lastDate) {
      history.push({ score: healthScore, date: Date.now() });
      saveScoreHistory(history);
    }
  }, [healthScore]);

  // === CEO SUMMARY ===
  const ceoSummary = useMemo(() => {
    if (healthScore >= 85) {
      return "Exceptional performance across all metrics. The company is operating at peak efficiency with strong lead flow, excellent conversion rates, and healthy project execution. Continue current strategies while exploring expansion opportunities.";
    } else if (healthScore >= 70) {
      return "The company is performing well with solid fundamentals. Most operational areas are healthy, though there's room for optimization. Focus on the lower-scoring categories to push into the excellent range.";
    } else if (healthScore >= 55) {
      return "Overall performance is stable, but improvement is needed in key areas. Review the breakdown below to identify bottlenecks. Consider targeted interventions in underperforming categories.";
    } else if (healthScore >= 40) {
      return "The organization is experiencing challenges across multiple areas. Immediate attention is required to address SLA compliance, sales efficiency, and lead quality. Schedule a strategic review session.";
    } else {
      return "Critical: The organization is under significant stress. Immediate corrective action is recommended across all departments. Focus on stabilizing project delivery and improving lead conversion before scaling.";
    }
  }, [healthScore]);

  // === COLOR SCHEME ===
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-cyan-400';
    if (score >= 40) return 'text-amber-400';
    return 'text-red-400';
  };

  const getBarColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-cyan-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getGrade = (score: number) => {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B+';
    if (score >= 60) return 'B';
    if (score >= 50) return 'C';
    if (score >= 40) return 'D';
    return 'F';
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      {/* Main Score Display */}
      <div className="p-6 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${getBarColor(healthScore).replace('bg-', 'bg-')}/10`}>
              <Heart size={24} className={getScoreColor(healthScore)} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Company Health Score</h3>
              <p className="text-xs text-slate-500">Unified operational intelligence</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2">
              <span className={`text-4xl font-mono font-bold ${getScoreColor(healthScore)}`}>
                {healthScore}
              </span>
              <span className="text-2xl font-bold text-slate-600">/100</span>
            </div>
            <div className="flex items-center justify-end gap-2 mt-1">
              <span className={`text-xl font-bold px-2 py-0.5 rounded ${getBarColor(healthScore)}/20 ${getScoreColor(healthScore)}`}>
                {getGrade(healthScore)}
              </span>
              {trend === 'up' && (
                <span className="flex items-center text-xs text-emerald-400">
                  <TrendingUp size={14} className="mr-1" />
                  +{trendDelta.toFixed(0)}
                </span>
              )}
              {trend === 'down' && (
                <span className="flex items-center text-xs text-red-400">
                  <TrendingDown size={14} className="mr-1" />
                  {trendDelta.toFixed(0)}
                </span>
              )}
              {trend === 'stable' && (
                <span className="flex items-center text-xs text-slate-500">
                  <Minus size={14} className="mr-1" />
                  stable
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Health Meter */}
        <div className="relative h-4 bg-slate-800 rounded-full overflow-hidden mb-4">
          <div
            className={`absolute inset-y-0 left-0 ${getBarColor(healthScore)} rounded-full transition-all duration-1000 ease-out`}
            style={{ width: `${healthScore}%` }}
          />
          {/* Threshold markers */}
          <div className="absolute inset-y-0 left-[40%] w-px bg-slate-600" />
          <div className="absolute inset-y-0 left-[60%] w-px bg-slate-600" />
          <div className="absolute inset-y-0 left-[80%] w-px bg-slate-600" />
        </div>

        <div className="flex justify-between text-xs text-slate-600 mb-4">
          <span>Critical</span>
          <span>Fair</span>
          <span>Good</span>
          <span>Excellent</span>
        </div>

        {/* CEO Summary */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Activity size={16} className="text-slate-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-slate-300 leading-relaxed">{ceoSummary}</p>
          </div>
        </div>
      </div>

      {/* Expandable Breakdown */}
      <div className="border-t border-slate-800">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between px-6 py-3 hover:bg-slate-800/50 transition-colors"
        >
          <span className="text-sm font-medium text-slate-400">Score Breakdown</span>
          {expanded ? (
            <ChevronUp size={18} className="text-slate-500" />
          ) : (
            <ChevronDown size={18} className="text-slate-500" />
          )}
        </button>

        {expanded && (
          <div className="px-6 pb-6 space-y-3">
            <CategoryCard
              title="Lead Health"
              score={breakdown.leadHealth}
              maxScore={20}
              icon={Users}
              color="text-blue-400"
              details={leadHealthData.details}
            />
            <CategoryCard
              title="Sales Efficiency"
              score={breakdown.salesEfficiency}
              maxScore={20}
              icon={Target}
              color="text-purple-400"
              details={salesEfficiencyData.details}
            />
            <CategoryCard
              title="Project Health (SLA)"
              score={breakdown.projectHealth}
              maxScore={25}
              icon={Briefcase}
              color="text-cyan-400"
              details={projectHealthData.details}
            />
            <CategoryCard
              title="Revenue Strength"
              score={breakdown.revenueStrength}
              maxScore={20}
              icon={DollarSign}
              color="text-emerald-400"
              details={revenueStrengthData.details}
            />
            <CategoryCard
              title="Team Performance"
              score={breakdown.teamPerformance}
              maxScore={15}
              icon={UserCheck}
              color="text-amber-400"
              details={teamPerformanceData.details}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyHealthScore;
