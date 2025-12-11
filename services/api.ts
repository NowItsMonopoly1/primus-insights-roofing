/**
 * API Foundation Layer
 * Mock API client that simulates REST endpoints.
 * Designed for easy migration to real backend when ready.
 */

import { Lead } from '../types';
import { loadOrDefault, save, loadAllLeads, saveLeads, loadAllProjects, saveProjects } from '../utils/storage';
import { Project, Rep, Installer } from '../types';
import { getCompanies, getActiveCompany, getActiveCompanyId } from './companyStore';

// ============================================================================
// Helper functions
// ============================================================================

function loadLeads(companyId: string): Lead[] {
  const allLeads = loadAllLeads();
  return allLeads.filter(lead => 
    (lead as any).companyId === companyId || !(lead as any).companyId
  );
}

function saveLeadsForCompany(companyId: string, leads: Lead[]): void {
  // Load all leads, remove ones for this company, add new ones
  const allLeads = loadAllLeads();
  const otherLeads = allLeads.filter(l => (l as any).companyId !== companyId);
  const updatedLeads = [...otherLeads, ...leads];
  saveLeads(updatedLeads);
}

function loadProjects(companyId: string): Project[] {
  const allProjects = loadAllProjects();
  return allProjects.filter(project => 
    (project as any).companyId === companyId || !(project as any).companyId
  );
}

function saveProjectsForCompany(companyId: string, projects: Project[]): void {
  const allProjects = loadAllProjects();
  const otherProjects = allProjects.filter(p => (p as any).companyId !== companyId);
  const updatedProjects = [...otherProjects, ...projects];
  saveProjects(updatedProjects);
}

function loadReps(companyId: string): Rep[] {
  const company = getCompanies().find(c => c.id === companyId);
  return company?.reps || [];
}

function loadInstallers(companyId: string): Installer[] {
  const company = getCompanies().find(c => c.id === companyId);
  return company?.installers || [];
}

function loadCompanies() {
  return getCompanies();
}

function loadCurrentCompany() {
  return getActiveCompany();
}

// =============================================================================
// Types
// =============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    total?: number;
    page?: number;
    pageSize?: number;
    timestamp: string;
  };
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface LeadFilters extends PaginationParams {
  status?: string;
  repId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface ProjectFilters extends PaginationParams {
  stage?: string;
  installerId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface CommissionFilters extends PaginationParams {
  repId?: string;
  status?: 'pending' | 'approved' | 'paid';
  dateFrom?: string;
  dateTo?: string;
}

// Simulated network delay
const SIMULATED_DELAY_MS = 100;

// =============================================================================
// Utility Functions
// =============================================================================

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function createResponse<T>(data: T, meta?: Partial<ApiResponse<T>['meta']>): ApiResponse<T> {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta
    }
  };
}

function createErrorResponse<T>(error: string): ApiResponse<T> {
  return {
    success: false,
    error,
    meta: {
      timestamp: new Date().toISOString()
    }
  };
}

function getCurrentCompanyId(): string {
  const company = loadCurrentCompany();
  return company?.id || 'default';
}

// =============================================================================
// Leads API
// =============================================================================

