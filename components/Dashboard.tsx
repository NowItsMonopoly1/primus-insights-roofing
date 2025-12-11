
import React, { useEffect, useState } from 'react';
import { MOCK_CHART_DATA, SEED_LEADS, SEED_PROJECTS, SEED_COMMISSIONS } from '../constants';
import { DollarSign, Zap, Activity, Briefcase, TrendingUp, Sparkles, AlertTriangle, ArrowRight, Loader2, Trophy, Crown, Medal, Users, Clock, CheckCircle2, Target } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { loadOrDefault } from '../utils/storage';
import { BusinessInsight, Lead, Project, PlanId, Commission } from '../types';
import { generateBusinessInsights } from '../services/geminiService';
import { hasAccess } from '../utils/plan';
import RevenueForecast from './RevenueForecast';
import InstallerIntelligence from './InstallerIntelligence';
import CompanyHealthScore from './CompanyHealthScore';

const LEADS_KEY = "primus_leads";
const PROJECTS_KEY = "primus_projects";
const COMMISSIONS_KEY = "primus_commissions";

interface DashboardProps {
  onRequestUpgrade: (plan: PlanId) => void;
}

// KPI Card Component
const KPICard: React.FC<{ title: string; value: string | number; icon: React.ElementType; colorClass: string; alert?: boolean }> = ({ title, value, icon: Icon, colorClass, alert }) => (
  <div className={`bg-slate-900 border p-4 rounded-xl hover:border-slate-700 transition-all ${alert ? 'border-red-500/50' : 'border-slate-800'}`}>
    <div className="flex items-center gap-3">
      <div className={`p-2.5 rounded-lg ${colorClass.replace('text-', 'bg-').replace('-400', '-500/10')}`}>
        <Icon size={18} className={colorClass} />
      </div>
      <div>
        <p className="text-slate-500 text-xs uppercase tracking-wider font-medium">{title}</p>
        <p className={`text-2xl font-mono font-bold ${colorClass}`}>{value}</p>
      </div>
    </div>
  </div>
);

// Dashboard Card Widget
const DashboardCard: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all">
    <div className="flex items-center gap-2 mb-4">
      <Icon size={18} className="text-solar-orange" />
      <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide">{title}</h3>
    </div>
    {children}
  </div>
);

// Horizontal Bar Chart Component
const BarChart: React.FC<{ label: string; value: number; max: number; color: string }> = ({ label, value, max, color }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-xs">
      <span className="text-slate-400">{label}</span>
      <span className="text-slate-300 font-mono">{value}</span>
    </div>
    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
      <div
        className={`h-full ${color} rounded-full transition-all duration-500`}
        style={{ width: `${Math.max((value / max) * 100, 4)}%` }}
      />
    </div>
  </div>
);

