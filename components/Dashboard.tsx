
import React, { useEffect, useState } from 'react';
import { MOCK_CHART_DATA, SEED_LEADS, SEED_PROJECTS } from '../constants';
import { DollarSign, Zap, Activity, Briefcase, TrendingUp, Sparkles, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { loadOrDefault } from '../utils/storage';
import { BusinessInsight, Lead, Project } from '../types';
import { generateBusinessInsights } from '../services/geminiService';

const LEADS_KEY = "primus_leads";
const PROJECTS_KEY = "primus_projects";
const COMMISSIONS_KEY = "primus_commissions";

const StatCard: React.FC<{ title: string; value: string; subtext: string; icon: React.ElementType; color: string }> = ({ title, value, subtext, icon: Icon, color }) => (
  <div className="glass-panel p-4 md:p-6 rounded-2xl shadow-lg border border-slate-800 hover:border-slate-700 transition-all group relative overflow-hidden">
    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
    <div className="flex justify-between items-start relative z-10">
      <div>
        <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">{title}</p>
        <h3 className="text-xl md:text-3xl font-display font-bold text-slate-100 mt-1 md:mt-2">{value}</h3>
      </div>
      <div className={`p-2 md:p-3 rounded-xl bg-slate-900 border border-slate-800 shadow-inner group-hover:scale-110 transition-transform ${color}`}>
        <Icon size={18} className="text-current md:w-[22px] md:h-[22px]" />
      </div>
    </div>
    <div className="mt-2 md:mt-4 flex items-center text-sm relative z-10">
      <span className="text-green-400 font-bold flex items-center bg-green-500/10 px-1.5 md:px-2 py-0.5 rounded text-[10px] md:text-xs border border-green-500/20">
        <TrendingUp size={10} className="mr-1" /> {subtext}
      </span>
      <span className="text-slate-500 ml-2 text-[10px] md:text-xs hidden sm:inline">vs last month</span>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  // Load real data from storage
  const [leads] = useState<Lead[]>(() => loadOrDefault(LEADS_KEY, SEED_LEADS));
  const [projects] = useState<Project[]>(() => loadOrDefault(PROJECTS_KEY, SEED_PROJECTS));
  const [commissions] = useState<any[]>(() => loadOrDefault(COMMISSIONS_KEY, []));
  
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
  const activeProjects = projects.length;
  const totalCommission = commissions.reduce((sum, c) => sum + c.amountUsd, 0);

  // Approximate Close Rate
  const closeRate = totalLeads > 0 ? Math.round((closedWon / totalLeads) * 100) : 0;

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-100">Solar Command Center</h2>
          <p className="text-slate-400 mt-1 text-sm md:text-base">Real-time pipeline & performance metrics.</p>
        </div>
        <div className="flex gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg">
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

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <StatCard title="Total Commissions" value={`$${(totalCommission/1000).toFixed(1)}k`} subtext="+12.5%" icon={DollarSign} color="text-emerald-400" />
        <StatCard title="Power Sold" value="145 kW" subtext="+45 kW" icon={Zap} color="text-solar-orange" />
        <StatCard title="Close Rate" value={`${closeRate}%`} subtext="+4%" icon={Activity} color="text-blue-400" />
        <StatCard title="Pipeline" value={totalLeads.toString()} subtext={`+${activeProjects} active projects`} icon={Briefcase} color="text-purple-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Main Chart */}
          <div className="lg:col-span-2 glass-panel p-4 md:p-6 rounded-2xl border border-slate-800">
            <div className="flex justify-between items-center mb-4 md:mb-6">
                <h3 className="text-base md:text-lg font-bold text-slate-200 flex items-center gap-2">
                    <TrendingUp size={16} className="text-solar-orange md:w-[18px] md:h-[18px]"/> Commission Trajectory
                </h3>
            </div>
            <div style={{ width: '100%', height: 'auto', minWidth: 0 }} className="h-48 md:h-80">
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

          {/* AI Insights Panel */}
          <div className="glass-panel p-4 md:p-6 rounded-2xl border border-slate-800 flex flex-col">
              <div className="flex justify-between items-center mb-4 md:mb-6">
                <h3 className="text-base md:text-lg font-bold text-slate-200 flex items-center gap-2">
                    <Sparkles size={16} className="text-blue-400 md:w-[18px] md:h-[18px]"/> Strategic Briefing
                </h3>
              </div>
              
              <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                 {loadingInsights ? (
                     <div className="flex flex-col items-center justify-center h-48 text-slate-500">
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
                         No insights available. Add more leads to generate strategy.
                     </div>
                 )}
              </div>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;