export const leadsApi = {
  async getAll(filters?: LeadFilters): Promise<ApiResponse<Lead[]>> {
    await delay(SIMULATED_DELAY_MS);
    
    try {
      const companyId = getCurrentCompanyId();
      let leads = loadLeads(companyId);
      
      // Apply filters
      if (filters) {
        if (filters.status) {
          leads = leads.filter(l => l.status === filters.status);
        }
        if (filters.repId) {
          leads = leads.filter(l => l.repId === filters.repId);
        }
        if (filters.dateFrom) {
          const fromDate = new Date(filters.dateFrom);
          leads = leads.filter(l => new Date(l.createdAt) >= fromDate);
        }
        if (filters.dateTo) {
          const toDate = new Date(filters.dateTo);
          leads = leads.filter(l => new Date(l.createdAt) <= toDate);
        }
        if (filters.search) {
          const search = filters.search.toLowerCase();
          leads = leads.filter(l => 
            l.name.toLowerCase().includes(search) ||
            l.address.toLowerCase().includes(search) ||
            l.email?.toLowerCase().includes(search)
          );
        }
      }
      
      // Apply pagination
      const total = leads.length;
      const page = filters?.page || 1;
      const pageSize = filters?.pageSize || 50;
      const start = (page - 1) * pageSize;
      const paginatedLeads = leads.slice(start, start + pageSize);
      
      return createResponse(paginatedLeads, { total, page, pageSize });
    } catch (err) {
      return createErrorResponse('Failed to fetch leads');
    }
  },
  
  async getById(id: string): Promise<ApiResponse<Lead | null>> {
    await delay(SIMULATED_DELAY_MS);
    
    try {
      const companyId = getCurrentCompanyId();
      const leads = loadLeads(companyId);
      const lead = leads.find(l => l.id === id) || null;
      
      if (!lead) {
        return createErrorResponse('Lead not found');
      }
      
      return createResponse(lead);
    } catch (err) {
      return createErrorResponse('Failed to fetch lead');
    }
  },
  
  async create(lead: Omit<Lead, 'id' | 'createdAt'>): Promise<ApiResponse<Lead>> {
    await delay(SIMULATED_DELAY_MS);
    
    try {
      const companyId = getCurrentCompanyId();
      const leads = loadLeads(companyId);
      
      const newLead: Lead = {
        ...lead,
        id: generateUUID(),
        createdAt: new Date().toISOString()
      };
      
      leads.push(newLead);
      saveLeadsForCompany(companyId, leads);
      
      return createResponse(newLead);
    } catch (err) {
      return createErrorResponse('Failed to create lead');
    }
  },
  
  async update(id: string, updates: Partial<Lead>): Promise<ApiResponse<Lead>> {
    await delay(SIMULATED_DELAY_MS);
    
    try {
      const companyId = getCurrentCompanyId();
      const leads = loadLeads(companyId);
      const index = leads.findIndex(l => l.id === id);
      
      if (index === -1) {
        return createErrorResponse('Lead not found');
      }
      
      leads[index] = { ...leads[index], ...updates };
      saveLeadsForCompany(companyId, leads);
      
      return createResponse(leads[index]);
    } catch (err) {
      return createErrorResponse('Failed to update lead');
    }
  },
  
  async delete(id: string): Promise<ApiResponse<boolean>> {
    await delay(SIMULATED_DELAY_MS);
    
    try {
      const companyId = getCurrentCompanyId();
      const leads = loadLeads(companyId);
      const filtered = leads.filter(l => l.id !== id);
      
      if (filtered.length === leads.length) {
        return createErrorResponse('Lead not found');
      }
      
      saveLeadsForCompany(companyId, filtered);
      return createResponse(true);
    } catch (err) {
      return createErrorResponse('Failed to delete lead');
    }
  },
  
  async bulkUpdate(ids: string[], updates: Partial<Lead>): Promise<ApiResponse<Lead[]>> {
    await delay(SIMULATED_DELAY_MS);
    
    try {
      const companyId = getCurrentCompanyId();
      const leads = loadLeads(companyId);
      const updated: Lead[] = [];
      
      leads.forEach((lead, index) => {
        if (ids.includes(lead.id)) {
          leads[index] = { ...lead, ...updates };
          updated.push(leads[index]);
        }
      });
      
      saveLeadsForCompany(companyId, leads);
      return createResponse(updated);
    } catch (err) {
      return createErrorResponse('Failed to bulk update leads');
    }
  }
};

// =============================================================================
// Projects API
// =============================================================================

