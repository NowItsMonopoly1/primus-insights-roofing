
import React from 'react';
import type { PlanId } from "../types";
import { Lock } from 'lucide-react';

interface LockedFeatureProps {
  featureLabel: string;
  requiredPlan: PlanId;
  onUpgrade?: (required: PlanId) => void;
}

export function LockedFeature({ featureLabel, requiredPlan, onUpgrade }: LockedFeatureProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[300px] border border-slate-800 bg-slate-950/30 rounded-xl p-8 text-center animate-fade-in relative overflow-hidden group">
      
      {/* Background Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/50 to-transparent pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-solar-orange/5 blur-3xl rounded-full pointer-events-none"></div>

      <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center border-2 border-slate-800 mb-4 shadow-lg group-hover:border-solar-orange/50 transition-colors">
            <Lock size={32} className="text-slate-500 group-hover:text-solar-orange transition-colors" />
          </div>
          
          <h3 className="text-xl font-display font-bold text-slate-200 mb-2">
            {featureLabel} is Locked
          </h3>
          
          <p className="text-sm text-slate-400 max-w-xs mb-6">
            This advanced feature is available exclusively on the <strong className="text-white">{requiredPlan}</strong> plan and above.
          </p>
          
          {onUpgrade && (
            <button
              onClick={() => onUpgrade(requiredPlan)}
              className="px-6 py-2.5 bg-solar-orange hover:bg-orange-600 text-white text-sm font-bold rounded-lg shadow-lg shadow-orange-500/20 transition-all active:scale-95 flex items-center gap-2"
            >
              Upgrade to Unlock
            </button>
          )}
      </div>
    </div>
  );
}
