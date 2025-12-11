import { getActiveCompanyId } from '../services/companyStore';
import { Lead, Project, Commission } from '../types';

// ============================================================================
// GENERIC STORAGE HELPERS
// ============================================================================

export function loadOrDefault<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (e) {
    console.warn(`Failed to load ${key} from storage`, e);
    return defaultValue;
  }
}

export function save<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to save ${key} to storage`, e);
  }
}

// ============================================================================
// COMPANY-FILTERED DATA LOADERS
// ============================================================================

const LEADS_KEY = 'primus_leads';
const PROJECTS_KEY = 'primus_projects';
const COMMISSIONS_KEY = 'primus_commissions';

/**
 * Load all leads (unfiltered - for internal use)
 */
export function loadAllLeads(): Lead[] {
  return loadOrDefault<Lead[]>(LEADS_KEY, []);
}

/**
 * Load leads filtered by active company
 */
export function loadLeadsForActiveCompany(): Lead[] {
  const activeCompanyId = getActiveCompanyId();
  const allLeads = loadAllLeads();
  return allLeads.filter(lead => 
    (lead as any).companyId === activeCompanyId || !(lead as any).companyId
  );
}

/**
 * Save leads (preserves company isolation)
 */
export function saveLeads(leads: Lead[]): void {
  save(LEADS_KEY, leads);
}

/**
 * Add a lead with company context
 */
export function addLeadWithCompany(lead: Omit<Lead, 'companyId'>): Lead {
  const activeCompanyId = getActiveCompanyId();
  const leadWithCompany = { ...lead, companyId: activeCompanyId } as Lead & { companyId: string };
  const allLeads = loadAllLeads();
  allLeads.push(leadWithCompany);
  saveLeads(allLeads);
  return leadWithCompany;
}

/**
 * Load all projects (unfiltered)
 */
export function loadAllProjects(): Project[] {
  return loadOrDefault<Project[]>(PROJECTS_KEY, []);
}

/**
 * Load projects filtered by active company
 */
export function loadProjectsForActiveCompany(): Project[] {
  const activeCompanyId = getActiveCompanyId();
  const allProjects = loadAllProjects();
  return allProjects.filter(project => 
    (project as any).companyId === activeCompanyId || !(project as any).companyId
  );
}

/**
 * Save projects
 */
export function saveProjects(projects: Project[]): void {
  save(PROJECTS_KEY, projects);
}

/**
 * Add a project with company context
 */
export function addProjectWithCompany(project: Omit<Project, 'companyId'>): Project {
  const activeCompanyId = getActiveCompanyId();
  const projectWithCompany = { ...project, companyId: activeCompanyId } as Project & { companyId: string };
  const allProjects = loadAllProjects();
  allProjects.push(projectWithCompany);
  saveProjects(allProjects);
  return projectWithCompany;
}

/**
 * Load all commissions (unfiltered)
 */
export function loadAllCommissions(): Commission[] {
  return loadOrDefault<Commission[]>(COMMISSIONS_KEY, []);
}

/**
 * Load commissions filtered by active company
 */
export function loadCommissionsForActiveCompany(): Commission[] {
  const activeCompanyId = getActiveCompanyId();
  const allCommissions = loadAllCommissions();
  return allCommissions.filter(comm => 
    (comm as any).companyId === activeCompanyId || !(comm as any).companyId
  );
}

/**
 * Save commissions
 */
export function saveCommissions(commissions: Commission[]): void {
  save(COMMISSIONS_KEY, commissions);
}

/**
 * Add a commission with company context
 */
export function addCommissionWithCompany(commission: Omit<Commission, 'companyId'>): Commission {
  const activeCompanyId = getActiveCompanyId();
  const commissionWithCompany = { ...commission, companyId: activeCompanyId } as Commission & { companyId: string };
  const allCommissions = loadAllCommissions();
  allCommissions.push(commissionWithCompany);
  saveCommissions(allCommissions);
  return commissionWithCompany;
}

// ============================================================================
// MIGRATION HELPER - Assign companyId to existing records
// ============================================================================

export function migrateExistingRecordsToCompany(companyId: string): void {
  // Migrate leads
  const leads = loadAllLeads();
  let leadsUpdated = false;
  leads.forEach((lead: any) => {
    if (!lead.companyId) {
      lead.companyId = companyId;
      leadsUpdated = true;
    }
  });
  if (leadsUpdated) saveLeads(leads);

  // Migrate projects
  const projects = loadAllProjects();
  let projectsUpdated = false;
  projects.forEach((project: any) => {
    if (!project.companyId) {
      project.companyId = companyId;
      projectsUpdated = true;
    }
  });
  if (projectsUpdated) saveProjects(projects);

  // Migrate commissions
  const commissions = loadAllCommissions();
  let commissionsUpdated = false;
  commissions.forEach((comm: any) => {
    if (!comm.companyId) {
      comm.companyId = companyId;
      commissionsUpdated = true;
    }
  });
  if (commissionsUpdated) saveCommissions(commissions);
}
