/**
 * Revenue Forecast Panel
 * Displays predictive revenue analytics with 30/60/90 day projections
 */

import React, { useMemo } from 'react';
import { TrendingUp, DollarSign, Calendar, Target, Users, AlertTriangle } from 'lucide-react';
import { Lead, Project, Commission } from '../types';
import { computeRevenueForecast, getConfidenceLabel, RevenueForecast as ForecastData } from '../services/revenueEngine';

interface RevenueForecastProps {
  leads: Lead[];
  projects: Project[];
  commissions: Commission[];
}

// Simple horizontal bar for breakdowns
const MiniBar: React.FC<{ label: string; value: number; max: number; color: string }> = ({ label, value, max, color }) => (
  <div className="flex items-center gap-2 text-xs">
    <span className="text-slate-500 w-20 truncate">{label}</span>
    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
      <div 
        className={`h-full ${color} rounded-full`} 
        style={{ width: `${Math.max((value / max) * 100, 5)}%` }} 
      />
    </div>
    <span className="text-slate-400 w-16 text-right font-mono">${(value/1000).toFixed(1)}k</span>
  </div>
);

// Confidence meter
const ConfidenceMeter: React.FC<{ confidence: number }> = ({ confidence }) => {
  const { label, color } = getConfidenceLabel(confidence);
  const barColor = confidence >= 80 ? 'bg-emerald-500' : confidence >= 50 ? 'bg-amber-500' : 'bg-red-500';
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-slate-400 text-xs">Forecast Confidence</span>
        <span className={`text-xs font-bold ${color}`}>{label} ({confidence}%)</span>
      </div>
      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
        <div 
          className={`h-full ${barColor} rounded-full transition-all duration-500`} 
          style={{ width: `${confidence}%` }} 
        />
      </div>
    </div>
  );
};

// Revenue card
const RevenueCard: React.FC<{ label: string; value: number; icon: React.ElementType; highlight?: boolean }> = ({ 
  label, value, icon: Icon, highlight 
}) => (
  <div className={`p-4 rounded-xl border ${highlight ? 'bg-solar-orange/10 border-solar-orange/30' : 'bg-slate-800/50 border-slate-700/50'}`}>
    <div className="flex items-center gap-2 mb-2">
      <Icon size={14} className={highlight ? 'text-solar-orange' : 'text-slate-500'} />
      <span className="text-xs text-slate-400 uppercase tracking-wide">{label}</span>
    </div>
    <p className={`text-2xl font-mono font-bold ${highlight ? 'text-solar-orange' : 'text-slate-100'}`}>
      ${value >= 1000 ? `${(value/1000).toFixed(1)}k` : value.toLocaleString()}
    </p>
  </div>
);

const RevenueForecast: React.FC<RevenueForecastProps> = ({ leads, projects, commissions }) => {
  // Compute forecast
  const forecast = useMemo<ForecastData>(() => {
    return computeRevenueForecast(leads, projects, commissions);
  }, [leads, projects, commissions]);

  // Get max values for bar charts
  const maxStageValue = Math.max(...Object.values(forecast.breakdown.byStage), 1);
  const maxRepValue = Math.max(...Object.values(forecast.breakdown.byRep), 1);
  const maxPriorityValue = Math.max(...Object.values(forecast.breakdown.byPriority), 1);

  // Stage colors
  const stageColors: Record<string, string> = {
    NEW: 'bg-blue-500',
    QUALIFIED: 'bg-cyan-500',
    PROPOSAL_SENT: 'bg-purple-500',
    CLOSED_WON: 'bg-emerald-500',
    SITE_SURVEY: 'bg-amber-500',
    DESIGN: 'bg-orange-500',
    PERMITTING: 'bg-pink-500',
    INSTALL: 'bg-green-500',
    INSPECTION: 'bg-teal-500',
    PTO: 'bg-emerald-400',
  };

  // Priority colors
  const priorityColors: Record<string, string> = {
    high: 'bg-red-500',
    medium: 'bg-amber-500',
    low: 'bg-slate-500',
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-solar-orange/10 rounded-xl">
            <TrendingUp size={20} className="text-solar-orange" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">Revenue Forecast</h3>
            <p className="text-xs text-slate-500">Predictive analytics based on pipeline</p>
          </div>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-xs text-emerald-400">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
          </span>
          <span className="font-mono">LIVE</span>
        </div>
      </div>

      {/* Revenue Projections */}
      <div className="grid grid-cols-3 gap-3">
        <RevenueCard label="30-Day" value={forecast.revenue30} icon={Calendar} />
        <RevenueCard label="60-Day" value={forecast.revenue60} icon={Calendar} highlight />
        <RevenueCard label="90-Day" value={forecast.revenue90} icon={Calendar} />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign size={14} className="text-purple-400" />
            <span className="text-xs text-slate-400">Expected Commissions</span>
          </div>
          <p className="text-xl font-mono font-bold text-purple-300">
            ${forecast.expectedCommissions.toLocaleString()}
          </p>
        </div>
        <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <Target size={14} className="text-cyan-400" />
            <span className="text-xs text-slate-400">Expected Installs</span>
          </div>
          <p className="text-xl font-mono font-bold text-cyan-300">
            {forecast.expectedInstalls} <span className="text-sm text-slate-500">projects</span>
          </p>
        </div>
      </div>

      {/* Confidence Meter */}
      <ConfidenceMeter confidence={forecast.confidence} />

      {/* Breakdowns */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        {/* By Stage */}
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
            <AlertTriangle size={12} /> Revenue by Stage
          </h4>
          <div className="space-y-2">
            {Object.entries(forecast.breakdown.byStage)
              .filter(([_, value]) => value > 0)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([stage, value]) => (
                <MiniBar 
                  key={stage} 
                  label={stage.replace('_', ' ')} 
                  value={value} 
                  max={maxStageValue}
                  color={stageColors[stage] || 'bg-slate-500'}
                />
              ))}
          </div>
        </div>

        {/* By Rep */}
        {Object.keys(forecast.breakdown.byRep).length > 0 && (
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Users size={12} /> Revenue by Rep
            </h4>
            <div className="space-y-2">
              {Object.entries(forecast.breakdown.byRep)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 4)
                .map(([rep, value]) => (
                  <MiniBar 
                    key={rep} 
                    label={rep} 
                    value={value} 
                    max={maxRepValue}
                    color="bg-blue-500"
                  />
                ))}
            </div>
          </div>
        )}

        {/* By Priority */}
        {Object.keys(forecast.breakdown.byPriority).length > 0 && (
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Target size={12} /> Revenue by Priority
            </h4>
            <div className="space-y-2">
              {Object.entries(forecast.breakdown.byPriority)
                .sort((a, b) => b[1] - a[1])
                .map(([priority, value]) => (
                  <MiniBar 
                    key={priority} 
                    label={priority.charAt(0).toUpperCase() + priority.slice(1)} 
                    value={value} 
                    max={maxPriorityValue}
                    color={priorityColors[priority] || 'bg-slate-500'}
                  />
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RevenueForecast;
