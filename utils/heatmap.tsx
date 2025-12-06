import React from 'react';
import type { SolarAnalysis } from "../types";

export function generateSolarHeatmap(analysis: SolarAnalysis) {
  const score = analysis.viabilityScore;
  // Inverse relation: High sun hours = low shading
  const shading = Math.max(
    0,
    100 - (analysis.sunHoursPerDay / 6.5) * 100
  );

  const panelCount = Math.floor(analysis.usableAreaSqft / 17.6);

  // Gradient color based on score
  const color =
    score > 90
      ? "#10b981" // emerald-500
      : score > 75
      ? "#34d399" // emerald-400
      : score > 60
      ? "#facc15" // yellow-400
      : "#f97316"; // orange-500

  return (
    <div className="mt-4 mb-4">
      <div className="relative w-full h-24 rounded-xl overflow-hidden border border-slate-700 bg-slate-900 shadow-inner group">
        <svg className="w-full h-full" preserveAspectRatio="none">
            <defs>
            <linearGradient id="roofGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0f172a" stopOpacity="0.8" />
                <stop offset="50%" stopColor={color} stopOpacity="0.6" />
                <stop offset="100%" stopColor="#0f172a" stopOpacity="0.8" />
            </linearGradient>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
            </pattern>
            </defs>
            
            {/* Background Grid */}
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* Heatmap Gradient */}
            <rect width="100%" height="100%" fill="url(#roofGrad)" />

            {/* Shading Overlay (simulated trees/obstacles) */}
            <rect 
                x="0" 
                y="0" 
                width={`${shading}%`} 
                height="100%" 
                fill="url(#grid)" 
                className="opacity-50"
            >
                <animate attributeName="opacity" values="0.3;0.5;0.3" dur="4s" repeatCount="indefinite" />
            </rect>
        </svg>
        
        {/* Overlay Text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-slate-950/60 backdrop-blur-sm px-3 py-1 rounded-full border border-slate-700/50">
                <span className="text-[10px] font-mono font-bold text-emerald-400 tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    IRRADIANCE MAP
                </span>
            </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center text-[11px] text-slate-500 font-mono mt-2 px-1">
        <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-sm" style={{backgroundColor: color}}></span>
            <span>Est. Capacity: <strong className="text-slate-300">{panelCount} Panels</strong></span>
        </div>
        <span>Shading Impact: <strong className={`${shading > 20 ? 'text-red-400' : 'text-slate-300'}`}>{shading.toFixed(0)}%</strong></span>
      </div>
    </div>
  );
}