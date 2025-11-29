"use client";

import { Activity } from "lucide-react";

export default function Header() {
  return (
    <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
              <span className="text-emerald-400 font-bold text-lg">PH</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-100 tracking-tight">
                Primus Home Pro
              </h1>
              <p className="text-xs text-slate-500 font-mono">v1.0</p>
            </div>
          </div>

          {/* Right: Status */}
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-sm text-emerald-400 font-mono hidden sm:inline">
              Powered by Primus OS
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
