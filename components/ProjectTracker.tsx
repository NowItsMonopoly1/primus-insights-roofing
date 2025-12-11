
import React, { useEffect, useState } from "react";
import { loadOrDefault, save } from "../utils/storage";
import { PROJECT_STAGES, STAGE_LABELS, SEED_PROJECTS, generateMilestoneCommissions, SEED_COMMISSIONS } from "../constants";
import type { Project, Commission, PlanId, ProjectStage } from "../types";
import { HardHat, CheckCircle2, ChevronRight, Activity, Clock, AlertTriangle, AlertCircle, Settings } from "lucide-react";
import { loadPipeline, PipelineStage, getStageDisplayName } from "../services/pipelineConfig";
import { loadSLA, calculateSLAStatus, getSLARuleForStage, getTotalPipelineDays, SLAStatus } from "../services/slaRules";
import { getActiveCompanyId } from "../services/companyStore";
import { notifyProjectAtRisk, notifyProjectLate, notify } from "../services/notifications";
import { logUpdate } from "../services/auditLog";

const PROJECTS_KEY = "primus_projects";
const COMMISSIONS_KEY = "primus_commissions";

interface ProjectTrackerProps {
  onRequestUpgrade: (plan: PlanId) => void;
}

export const ProjectTracker: React.FC<ProjectTrackerProps> = ({ onRequestUpgrade }) => {
  const [projects, setProjects] = useState<Project[]>(() =>
    loadOrDefault<Project[]>(PROJECTS_KEY, SEED_PROJECTS)
  );

  // Load configurable pipeline stages and SLA rules
  const companyId = getActiveCompanyId();
  const pipelineStages = loadPipeline(companyId);
  const slaConfig = loadSLA(companyId);
  
  // Get stage IDs in order for pipeline progression
  const stageIds = pipelineStages.sort((a, b) => a.order - b.order).map(s => s.id);
  
  // Build SLA days lookup from config
  const SLA_DAYS: Record<string, number> = {};
  pipelineStages.forEach(stage => {
    const rule = slaConfig[stage.id];
    SLA_DAYS[stage.id] = rule?.target || 7;
  });

  // Get stage display name (from config or fallback)
  const getStageLabel = (stageId: string): string => {
    const stage = pipelineStages.find(s => s.id === stageId);
    return stage?.name || STAGE_LABELS[stageId as ProjectStage] || stageId;
  };

  useEffect(() => {
    save(PROJECTS_KEY, projects);
  }, [projects]);

  // Helper: Get next stage (using configurable pipeline)
  const getNextStage = (stage: ProjectStage | string): string | null => {
    const idx = stageIds.indexOf(stage);
    if (idx === -1 || idx === stageIds.length - 1) return null;
    return stageIds[idx + 1];
  };

  // Helper: Add days to a date string
  const addDays = (dateStr: string, days: number): string => {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
  };

  // Helper: Get days between two date strings
  const getDaysBetween = (start: string, end: string): number => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Compute SLA status for a project (using configurable thresholds)
  const computeSLAStatus = (project: Project): SLAStatus => {
    const today = new Date().toISOString().slice(0, 10);
    const targetDate = project.targetDates?.[project.stage];
    
    if (!targetDate) return 'onTrack';
    
    const daysInStage = getDaysBetween(project.actualDates?.[project.stage] || project.createdAt, today);
    
    // Use configurable SLA rules
    return calculateSLAStatus(project.stage, daysInStage, companyId);
  };

  // Initialize SLA tracking for a project if not present
  const initializeSLA = (project: Project): Project => {
    if (project.targetDates && project.actualDates) {
      return { ...project, slaStatus: computeSLAStatus(project) };
    }

    const today = new Date().toISOString().slice(0, 10);
    const baseDate = project.createdAt || today;
    
    // Build target dates starting from creation
    const targetDates: { [stage: string]: string } = {};
    const actualDates: { [stage: string]: string } = {};
    
    let lastDate = baseDate;
    
    for (const stageId of stageIds) {
      targetDates[stageId] = addDays(lastDate, SLA_DAYS[stageId] || 7);
      
      // If stage is already completed, mark actual date
      const stageIdx = stageIds.indexOf(stageId);
      const currentIdx = stageIds.indexOf(project.stage);
      
      if (stageIdx < currentIdx) {
        // Already passed this stage - estimate actual date
        actualDates[stageId] = targetDates[stageId];
        lastDate = actualDates[stageId];
      } else if (stageIdx === currentIdx) {
        // Current stage - no actual date yet
        lastDate = targetDates[stageId];
      } else {
        // Future stage - calculate from previous target
        lastDate = targetDates[stageId];
      }
    }

    const updated = {
      ...project,
      targetDates,
      actualDates
    };

    return { ...updated, slaStatus: computeSLAStatus(updated) };
  };

  // Update project when advancing stage
  const updateProjectStage = (project: Project): Project => {
    const nextStage = getNextStage(project.stage);
    if (!nextStage) return project;

    const today = new Date().toISOString().slice(0, 10);
    
    // Set actual date for current stage
    const actualDates = { ...(project.actualDates || {}), [project.stage]: today };
    
    // Recalculate target dates for remaining stages
    const targetDates = { ...(project.targetDates || {}) };
    let lastDate = today;
    
    const currentIdx = stageIds.indexOf(project.stage);
    for (let i = currentIdx + 1; i < stageIds.length; i++) {
      const stageId = stageIds[i];
      targetDates[stageId] = addDays(lastDate, SLA_DAYS[stageId] || 7);
      lastDate = targetDates[stageId];
    }

    const updated: Project = {
      ...project,
      stage: nextStage,
      lastUpdated: today,
      targetDates,
      actualDates
    };

    return { ...updated, slaStatus: computeSLAStatus(updated) };
  };

  // Initialize SLA on load
  useEffect(() => {
    const initialized = projects.map(initializeSLA);
    const needsUpdate = initialized.some((p, i) => 
      p.targetDates !== projects[i].targetDates || 
      p.slaStatus !== projects[i].slaStatus
    );
    if (needsUpdate) {
      setProjects(initialized);
    }
  }, []);

  // Monitor SLA status and send alerts for at-risk or late projects
  useEffect(() => {
    // Track which projects have been alerted to avoid duplicate notifications
    const alertedKey = `primus_sla_alerted_${companyId}`;
    const alerted: Record<string, SLAStatus> = JSON.parse(localStorage.getItem(alertedKey) || '{}');
    
    let updated = false;
    projects.forEach(project => {
      const prevStatus = alerted[project.id];
      const currentStatus = project.slaStatus;
      
      // Send notification if status changed to at-risk or late
      if (currentStatus && currentStatus !== prevStatus) {
        if (currentStatus === 'atRisk' && prevStatus !== 'late') {
          notifyProjectAtRisk(
            { id: project.id, stage: getStageLabel(project.stage) },
            companyId
          );
          alerted[project.id] = currentStatus;
          updated = true;
        } else if (currentStatus === 'late') {
          notifyProjectLate(
            { id: project.id, stage: getStageLabel(project.stage), daysLate: 1 },
            companyId
          );
          alerted[project.id] = currentStatus;
          updated = true;
        } else if (currentStatus === 'onTrack' && prevStatus) {
          // Clear alert status when back on track
          delete alerted[project.id];
          updated = true;
        }
      }
    });
    
    if (updated) {
      localStorage.setItem(alertedKey, JSON.stringify(alerted));
    }
  }, [projects, companyId]);

  const advanceStage = (p: Project) => {
    const idx = stageIds.indexOf(p.stage);
    if (idx === -1 || idx === stageIds.length - 1) return;
    
    const updated = updateProjectStage(p);

    // Log stage advancement to audit trail
    logUpdate('Project', p.id, p, updated, { 
      previousStage: p.stage, 
      newStage: updated.stage 
    });

    const newProjects = projects.map((proj) =>
      proj.id === p.id ? updated : proj
    );
    setProjects(newProjects);

    // Check if final stage (PTO or custom final stage)
    const finalStageId = stageIds[stageIds.length - 1];
    if (updated.stage === finalStageId || updated.stage === "PTO") {
      const existingCommissions = loadOrDefault<Commission[]>(COMMISSIONS_KEY, SEED_COMMISSIONS);
      const hasPto = existingCommissions.some(c => c.leadId === p.leadId && c.milestone === "PTO");
      
      if (!hasPto) {
        const newComms = generateMilestoneCommissions(updated);
        save(COMMISSIONS_KEY, [...existingCommissions, ...newComms]);
      }
      
      // Notify project completion
      notify({
        companyId,
        type: 'project',
        title: 'Project Completed!',
        message: `${p.customerName} has reached ${getStageLabel(updated.stage)}. Great job!`,
        priority: 'medium'
      });
    } else {
      // Notify stage advancement
      notify({
        companyId,
        type: 'project',
        title: 'Project Stage Updated',
        message: `${p.customerName} moved to ${getStageLabel(updated.stage)}.`,
        priority: 'low'
      });
    }
  };

  // Compute summary metrics
  const atRiskCount = projects.filter(p => p.slaStatus === 'atRisk').length;
  const lateCount = projects.filter(p => p.slaStatus === 'late').length;
  
  // Average days from Close (creation) to Install
  const avgDays = (() => {
    // Find install stage (or 4th stage as fallback)
    const installStageId = stageIds.find(id => id === 'INSTALL' || id.toLowerCase().includes('install')) || stageIds[Math.min(3, stageIds.length - 1)];
    const installIdx = stageIds.indexOf(installStageId);
    
    const projectsWithInstall = projects.filter(p => {
      const currentIdx = stageIds.indexOf(p.stage);
      return currentIdx >= installIdx && p.actualDates?.[installStageId];
    });
    
    if (projectsWithInstall.length === 0) {
      // Use total pipeline days from config
      return getTotalPipelineDays(companyId);
    }
    
    const totalDays = projectsWithInstall.reduce((sum, p) => {
      const installDate = p.actualDates?.[installStageId] || p.targetDates?.[installStageId] || '';
      return sum + getDaysBetween(p.createdAt, installDate);
    }, 0);
    
    return Math.round(totalDays / projectsWithInstall.length);
  })();

  // SLA Badge component
  const SLABadge = ({ status }: { status?: 'onTrack' | 'atRisk' | 'late' }) => {
    if (status === 'late') {
      return (
        <span className="px-2 py-1 text-xs bg-red-900/60 text-red-300 rounded flex items-center gap-1">
          <AlertCircle size={10} /> Late
        </span>
      );
    }
    if (status === 'atRisk') {
      return (
        <span className="px-2 py-1 text-xs bg-yellow-900/60 text-yellow-300 rounded flex items-center gap-1">
          <AlertTriangle size={10} /> At Risk
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs bg-emerald-900/60 text-emerald-300 rounded flex items-center gap-1">
        <Clock size={10} /> On Track
      </span>
    );
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

      {/* SLA Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={14} className="text-slate-500" />
            <p className="text-slate-400 text-sm">Avg Close → Install</p>
          </div>
          <p className="text-white text-2xl font-mono font-bold">{avgDays} <span className="text-sm font-normal text-slate-500">days</span></p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={14} className="text-yellow-500" />
            <p className="text-slate-400 text-sm">Projects At Risk</p>
          </div>
          <p className="text-yellow-300 text-2xl font-mono font-bold">{atRiskCount}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle size={14} className="text-red-500" />
            <p className="text-slate-400 text-sm">Late Projects</p>
          </div>
          <p className="text-red-400 text-2xl font-mono font-bold">{lateCount}</p>
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
                        <SLABadge status={p.slaStatus} />
                      </div>
                      <div className="text-sm text-slate-400 mt-1 flex items-center gap-2">
                        <span>{p.kW.toFixed(1)} kW System</span>
                        <span className="text-slate-700">•</span>
                        <span>Updated {p.lastUpdated}</span>
                        {p.targetDates?.[p.stage] && (
                          <>
                            <span className="text-slate-700">•</span>
                            <span className="text-xs">
                              Target: <span className={`font-mono ${p.slaStatus === 'late' ? 'text-red-400' : p.slaStatus === 'atRisk' ? 'text-yellow-400' : 'text-emerald-400'}`}>{p.targetDates[p.stage]}</span>
                            </span>
                          </>
                        )}
                      </div>
                   </div>
                   <button
                    className="secondary-btn text-xs"
                    onClick={() => advanceStage(p)}
                    disabled={stageIds.indexOf(p.stage) === stageIds.length - 1}
                  >
                    {stageIds.indexOf(p.stage) === stageIds.length - 1 ? (
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
                        width: `${(stageIds.indexOf(p.stage) / (stageIds.length - 1)) * 100}%` 
                    }}
                  ></div>

                  <div className="relative z-10 flex justify-between">
                    {stageIds.map((stageId, idx) => {
                      const isCompleted = stageIds.indexOf(stageId) <= stageIds.indexOf(p.stage);
                      const isCurrent = stageId === p.stage;
                      const stageConfig = pipelineStages.find(s => s.id === stageId);
                      
                      return (
                        <div key={stageId} className="flex flex-col items-center gap-2 group">
                          <div 
                            className={`w-3 h-3 rounded-full border-2 transition-all duration-300 ${
                              isCompleted 
                                ? 'bg-emerald-500 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' 
                                : 'bg-slate-900 border-slate-700'
                            }`}
                            style={isCompleted && stageConfig?.color ? {
                              backgroundColor: stageConfig.color,
                              borderColor: stageConfig.color
                            } : undefined}
                          ></div>
                          <span 
                            className={`text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 ${
                              isCurrent ? 'text-emerald-400' : isCompleted ? 'text-slate-400' : 'text-slate-600'
                            }`}
                          >
                            {getStageLabel(stageId)}
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
