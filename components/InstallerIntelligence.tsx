/**
 * Installer Intelligence Dashboard
 * Operational analytics for installer performance, bottlenecks, and forecasting
 */

import React, { useMemo } from 'react';
import { Wrench, AlertTriangle, Clock, TrendingUp, Users, Target, CheckCircle2, Calendar } from 'lucide-react';
import { Project } from '../types';

interface InstallerIntelligenceProps {
  projects: Project[];
}

interface InstallerStats {
  installer: string;
  total: number;
  completed: number;
  onTrack: number;
  atRisk: number;
  late: number;
  avgInstallTime: number;
  avgPTOTime: number;
  slaScore: number;
}

interface ForecastedInstall {
  id: string;
  predictedDate: Date;
  stage: string;
  slaStatus?: string;
  installer: string;
}

// Compute average duration between stages
const computeAvgStageDuration = (
  projects: Project[],
  fromStage: string,
  toStage: string = 'PTO'
): number => {
  const durations = projects
    .map((p) => {
      const startDate = p.actualDates?.[fromStage];
      const endDate = p.actualDates?.[toStage];
      if (!startDate || !endDate) return null;
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
      
      return (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    })
    .filter((d): d is number => d !== null && d >= 0);

  if (durations.length === 0) return 0;
  return Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
};

// Compute stage-to-stage duration
const computeStageDuration = (
  projects: Project[],
  stage: string
): number => {
  const stageOrder = ['SITE_SURVEY', 'DESIGN', 'PERMITTING', 'INSTALL', 'INSPECTION', 'PTO'];
  const stageIndex = stageOrder.indexOf(stage);
  const nextStage = stageOrder[stageIndex + 1];
  
  if (!nextStage) return 0;

  const durations = projects
    .map((p) => {
      const startDate = p.actualDates?.[stage];
      const endDate = p.actualDates?.[nextStage];
      if (!startDate || !endDate) return null;
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
      
      const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      return diff >= 0 ? diff : null;
    })
    .filter((d): d is number => d !== null);

  if (durations.length === 0) return 0;
  return Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
};

// Mini bar component
const MiniBar: React.FC<{ value: number; max: number; color: string; label: string }> = ({ 
  value, max, color, label 
}) => (
  <div className="space-y-1">
    <div className="flex justify-between text-xs">
      <span className="text-slate-400">{label}</span>
      <span className="text-slate-300 font-mono">{value} days</span>
    </div>
    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
      <div
        className={`h-full ${color} rounded-full transition-all duration-500`}
        style={{ width: `${Math.min((value / max) * 100, 100)}%` }}
      />
    </div>
  </div>
);

// Status badge
const StatusBadge: React.FC<{ status: string; count: number }> = ({ status, count }) => {
  const styles: Record<string, string> = {
    onTrack: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    atRisk: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    late: 'bg-red-500/10 text-red-400 border-red-500/20',
  };
  
  return (
    <span className={`px-2 py-0.5 text-xs font-mono rounded border ${styles[status] || styles.onTrack}`}>
      {count}
    </span>
  );
};

const InstallerIntelligence: React.FC<InstallerIntelligenceProps> = ({ projects }) => {
  // === INSTALLER STATS ===
  const installerStats = useMemo<InstallerStats[]>(() => {
    const installers = Array.from(
      new Set(projects.map((p) => (p as any).installerName || 'Unassigned'))
    );

    return installers.map((installer) => {
      const list = projects.filter(
        (p) => ((p as any).installerName || 'Unassigned') === installer
      );

      const completed = list.filter((p) => p.stage === 'PTO').length;
      const onTrack = list.filter((p) => p.slaStatus === 'onTrack' || !p.slaStatus).length;
      const atRisk = list.filter((p) => p.slaStatus === 'atRisk').length;
      const late = list.filter((p) => p.slaStatus === 'late').length;
      
      // SLA score: weighted performance
      const slaScore = list.length > 0 
        ? Math.round(((onTrack * 100) + (atRisk * 50) + (late * 0)) / list.length)
        : 0;

      return {
        installer,
        total: list.length,
        completed,
        onTrack,
        atRisk,
        late,
        avgInstallTime: computeAvgStageDuration(list, 'SITE_SURVEY', 'INSTALL'),
        avgPTOTime: computeAvgStageDuration(list, 'INSTALL', 'PTO'),
        slaScore,
      };
    }).sort((a, b) => b.slaScore - a.slaScore); // Sort by performance
  }, [projects]);

  // === BOTTLENECK ANALYSIS ===
  const stageAverages = useMemo(() => {
    return {
      'Site Survey': computeStageDuration(projects, 'SITE_SURVEY'),
      'Design': computeStageDuration(projects, 'DESIGN'),
      'Permitting': computeStageDuration(projects, 'PERMITTING'),
      'Install': computeStageDuration(projects, 'INSTALL'),
      'Inspection': computeStageDuration(projects, 'INSPECTION'),
    };
  }, [projects]);

  const maxStageDuration = Math.max(...Object.values(stageAverages), 1);
  const bottleneckStage = Object.entries(stageAverages).reduce(
    (max, [stage, days]) => (days > max.days ? { stage, days } : max),
    { stage: '', days: 0 }
  );

  // === INSTALL FORECAST ===
  const forecastedInstalls = useMemo<ForecastedInstall[]>(() => {
    return projects
      .filter((p) => p.stage !== 'PTO')
      .map((p) => {
        const baseDate = new Date(p.targetDates?.INSTALL || p.targetDates?.PTO || Date.now());
        const penalty = p.slaStatus === 'atRisk' ? 4 : p.slaStatus === 'late' ? 10 : 0;
        
        return {
          id: p.id,
          predictedDate: new Date(baseDate.getTime() + penalty * 86400000),
          stage: p.stage,
          slaStatus: p.slaStatus,
          installer: (p as any).installerName || 'Unassigned',
        };
      })
      .sort((a, b) => a.predictedDate.getTime() - b.predictedDate.getTime());
  }, [projects]);

  // Projects expected this month
  const thisMonth = new Date();
  const installsThisMonth = forecastedInstalls.filter((f) => {
    return f.predictedDate.getMonth() === thisMonth.getMonth() &&
           f.predictedDate.getFullYear() === thisMonth.getFullYear();
  });

  // === OPERATIONAL RISKS ===
  const totalAtRisk = projects.filter((p) => p.slaStatus === 'atRisk').length;
  const totalLate = projects.filter((p) => p.slaStatus === 'late').length;
  const totalActive = projects.filter((p) => p.stage !== 'PTO').length;

  // Risk by installer
  const riskByInstaller = installerStats
    .filter((s) => s.atRisk > 0 || s.late > 0)
    .sort((a, b) => (b.atRisk + b.late) - (a.atRisk + a.late));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-500/10 rounded-xl">
            <Wrench size={20} className="text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">Installer Intelligence</h3>
            <p className="text-xs text-slate-500">Operational performance & forecasting</p>
          </div>
        </div>
        <div className="text-xs text-slate-500 font-mono">
          {totalActive} active projects
        </div>
      </div>

      {/* Installer Leaderboard */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users size={16} className="text-blue-400" />
          <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wide">Installer Leaderboard</h4>
        </div>

        {installerStats.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs text-slate-500 border-b border-slate-800">
                  <th className="pb-2 font-medium">Installer</th>
                  <th className="pb-2 font-medium text-center">Total</th>
                  <th className="pb-2 font-medium text-center">Done</th>
                  <th className="pb-2 font-medium text-center">Status</th>
                  <th className="pb-2 font-medium text-center">Avg Install</th>
                  <th className="pb-2 font-medium text-center">SLA Score</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {installerStats.map((stat, idx) => (
                  <tr 
                    key={stat.installer} 
                    className={`border-b border-slate-800/50 ${idx === 0 ? 'bg-emerald-500/5' : ''}`}
                  >
                    <td className="py-3 text-slate-200 font-medium">
                      <div className="flex items-center gap-2">
                        {idx === 0 && <span className="text-yellow-400">🏆</span>}
                        {stat.installer}
                      </div>
                    </td>
                    <td className="py-3 text-center text-slate-400 font-mono">{stat.total}</td>
                    <td className="py-3 text-center text-emerald-400 font-mono">{stat.completed}</td>
                    <td className="py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <StatusBadge status="onTrack" count={stat.onTrack} />
                        <StatusBadge status="atRisk" count={stat.atRisk} />
                        <StatusBadge status="late" count={stat.late} />
                      </div>
                    </td>
                    <td className="py-3 text-center text-blue-400 font-mono">
                      {stat.avgInstallTime > 0 ? `${stat.avgInstallTime}d` : '—'}
                    </td>
                    <td className="py-3 text-center">
                      <span className={`font-mono font-bold ${
                        stat.slaScore >= 80 ? 'text-emerald-400' :
                        stat.slaScore >= 50 ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {stat.slaScore}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500 text-center py-4">No installer data available</p>
        )}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bottleneck Analysis */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-amber-400" />
              <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wide">Bottleneck Analysis</h4>
            </div>
            {bottleneckStage.stage && (
              <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-1 rounded border border-amber-500/20">
                Slowest: {bottleneckStage.stage}
              </span>
            )}
          </div>

          <div className="space-y-3">
            {Object.entries(stageAverages).map(([stage, days]) => {
              const isBottleneck = stage === bottleneckStage.stage && days > 0;
              return (
                <MiniBar
                  key={stage}
                  label={stage}
                  value={days}
                  max={maxStageDuration}
                  color={isBottleneck ? 'bg-amber-500' : 'bg-slate-600'}
                />
              );
            })}
          </div>

          {maxStageDuration === 0 && (
            <p className="text-xs text-slate-500 text-center mt-4">
              Not enough completed stages for analysis
            </p>
          )}
        </div>

        {/* Install Forecast */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-cyan-400" />
              <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wide">Install Forecast</h4>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              {installsThisMonth.length} this month
            </span>
          </div>

          {forecastedInstalls.length > 0 ? (
            <div className="space-y-2">
              {forecastedInstalls.slice(0, 5).map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg border border-slate-700/50"
                >
                  <div>
                    <p className="text-sm text-slate-300">Project {f.id.slice(0, 8)}...</p>
                    <p className="text-xs text-slate-500">{f.installer} • {f.stage}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono text-cyan-400">
                      {f.predictedDate.toLocaleDateString()}
                    </p>
                    {f.slaStatus && f.slaStatus !== 'onTrack' && (
                      <span className={`text-xs ${
                        f.slaStatus === 'atRisk' ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {f.slaStatus === 'atRisk' ? '+4d penalty' : '+10d penalty'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center py-4">All projects completed</p>
          )}
        </div>
      </div>

      {/* Operational Risk Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={16} className="text-red-400" />
          <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wide">Operational Risks</h4>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <p className="text-xs text-slate-500 mb-1">Active Projects</p>
            <p className="text-2xl font-mono font-bold text-slate-200">{totalActive}</p>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
            <p className="text-xs text-slate-500 mb-1">On Track</p>
            <p className="text-2xl font-mono font-bold text-emerald-400">
              {totalActive - totalAtRisk - totalLate}
            </p>
          </div>
          <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
            <p className="text-xs text-slate-500 mb-1">At Risk</p>
            <p className="text-2xl font-mono font-bold text-amber-400">{totalAtRisk}</p>
          </div>
          <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
            <p className="text-xs text-slate-500 mb-1">Late</p>
            <p className="text-2xl font-mono font-bold text-red-400">{totalLate}</p>
          </div>
        </div>

        {/* Risk by Installer */}
        {riskByInstaller.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-800">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-3">Risk by Installer</p>
            <div className="space-y-2">
              {riskByInstaller.slice(0, 3).map((stat) => (
                <div
                  key={stat.installer}
                  className="flex items-center justify-between p-2 bg-slate-800/30 rounded"
                >
                  <span className="text-sm text-slate-300">{stat.installer}</span>
                  <div className="flex items-center gap-2">
                    {stat.atRisk > 0 && (
                      <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded">
                        {stat.atRisk} at risk
                      </span>
                    )}
                    {stat.late > 0 && (
                      <span className="text-xs bg-red-500/10 text-red-400 px-2 py-0.5 rounded">
                        {stat.late} late
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {totalAtRisk === 0 && totalLate === 0 && (
          <div className="flex items-center justify-center gap-2 p-4 bg-emerald-500/5 rounded-lg border border-emerald-500/20">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span className="text-sm text-emerald-400">All projects on track!</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstallerIntelligence;