export const projectsApi = {
  async getAll(filters?: ProjectFilters): Promise<ApiResponse<Project[]>> {
    await delay(SIMULATED_DELAY_MS);
    
    try {
      const companyId = getCurrentCompanyId();
      let projects = loadProjects(companyId);
      
      // Apply filters
      if (filters) {
        if (filters.stage) {
          projects = projects.filter(p => p.stage === filters.stage);
        }
        if (filters.installerId) {
          projects = projects.filter(p => p.installerId === filters.installerId);
        }
        if (filters.dateFrom) {
          const fromDate = new Date(filters.dateFrom);
          projects = projects.filter(p => new Date(p.contractDate) >= fromDate);
        }
        if (filters.dateTo) {
          const toDate = new Date(filters.dateTo);
          projects = projects.filter(p => new Date(p.contractDate) <= toDate);
        }
        if (filters.search) {
          const search = filters.search.toLowerCase();
          projects = projects.filter(p => 
            p.customerName.toLowerCase().includes(search) ||
            p.address.toLowerCase().includes(search)
          );
        }
      }
      
      // Apply pagination
      const total = projects.length;
      const page = filters?.page || 1;
      const pageSize = filters?.pageSize || 50;
      const start = (page - 1) * pageSize;
      const paginatedProjects = projects.slice(start, start + pageSize);
      
      return createResponse(paginatedProjects, { total, page, pageSize });
    } catch (err) {
      return createErrorResponse('Failed to fetch projects');
    }
  },
  
  async getById(id: string): Promise<ApiResponse<Project | null>> {
    await delay(SIMULATED_DELAY_MS);
    
    try {
      const companyId = getCurrentCompanyId();
      const projects = loadProjects(companyId);
      const project = projects.find(p => p.id === id) || null;
      
      if (!project) {
        return createErrorResponse('Project not found');
      }
      
      return createResponse(project);
    } catch (err) {
      return createErrorResponse('Failed to fetch project');
    }
  },
  
  async create(project: Omit<Project, 'id'>): Promise<ApiResponse<Project>> {
    await delay(SIMULATED_DELAY_MS);
    
    try {
      const companyId = getCurrentCompanyId();
      const projects = loadProjects(companyId);
      
      const newProject: Project = {
        ...project,
        id: generateUUID()
      };
      
      projects.push(newProject);
      saveProjectsForCompany(companyId, projects);
      
      return createResponse(newProject);
    } catch (err) {
      return createErrorResponse('Failed to create project');
    }
  },
  
  async update(id: string, updates: Partial<Project>): Promise<ApiResponse<Project>> {
    await delay(SIMULATED_DELAY_MS);
    
    try {
      const companyId = getCurrentCompanyId();
      const projects = loadProjects(companyId);
      const index = projects.findIndex(p => p.id === id);
      
      if (index === -1) {
        return createErrorResponse('Project not found');
      }
      
      projects[index] = { ...projects[index], ...updates };
      saveProjectsForCompany(companyId, projects);
      
      return createResponse(projects[index]);
    } catch (err) {
      return createErrorResponse('Failed to update project');
    }
  },
  
  async updateStage(id: string, stage: string): Promise<ApiResponse<Project>> {
    return this.update(id, { stage });
  },
  
  async delete(id: string): Promise<ApiResponse<boolean>> {
    await delay(SIMULATED_DELAY_MS);
    
    try {
      const companyId = getCurrentCompanyId();
      const projects = loadProjects(companyId);
      const filtered = projects.filter(p => p.id !== id);
      
      if (filtered.length === projects.length) {
        return createErrorResponse('Project not found');
      }
      
      saveProjectsForCompany(companyId, filtered);
      return createResponse(true);
    } catch (err) {
      return createErrorResponse('Failed to delete project');
    }
  }
};

// =============================================================================
// Commissions API
// =============================================================================

export interface Commission {
  id: string;
  projectId: string;
  repId: string;
  amount: number;
  status: 'pending' | 'approved' | 'paid';
  calculatedAt: string;
  approvedAt?: string;
  paidAt?: string;
  breakdown: {
    baseAmount: number;
    tierRate: number;
    bonuses: { label: string; amount: number }[];
  };
}

const COMMISSIONS_KEY = (companyId: string) => `primus_commissions_${companyId}`;

