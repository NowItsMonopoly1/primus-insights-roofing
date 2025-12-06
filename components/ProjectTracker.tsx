import React, { useEffect, useState } from "react";
import { loadOrDefault, save } from "../utils/storage";
import { PROJECT_STAGES, STAGE_LABELS, SEED_PROJECTS, generateMilestoneCommissions, SEED_COMMISSIONS } from "../constants";
import type { Project, Commission } from "../types";
import { HardHat, CheckCircle2, ChevronRight, Activity } from "lucide-react";

const PROJECTS_KEY = "primus_projects";
const COMMISSIONS_KEY = "primus_commissions";

export const ProjectTracker = () => {
  const [projects, setProjects] = useState<Project[]>(() =>
    loadOrDefault<Project[]>(PROJECTS_KEY, SEED_PROJECTS)
  );

  useEffect(() => {
    save(PROJECTS_KEY, projects);
  }, [projects]);

  const advanceStage = (p: Project) => {
    const idx = PROJECT_STAGES.indexOf(p.stage);
    if (idx === -1 || idx === PROJECT_STAGES.length - 1) return;
    const nextStage = PROJECT_STAGES[idx + 1];
    const updated: Project = {
      ...p,
      stage: nextStage,
      lastUpdated: new Date().toISOString().slice(0, 10),
    };

    const newProjects = projects.map((proj) =>
      proj.id === p.id ? updated : proj
    );
    setProjects(newProjects);

    // When we reach PTO, generate milestone commissions if not already in store
    if (nextStage === "PTO") {
      const existingCommissions = loadOrDefault<Commission[]>(COMMISSIONS_KEY, SEED_COMMISSIONS);
      // Check if PTO commission already exists for this project to avoid dups (simplified check)
      const hasPto = existingCommissions.some(c => c.leadId === p.leadId && c.milestone === "PTO");
      
      if (!hasPto) {
        const newComms = generateMilestoneCommissions(updated);
        save(COMMISSIONS_KEY, [...existingCommissions, ...newComms]);
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
       <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-display font-bold text-slate-100 flex items-center gap-3">
             <HardHat className="text-solar-orange" />
             Project Tracker
          </h2>
          <p className="text-slate-400 mt-1">Track installations from Site Survey to PTO.</p>
        </div>
      </div>

      <div className="glass-panel border border-slate-800 rounded-xl overflow-hidden">
        {projects.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            <Activity className="mx-auto mb-3 opacity-50" size={32} />
            <p>No active projects yet. Close a deal to create one.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/50">
            {projects.map((p) => (
              <div key={p.id} className="p-6 hover:bg-slate-800/20 transition-colors">
                <div className="flex justify-between items-start mb-4">
                   <div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-slate-500 border border-slate-700 rounded px-1.5 py-0.5">{p.id}</span>
                        <h3 className="text-lg font-bold text-slate-200">System Installation</h3>
                      </div>
                      <div className="text-sm text-slate-400 mt-1 flex items-center gap-2">
                        <span>{p.kW.toFixed(1)} kW System</span>
                        <span className="text-slate-700">•</span>
                        <span>Updated {p.lastUpdated}</span>
                      </div>
                   </div>
                   <button
                    className="secondary-btn text-xs"
                    onClick={() => advanceStage(p)}
                    disabled={p.stage === "PTO"}
                  >
                    {p.stage === "PTO" ? (
                        <>
                            <CheckCircle2 size={14} className="text-emerald-500" />
                            Complete
                        </>
                    ) : (
                        <>
                            Advance Stage
                            <ChevronRight size={14} />
                        </>
                    )}
                  </button>
                </div>

                <div className="relative mt-6">
                  {/* Progress Bar Background */}
                  <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-800 -translate-y-1/2 rounded-full z-0"></div>
                  
                  {/* Progress Bar Fill */}
                  <div 
                    className="absolute top-1/2 left-0 h-1 bg-emerald-500/50 -translate-y-1/2 rounded-full z-0 transition-all duration-500"
                    style={{ 
                        width: `${(PROJECT_STAGES.indexOf(p.stage) / (PROJECT_STAGES.length - 1)) * 100}%` 
                    }}
                  ></div>

                  <div className="relative z-10 flex justify-between">
                    {PROJECT_STAGES.map((st, idx) => {
                      const isCompleted = PROJECT_STAGES.indexOf(st) <= PROJECT_STAGES.indexOf(p.stage);
                      const isCurrent = st === p.stage;
                      
                      return (
                        <div key={st} className="flex flex-col items-center gap-2 group">
                          <div 
                            className={`w-3 h-3 rounded-full border-2 transition-all duration-300 ${
                              isCompleted 
                                ? 'bg-emerald-500 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' 
                                : 'bg-slate-900 border-slate-700'
                            }`}
                          ></div>
                          <span 
                            className={`text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 ${
                              isCurrent ? 'text-emerald-400' : isCompleted ? 'text-slate-400' : 'text-slate-600'
                            }`}
                          >
                            {STAGE_LABELS[st]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