const StatCard: React.FC<{ title: string; value: string; subtext: string; icon: React.ElementType; color: string }> = ({ title, value, subtext, icon: Icon, color }) => (
  <div className="glass-panel p-6 rounded-2xl shadow-lg border border-slate-800 hover:border-slate-700 transition-all group relative overflow-hidden">
    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
    <div className="flex justify-between items-start relative z-10">
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{title}</p>
        <h3 className="text-3xl font-display font-bold text-slate-100 mt-2">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl bg-slate-900 border border-slate-800 shadow-inner group-hover:scale-110 transition-transform ${color}`}>
        <Icon size={22} className="text-current" />
      </div>
    </div>
    <div className="mt-4 flex items-center text-sm relative z-10">
      <span className="text-green-400 font-bold flex items-center bg-green-500/10 px-2 py-0.5 rounded text-xs border border-green-500/20">
        <TrendingUp size={12} className="mr-1" /> {subtext}
      </span>
      <span className="text-slate-500 ml-2 text-xs">vs last month</span>
    </div>
  </div>
);

const LeaderboardWidget = () => {
    const leaders = [
        { name: 'Sarah Miller', score: 14500, deals: 8, avatar: 'bg-emerald-500' },
        { name: 'Mike Ross', score: 12200, deals: 6, avatar: 'bg-blue-500' },
        { name: 'Jessica Pearson', score: 9800, deals: 5, avatar: 'bg-purple-500' },
        { name: 'Harvey Specter', score: 8500, deals: 4, avatar: 'bg-orange-500' },
    ];

    return (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col h-full">
            <h3 className="text-lg font-bold text-slate-200 mb-6 flex items-center gap-2">
                <Trophy size={18} className="text-yellow-400"/> Team Leaderboard
            </h3>
            <div className="flex-1 space-y-4">
                {leaders.map((leader, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800/50">
                        <div className="w-8 h-8 flex items-center justify-center font-bold text-slate-500 text-sm">
                            {i === 0 ? <Crown size={18} className="text-yellow-400" /> : 
                             i === 1 ? <Medal size={18} className="text-slate-300" /> : 
                             i === 2 ? <Medal size={18} className="text-orange-400" /> : `#${i + 1}`}
                        </div>
                        <div className={`w-8 h-8 rounded-full ${leader.avatar} flex items-center justify-center text-xs font-bold text-white shadow-lg`}>
                            {leader.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-slate-200">{leader.name}</p>
                            <p className="text-xs text-slate-500">{leader.deals} Deals Closed</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-mono font-bold text-emerald-400">${(leader.score / 1000).toFixed(1)}k</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const Dashboard: React.FC<DashboardProps> = ({ onRequestUpgrade }) => {
  // Load real data from storage
  const [leads] = useState<Lead[]>(() => loadOrDefault(LEADS_KEY, SEED_LEADS));
  const [projects] = useState<Project[]>(() => loadOrDefault(PROJECTS_KEY, SEED_PROJECTS));
  const [commissions] = useState<any[]>(() => loadOrDefault(COMMISSIONS_KEY, SEED_COMMISSIONS));
  
  const [insights, setInsights] = useState<BusinessInsight[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);

  useEffect(() => {
    // Generate AI Insights on mount
    const fetchInsights = async () => {
        setLoadingInsights(true);
        const data = await generateBusinessInsights(leads, commissions);
        setInsights(data);
        setLoadingInsights(false);
    };
    fetchInsights();
  }, [leads.length, commissions.length]);

  const totalLeads = leads.length;
  const closedWon = leads.filter(l => l.status === 'CLOSED_WON').length;
  const activeProjects = projects.filter(p => p.stage !== 'PTO').length;
  const totalCommission = commissions.reduce((sum, c) => sum + (c.amountUsd || 0), 0);

  // Approximate Close Rate
  const closeRate = totalLeads > 0 ? Math.round((closedWon / totalLeads) * 100) : 0;

  // === KPI CALCULATIONS ===
  
  // New Leads This Week
  const newLeadsThisWeek = leads.filter((l) => {
    const created = new Date(l.createdAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return created >= weekAgo;
  }).length;

  // High Priority Leads
  const highPriorityCount = leads.filter((l) => l.priority === 'high').length;

  // Projects At Risk (SLA)
  const projectsAtRisk = projects.filter((p) => p.slaStatus === 'atRisk').length;
  const projectsLate = projects.filter((p) => p.slaStatus === 'late').length;
  const projectsOnTrack = projects.filter((p) => p.slaStatus === 'onTrack').length;

  // Revenue Earned This Month (Paid Commissions)
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const revenueThisMonth = commissions
    .filter((c) => {
      if (c.status !== 'PAID') return false;
      const paidAt = c.paidAt;
      if (!paidAt) return false;
      const paidDate = new Date(paidAt);
      return paidDate.getMonth() === currentMonth && paidDate.getFullYear() === currentYear;
    })
    .reduce((sum, c) => sum + (c.amountUsd || 0), 0);

  // Lead Pipeline Counts
  const pipelineCounts = {
    NEW: leads.filter(l => l.status === 'NEW').length,
    QUALIFIED: leads.filter(l => l.status === 'QUALIFIED').length,
    PROPOSAL_SENT: leads.filter(l => l.status === 'PROPOSAL_SENT').length,
    CLOSED_WON: leads.filter(l => l.status === 'CLOSED_WON').length,
    CLOSED_LOST: leads.filter(l => l.status === 'CLOSED_LOST').length,
  };
  const maxPipeline = Math.max(...Object.values(pipelineCounts), 1);

  // Commission Status Counts
  const commissionCounts = {
    PENDING: commissions.filter(c => c.status === 'PENDING').length,
    APPROVED: commissions.filter(c => c.status === 'APPROVED').length,
    PAID: commissions.filter(c => c.status === 'PAID').length,
  };
  const maxCommission = Math.max(...Object.values(commissionCounts), 1);

  // Recent Activity
  const recentLeads = [...leads]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const recentPayouts = commissions
    .filter(c => c.status === 'PAID' && c.paidAt)
    .sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-display font-bold text-slate-100">Solar Command Center</h2>
          <p className="text-slate-400 mt-1">Real-time pipeline & performance metrics.</p>
        </div>
        <div className="flex gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-xs font-mono text-slate-400">LIVE SYNC</span>
            </div>
            <button className="text-sm bg-solar-orange text-slate-900 font-bold px-4 py-2 rounded-lg hover:bg-orange-500 transition-all shadow-lg shadow-orange-500/20">
                + Add Lead
            </button>
        </div>
      </div>

      {/* Company Health Score - Executive Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CompanyHealthScore leads={leads} projects={projects} commissions={commissions} />
        </div>
        <div className="space-y-4">
          {/* Quick Stats */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Quick Pulse</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                <p className="text-2xl font-mono font-bold text-blue-400">{leads.length}</p>
                <p className="text-xs text-slate-500">Total Leads</p>
              </div>
              <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                <p className="text-2xl font-mono font-bold text-purple-400">{projects.length}</p>
                <p className="text-xs text-slate-500">Projects</p>
              </div>
              <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                <p className="text-2xl font-mono font-bold text-emerald-400">${(totalCommission/1000).toFixed(1)}k</p>
                <p className="text-xs text-slate-500">Commissions</p>
              </div>
              <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                <p className="text-2xl font-mono font-bold text-amber-400">{closeRate}%</p>
                <p className="text-xs text-slate-500">Close Rate</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KPICard 
          title="New Leads This Week" 
          value={newLeadsThisWeek.toString()} 
          icon={Users}
          colorClass="text-blue-400"
        />
        <KPICard 
          title="High Priority" 
          value={highPriorityCount.toString()} 
          icon={AlertTriangle}
          colorClass="text-red-400"
          alert={highPriorityCount > 3}
        />
        <KPICard 
          title="Active Projects" 
          value={activeProjects.toString()} 
          icon={Briefcase}
          colorClass="text-purple-400"
        />
        <KPICard 
          title="At Risk / Late" 
          value={`${projectsAtRisk} / ${projectsLate}`} 
          icon={Clock}
          colorClass="text-amber-400"
          alert={projectsAtRisk + projectsLate > 0}
        />
        <KPICard 
          title="Revenue This Month" 
          value={`$${(revenueThisMonth/1000).toFixed(1)}k`} 
          icon={DollarSign}
          colorClass="text-emerald-400"
        />
      </div>

      {/* Original Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Commissions" value={`$${(totalCommission/1000).toFixed(1)}k`} subtext="+12.5%" icon={DollarSign} color="text-emerald-400" />
        <StatCard title="Power Sold" value="145 kW" subtext="+45 kW" icon={Zap} color="text-solar-orange" />
        <StatCard title="Close Rate" value={`${closeRate}%`} subtext="+4%" icon={Activity} color="text-blue-400" />
        <StatCard title="Pipeline" value={totalLeads.toString()} subtext={`+${activeProjects} active projects`} icon={Briefcase} color="text-purple-400" />
      </div>

      {/* Analytics Widgets Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Lead Pipeline Widget */}
        <DashboardCard title="Lead Pipeline" icon={TrendingUp}>
          <div className="space-y-3">
            <BarChart label="New" value={pipelineCounts.NEW} max={maxPipeline} color="bg-blue-500" />
            <BarChart label="Qualified" value={pipelineCounts.QUALIFIED} max={maxPipeline} color="bg-cyan-500" />
            <BarChart label="Proposal Sent" value={pipelineCounts.PROPOSAL_SENT} max={maxPipeline} color="bg-purple-500" />
            <BarChart label="Closed Won" value={pipelineCounts.CLOSED_WON} max={maxPipeline} color="bg-emerald-500" />
            <BarChart label="Closed Lost" value={pipelineCounts.CLOSED_LOST} max={maxPipeline} color="bg-red-500" />
          </div>
        </DashboardCard>

        {/* Project SLA Status Widget */}
        <DashboardCard title="Project SLA Status" icon={Clock}>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-sm text-slate-300">On Track</span>
              </div>
              <span className="text-lg font-bold text-emerald-400">
                {projects.filter(p => p.slaStatus === 'onTrack' || !p.slaStatus).length}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span className="text-sm text-slate-300">At Risk</span>
              </div>
              <span className="text-lg font-bold text-amber-400">{projectsAtRisk}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-sm text-slate-300">Late</span>
              </div>
              <span className="text-lg font-bold text-red-400">{projectsLate}</span>
            </div>
          </div>
        </DashboardCard>

        {/* Commission Status Widget */}
        <DashboardCard title="Commission Status" icon={DollarSign}>
          <div className="space-y-3">
            <BarChart label="Pending" value={commissionCounts.PENDING} max={maxCommission} color="bg-amber-500" />
            <BarChart label="Approved" value={commissionCounts.APPROVED} max={maxCommission} color="bg-blue-500" />
            <BarChart label="Paid" value={commissionCounts.PAID} max={maxCommission} color="bg-emerald-500" />
          </div>
          <div className="mt-4 pt-4 border-t border-slate-700">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Pending Value</span>
              <span className="font-bold text-amber-400">
                ${commissions.filter(c => c.status === 'PENDING').reduce((s, c) => s + (c.amountUsd || 0), 0).toLocaleString()}
              </span>
            </div>
          </div>
        </DashboardCard>
      </div>

      {/* Recent Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <DashboardCard title="Recent Leads" icon={Users}>
          {recentLeads.length > 0 ? (
            <div className="space-y-2">
              {recentLeads.map(lead => (
                <div key={lead.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-slate-200">{lead.name}</p>
                    <p className="text-xs text-slate-500">{new Date(lead.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {lead.priority === 'high' && (
                      <span className="px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded">High</span>
                    )}
                    <span className={`px-2 py-0.5 text-xs rounded ${
                      lead.status === 'NEW' ? 'bg-blue-500/20 text-blue-400' :
                      lead.status === 'QUALIFIED' ? 'bg-cyan-500/20 text-cyan-400' :
                      lead.status === 'PROPOSAL_SENT' ? 'bg-purple-500/20 text-purple-400' :
                      lead.status === 'CLOSED_WON' ? 'bg-emerald-500/20 text-emerald-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {lead.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center py-4">No leads yet</p>
          )}
        </DashboardCard>

        {/* Recent Payouts */}
        <DashboardCard title="Recent Payouts" icon={DollarSign}>
          {recentPayouts.length > 0 ? (
            <div className="space-y-2">
              {recentPayouts.map(payout => (
                <div key={payout.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-slate-200">{payout.dealName}</p>
                    <p className="text-xs text-slate-500">{payout.paidAt ? new Date(payout.paidAt).toLocaleDateString() : ''}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-emerald-400">${payout.amountUsd?.toLocaleString()}</span>
                    {payout.payoutMethod && (
                      <span className="px-2 py-0.5 text-xs bg-slate-700 text-slate-300 rounded">
                        {payout.payoutMethod}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center py-4">No payouts yet</p>
          )}
        </DashboardCard>
      </div>

      {/* Revenue Forecast Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueForecast leads={leads} projects={projects} commissions={commissions} />
        </div>
        <div className="space-y-6">
          {/* Quick Forecast Summary */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h4 className="text-sm font-bold text-slate-300 mb-3">Pipeline Health</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Active Leads</span>
                <span className="text-sm font-mono text-blue-400">{leads.filter(l => l.status !== 'CLOSED_WON' && l.status !== 'CLOSED_LOST').length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">In Progress Projects</span>
                <span className="text-sm font-mono text-purple-400">{projects.filter(p => p.stage !== 'PTO').length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Pending Payouts</span>
                <span className="text-sm font-mono text-amber-400">{commissions.filter(c => c.status === 'PENDING' || c.status === 'APPROVED').length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                    <TrendingUp size={18} className="text-solar-orange"/> Commission Trajectory
                </h3>
            </div>
            <div style={{ width: '100%', height: 320, minWidth: 0 }}>
            <ResponsiveContainer width="99%" height="100%">
                <AreaChart data={MOCK_CHART_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="colorCommissions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#64748b', fontSize: 12}} 
                />
                <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#64748b', fontSize: 12}} 
                    tickFormatter={(value) => `$${value/1000}k`} 
                />
                <Tooltip 
                    contentStyle={{backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #334155', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'}}
                    itemStyle={{color: '#e2e8f0'}}
                    cursor={{ stroke: '#f59e0b', strokeWidth: 1, strokeDasharray: '5 5' }}
                />
                <Area 
                    type="monotone" 
                    dataKey="commissions" 
                    stroke="#f59e0b" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorCommissions)" 
                    activeDot={{ r: 6, strokeWidth: 0, fill: '#f59e0b' }}
                />
                </AreaChart>
            </ResponsiveContainer>
            </div>
          </div>

          {/* AI Insights Panel OR Leaderboard based on Plan */}
          <div className="flex flex-col gap-6">
              {/* Leaderboard - A Gold Standard Feature */}
              <LeaderboardWidget />

              {/* Insights */}
              <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col flex-1 min-h-[250px]">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                        <Sparkles size={18} className="text-blue-400"/> Strategic Briefing
                    </h3>
                  </div>
                  
                  <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                     {loadingInsights ? (
                         <div className="flex flex-col items-center justify-center h-full text-slate-500">
                             <Loader2 size={24} className="animate-spin mb-2" />
                             <p className="text-xs">Generating strategy...</p>
                         </div>
                     ) : insights.length > 0 ? (
                        insights.map(insight => (
                            <div key={insight.id} className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 hover:bg-slate-800/50 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider
                                        ${insight.type === 'OPPORTUNITY' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                                          insight.type === 'RISK' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                                          'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                                        {insight.type}
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-mono">Impact: {insight.impactScore}/10</span>
                                </div>
                                <h4 className="text-sm font-bold text-slate-200 mb-1">{insight.title}</h4>
                                <p className="text-xs text-slate-400 mb-3">{insight.description}</p>
                                <div className="flex items-center gap-2 text-xs text-solar-orange font-bold bg-solar-orange/5 p-2 rounded">
                                    <ArrowRight size={12} />
                                    {insight.actionItem}
                                </div>
                            </div>
                        ))
                     ) : (
                         <div className="text-center text-slate-500 text-sm py-10">
                             No insights available.
                         </div>
                     )}
                  </div>
              </div>
          </div>
      </div>

      {/* Installer Intelligence Dashboard */}
      <InstallerIntelligence projects={projects} />
    </div>
  );
};

export default Dashboard;