function loadCommissions(companyId: string): Commission[] {
  const stored = localStorage.getItem(COMMISSIONS_KEY(companyId));
  return stored ? JSON.parse(stored) : [];
}

function saveCommissions(companyId: string, commissions: Commission[]): void {
  localStorage.setItem(COMMISSIONS_KEY(companyId), JSON.stringify(commissions));
}

export const commissionsApi = {
  async getAll(filters?: CommissionFilters): Promise<ApiResponse<Commission[]>> {
    await delay(SIMULATED_DELAY_MS);
    
    try {
      const companyId = getCurrentCompanyId();
      let commissions = loadCommissions(companyId);
      
      // Apply filters
      if (filters) {
        if (filters.repId) {
          commissions = commissions.filter(c => c.repId === filters.repId);
        }
        if (filters.status) {
          commissions = commissions.filter(c => c.status === filters.status);
        }
        if (filters.dateFrom) {
          const fromDate = new Date(filters.dateFrom);
          commissions = commissions.filter(c => new Date(c.calculatedAt) >= fromDate);
        }
        if (filters.dateTo) {
          const toDate = new Date(filters.dateTo);
          commissions = commissions.filter(c => new Date(c.calculatedAt) <= toDate);
        }
      }
      
      // Apply pagination
      const total = commissions.length;
      const page = filters?.page || 1;
      const pageSize = filters?.pageSize || 50;
      const start = (page - 1) * pageSize;
      const paginatedCommissions = commissions.slice(start, start + pageSize);
      
      return createResponse(paginatedCommissions, { total, page, pageSize });
    } catch (err) {
      return createErrorResponse('Failed to fetch commissions');
    }
  },
  
  async getById(id: string): Promise<ApiResponse<Commission | null>> {
    await delay(SIMULATED_DELAY_MS);
    
    try {
      const companyId = getCurrentCompanyId();
      const commissions = loadCommissions(companyId);
      const commission = commissions.find(c => c.id === id) || null;
      
      if (!commission) {
        return createErrorResponse('Commission not found');
      }
      
      return createResponse(commission);
    } catch (err) {
      return createErrorResponse('Failed to fetch commission');
    }
  },
  
  async create(commission: Omit<Commission, 'id'>): Promise<ApiResponse<Commission>> {
    await delay(SIMULATED_DELAY_MS);
    
    try {
      const companyId = getCurrentCompanyId();
      const commissions = loadCommissions(companyId);
      
      const newCommission: Commission = {
        ...commission,
        id: generateUUID()
      };
      
      commissions.push(newCommission);
      saveCommissions(companyId, commissions);
      
      return createResponse(newCommission);
    } catch (err) {
      return createErrorResponse('Failed to create commission');
    }
  },
  
  async approve(id: string): Promise<ApiResponse<Commission>> {
    await delay(SIMULATED_DELAY_MS);
    
    try {
      const companyId = getCurrentCompanyId();
      const commissions = loadCommissions(companyId);
      const index = commissions.findIndex(c => c.id === id);
      
      if (index === -1) {
        return createErrorResponse('Commission not found');
      }
      
      commissions[index] = {
        ...commissions[index],
        status: 'approved',
        approvedAt: new Date().toISOString()
      };
      
      saveCommissions(companyId, commissions);
      return createResponse(commissions[index]);
    } catch (err) {
      return createErrorResponse('Failed to approve commission');
    }
  },
  
  async markPaid(id: string): Promise<ApiResponse<Commission>> {
    await delay(SIMULATED_DELAY_MS);
    
    try {
      const companyId = getCurrentCompanyId();
      const commissions = loadCommissions(companyId);
      const index = commissions.findIndex(c => c.id === id);
      
      if (index === -1) {
        return createErrorResponse('Commission not found');
      }
      
      commissions[index] = {
        ...commissions[index],
        status: 'paid',
        paidAt: new Date().toISOString()
      };
      
      saveCommissions(companyId, commissions);
      return createResponse(commissions[index]);
    } catch (err) {
      return createErrorResponse('Failed to mark commission as paid');
    }
  },
  
  async bulkApprove(ids: string[]): Promise<ApiResponse<Commission[]>> {
    await delay(SIMULATED_DELAY_MS);
    
    try {
      const companyId = getCurrentCompanyId();
      const commissions = loadCommissions(companyId);
      const approved: Commission[] = [];
      const now = new Date().toISOString();
      
      commissions.forEach((commission, index) => {
        if (ids.includes(commission.id) && commission.status === 'pending') {
          commissions[index] = {
            ...commission,
            status: 'approved',
            approvedAt: now
          };
          approved.push(commissions[index]);
        }
      });
      
      saveCommissions(companyId, commissions);
      return createResponse(approved);
    } catch (err) {
      return createErrorResponse('Failed to bulk approve commissions');
    }
  }
};

// =============================================================================
// Company API
// =============================================================================

export const companyApi = {
  async getCurrent(): Promise<ApiResponse<any>> {
    await delay(SIMULATED_DELAY_MS);
    
    try {
      const company = loadCurrentCompany();
      if (!company) {
        return createErrorResponse('No company selected');
      }
      return createResponse(company);
    } catch (err) {
      return createErrorResponse('Failed to fetch company');
    }
  },
  
  async getAll(): Promise<ApiResponse<any[]>> {
    await delay(SIMULATED_DELAY_MS);
    
    try {
      const companies = loadCompanies();
      return createResponse(companies);
    } catch (err) {
      return createErrorResponse('Failed to fetch companies');
    }
  },
  
  async getSettings(companyId: string): Promise<ApiResponse<any>> {
    await delay(SIMULATED_DELAY_MS);
    
    try {
      const key = `primus_company_settings_${companyId}`;
      const stored = localStorage.getItem(key);
      const settings = stored ? JSON.parse(stored) : {};
      return createResponse(settings);
    } catch (err) {
      return createErrorResponse('Failed to fetch company settings');
    }
  },
  
  async updateSettings(companyId: string, settings: any): Promise<ApiResponse<any>> {
    await delay(SIMULATED_DELAY_MS);
    
    try {
      const key = `primus_company_settings_${companyId}`;
      localStorage.setItem(key, JSON.stringify(settings));
      return createResponse(settings);
    } catch (err) {
      return createErrorResponse('Failed to update company settings');
    }
  }
};

// =============================================================================
// Reps API
// =============================================================================

export const repsApi = {
  async getAll(): Promise<ApiResponse<Rep[]>> {
    await delay(SIMULATED_DELAY_MS);
    
    try {
      const companyId = getCurrentCompanyId();
      const reps = loadReps(companyId);
      return createResponse(reps, { total: reps.length });
    } catch (err) {
      return createErrorResponse('Failed to fetch reps');
    }
  },
  
  async getById(id: string): Promise<ApiResponse<Rep | null>> {
    await delay(SIMULATED_DELAY_MS);
    
    try {
      const companyId = getCurrentCompanyId();
      const reps = loadReps(companyId);
      const rep = reps.find(r => r.id === id) || null;
      
      if (!rep) {
        return createErrorResponse('Rep not found');
      }
      
      return createResponse(rep);
    } catch (err) {
      return createErrorResponse('Failed to fetch rep');
    }
  },
  
  async getStats(repId: string): Promise<ApiResponse<any>> {
    await delay(SIMULATED_DELAY_MS);
    
    try {
      const companyId = getCurrentCompanyId();
      const leads = loadLeads(companyId);
      const projects = loadProjects(companyId);
      
      const repLeads = leads.filter(l => l.repId === repId);
      const repProjects = projects.filter(p => p.repId === repId);
      
      const stats = {
        totalLeads: repLeads.length,
        closedLeads: repLeads.filter(l => l.status === 'closed').length,
        totalProjects: repProjects.length,
        totalRevenue: repProjects.reduce((sum, p) => sum + p.contractValue, 0),
        conversionRate: repLeads.length > 0 
          ? (repLeads.filter(l => l.status === 'closed').length / repLeads.length * 100).toFixed(1)
          : 0
      };
      
      return createResponse(stats);
    } catch (err) {
      return createErrorResponse('Failed to fetch rep stats');
    }
  }
};

// =============================================================================
// Installers API
// =============================================================================

export const installersApi = {
  async getAll(): Promise<ApiResponse<Installer[]>> {
    await delay(SIMULATED_DELAY_MS);
    
    try {
      const companyId = getCurrentCompanyId();
      const installers = loadInstallers(companyId);
      return createResponse(installers, { total: installers.length });
    } catch (err) {
      return createErrorResponse('Failed to fetch installers');
    }
  },
  
  async getById(id: string): Promise<ApiResponse<Installer | null>> {
    await delay(SIMULATED_DELAY_MS);
    
    try {
      const companyId = getCurrentCompanyId();
      const installers = loadInstallers(companyId);
      const installer = installers.find(i => i.id === id) || null;
      
      if (!installer) {
        return createErrorResponse('Installer not found');
      }
      
      return createResponse(installer);
    } catch (err) {
      return createErrorResponse('Failed to fetch installer');
    }
  },
  
  async getPerformance(installerId: string): Promise<ApiResponse<any>> {
    await delay(SIMULATED_DELAY_MS);
    
    try {
      const companyId = getCurrentCompanyId();
      const projects = loadProjects(companyId);
      
      const installerProjects = projects.filter(p => p.installerId === installerId);
      const completedProjects = installerProjects.filter(p => p.stage === 'complete');
      
      // Calculate average days to complete
      let totalDays = 0;
      let countWithDates = 0;
      
      completedProjects.forEach(p => {
        if (p.contractDate && p.installDate) {
          const start = new Date(p.contractDate);
          const end = new Date(p.installDate);
          const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
          totalDays += days;
          countWithDates++;
        }
      });
      
      const performance = {
        totalProjects: installerProjects.length,
        completedProjects: completedProjects.length,
        inProgressProjects: installerProjects.filter(p => p.stage !== 'complete').length,
        avgDaysToComplete: countWithDates > 0 ? Math.round(totalDays / countWithDates) : null,
        totalKW: installerProjects.reduce((sum, p) => sum + (p.systemSize || 0), 0)
      };
      
      return createResponse(performance);
    } catch (err) {
      return createErrorResponse('Failed to fetch installer performance');
    }
  }
};

// =============================================================================
// Analytics API
// =============================================================================

export const analyticsApi = {
  async getRevenueSummary(dateFrom?: string, dateTo?: string): Promise<ApiResponse<any>> {
    await delay(SIMULATED_DELAY_MS);
    
    try {
      const companyId = getCurrentCompanyId();
      const projects = loadProjects(companyId);
      
      let filtered = projects;
      if (dateFrom) {
        const from = new Date(dateFrom);
        filtered = filtered.filter(p => new Date(p.contractDate) >= from);
      }
      if (dateTo) {
        const to = new Date(dateTo);
        filtered = filtered.filter(p => new Date(p.contractDate) <= to);
      }
      
      const summary = {
        totalRevenue: filtered.reduce((sum, p) => sum + p.contractValue, 0),
        projectCount: filtered.length,
        avgProjectValue: filtered.length > 0 
          ? filtered.reduce((sum, p) => sum + p.contractValue, 0) / filtered.length 
          : 0,
        totalKW: filtered.reduce((sum, p) => sum + (p.systemSize || 0), 0),
        byMonth: {} as Record<string, { revenue: number; count: number }>
      };
      
      // Group by month
      filtered.forEach(p => {
        const month = p.contractDate.substring(0, 7); // YYYY-MM
        if (!summary.byMonth[month]) {
          summary.byMonth[month] = { revenue: 0, count: 0 };
        }
        summary.byMonth[month].revenue += p.contractValue;
        summary.byMonth[month].count += 1;
      });
      
      return createResponse(summary);
    } catch (err) {
      return createErrorResponse('Failed to fetch revenue summary');
    }
  },
  
  async getPipelineSummary(): Promise<ApiResponse<any>> {
    await delay(SIMULATED_DELAY_MS);
    
    try {
      const companyId = getCurrentCompanyId();
      const leads = loadLeads(companyId);
      const projects = loadProjects(companyId);
      
      const leadsByStatus = {} as Record<string, number>;
      leads.forEach(l => {
        leadsByStatus[l.status] = (leadsByStatus[l.status] || 0) + 1;
      });
      
      const projectsByStage = {} as Record<string, number>;
      projects.forEach(p => {
        projectsByStage[p.stage] = (projectsByStage[p.stage] || 0) + 1;
      });
      
      return createResponse({
        totalLeads: leads.length,
        leadsByStatus,
        totalProjects: projects.length,
        projectsByStage,
        pipelineValue: projects
          .filter(p => p.stage !== 'complete' && p.stage !== 'cancelled')
          .reduce((sum, p) => sum + p.contractValue, 0)
      });
    } catch (err) {
      return createErrorResponse('Failed to fetch pipeline summary');
    }
  },
  
  async getTeamLeaderboard(): Promise<ApiResponse<any[]>> {
    await delay(SIMULATED_DELAY_MS);
    
    try {
      const companyId = getCurrentCompanyId();
      const reps = loadReps(companyId);
      const projects = loadProjects(companyId);
      
      const leaderboard = reps.map(rep => {
        const repProjects = projects.filter(p => p.repId === rep.id);
        return {
          repId: rep.id,
          repName: rep.name,
          totalProjects: repProjects.length,
          totalRevenue: repProjects.reduce((sum, p) => sum + p.contractValue, 0),
          totalKW: repProjects.reduce((sum, p) => sum + (p.systemSize || 0), 0)
        };
      });
      
      // Sort by revenue descending
      leaderboard.sort((a, b) => b.totalRevenue - a.totalRevenue);
      
      return createResponse(leaderboard);
    } catch (err) {
      return createErrorResponse('Failed to fetch team leaderboard');
    }
  }
};

// =============================================================================
// Export/Import API (for data portability)
// =============================================================================

export const dataApi = {
  async exportAll(): Promise<ApiResponse<any>> {
    await delay(SIMULATED_DELAY_MS);
    
    try {
      const companyId = getCurrentCompanyId();
      
      const exportData = {
        exportedAt: new Date().toISOString(),
        companyId,
        leads: loadLeads(companyId),
        projects: loadProjects(companyId),
        reps: loadReps(companyId),
        installers: loadInstallers(companyId),
        commissions: loadCommissions(companyId)
      };
      
      return createResponse(exportData);
    } catch (err) {
      return createErrorResponse('Failed to export data');
    }
  },
  
  async importAll(data: any): Promise<ApiResponse<{ imported: Record<string, number> }>> {
    await delay(SIMULATED_DELAY_MS);
    
    try {
      const companyId = getCurrentCompanyId();
      const imported: Record<string, number> = {};
      
      if (data.leads?.length) {
        saveLeadsForCompany(companyId, data.leads);
        imported.leads = data.leads.length;
      }
      
      if (data.projects?.length) {
        saveProjectsForCompany(companyId, data.projects);
        imported.projects = data.projects.length;
      }
      
      if (data.commissions?.length) {
        saveCommissions(companyId, data.commissions);
        imported.commissions = data.commissions.length;
      }
      
      return createResponse({ imported });
    } catch (err) {
      return createErrorResponse('Failed to import data');
    }
  }
};

// =============================================================================
// Utility
// =============================================================================

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// =============================================================================
// Unified API Object (for convenience)
// =============================================================================

export const api = {
  leads: leadsApi,
  projects: projectsApi,
  commissions: commissionsApi,
  company: companyApi,
  reps: repsApi,
  installers: installersApi,
  analytics: analyticsApi,
  data: dataApi
};

export default api;
