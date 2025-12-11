// services/companyStore.ts
// Global Company Store - Multi-Company Architecture for Primus Home Pro

// Simple UUID generator (no external dependency)
function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// ============================================================================
// TYPES
// ============================================================================

export interface CompanySettings {
  timezone: string;
  currency: string;
  commissionStructure: 'flat' | 'tiered' | 'custom';
  defaultCommissionRate: number;
  slaTargets: {
    permitDays: number;
    installDays: number;
    inspectionDays: number;
  };
}

export interface Team {
  id: string;
  name: string;
  reps: string[]; // rep IDs
  createdAt: string;
}

export interface Rep {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'manager' | 'rep' | 'installer' | 'finance';
  teamId: string | null;
  avatarUrl?: string;
  hireDate: string;
  isActive: boolean;
}

export interface Installer {
  id: string;
  name: string;
  phone: string;
  email: string;
  licenseNumber?: string;
  rating: number; // 0-5
  totalInstalls: number;
  isActive: boolean;
}

export interface Company {
  id: string;
  name: string;
  logoUrl: string;
  primaryContact: string;
  email: string;
  phone: string;
  address: string;
  timezone: string;
  settings: CompanySettings;
  teams: Team[];
  reps: Rep[];
  installers: Installer[];
  createdAt: string;
  updatedAt: string;
}

interface CompanyState {
  companies: Company[];
  activeCompanyId: string | null;
}

// ============================================================================
// STATE
// ============================================================================

const STORAGE_KEY = 'primus_company_store';

let state: CompanyState = {
  companies: [],
  activeCompanyId: null,
};

// ============================================================================
// DEFAULT COMPANY FACTORY
// ============================================================================

export function createDefaultCompany(name: string = 'My Solar Company'): Company {
  const companyId = uuidv4();
  const adminId = uuidv4();
  const defaultTeamId = uuidv4();

  return {
    id: companyId,
    name,
    logoUrl: '',
    primaryContact: 'Owner',
    email: '',
    phone: '',
    address: '',
    timezone: 'America/New_York',
    settings: {
      timezone: 'America/New_York',
      currency: 'USD',
      commissionStructure: 'flat',
      defaultCommissionRate: 500,
      slaTargets: {
        permitDays: 14,
        installDays: 30,
        inspectionDays: 7,
      },
    },
    teams: [
      {
        id: defaultTeamId,
        name: 'Default Team',
        reps: [adminId],
        createdAt: new Date().toISOString(),
      },
    ],
    reps: [
      {
        id: adminId,
        name: 'Admin User',
        email: 'admin@company.com',
        phone: '',
        role: 'admin',
        teamId: defaultTeamId,
        hireDate: new Date().toISOString(),
        isActive: true,
      },
    ],
    installers: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ============================================================================
// PERSISTENCE
// ============================================================================

export function loadCompanyState(): CompanyState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      state = JSON.parse(stored);
    } else {
      // Initialize with default company
      const defaultCompany = createDefaultCompany();
      state = {
        companies: [defaultCompany],
        activeCompanyId: defaultCompany.id,
      };
      saveCompanyState();
    }
  } catch (error) {
    console.error('Failed to load company state:', error);
    const defaultCompany = createDefaultCompany();
    state = {
      companies: [defaultCompany],
      activeCompanyId: defaultCompany.id,
    };
  }
  return state;
}

export function saveCompanyState(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save company state:', error);
  }
}

// ============================================================================
// GETTERS
// ============================================================================

export function getState(): CompanyState {
  return state;
}

export function getCompanies(): Company[] {
  return state.companies;
}

export function getActiveCompanyId(): string {
  return state.activeCompanyId || 'default';
}

export function getActiveCompany(): Company | null {
  return state.companies.find(c => c.id === state.activeCompanyId) || null;
}

export function getCompanyById(id: string): Company | null {
  return state.companies.find(c => c.id === id) || null;
}

// ============================================================================
// SETTERS
// ============================================================================

export function setActiveCompanyId(id: string): void {
  if (state.companies.some(c => c.id === id)) {
    state.activeCompanyId = id;
    saveCompanyState();
  }
}

export function addCompany(company: Partial<Company>): Company {
  const newCompany: Company = {
    ...createDefaultCompany(company.name || 'New Company'),
    ...company,
    id: company.id || uuidv4(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  state.companies.push(newCompany);
  saveCompanyState();
  return newCompany;
}

export function updateCompany(companyObj: Partial<Company> & { id: string }): Company | null {
  const index = state.companies.findIndex(c => c.id === companyObj.id);
  if (index !== -1) {
    state.companies[index] = {
      ...state.companies[index],
      ...companyObj,
      updatedAt: new Date().toISOString(),
    };
    saveCompanyState();
    return state.companies[index];
  }
  return null;
}

export function deleteCompany(id: string): boolean {
  if (state.companies.length <= 1) {
    return false; // Cannot delete last company
  }
  const index = state.companies.findIndex(c => c.id === id);
  if (index !== -1) {
    state.companies.splice(index, 1);
    if (state.activeCompanyId === id) {
      state.activeCompanyId = state.companies[0]?.id || null;
    }
    saveCompanyState();
    return true;
  }
  return false;
}

// ============================================================================
// TEAM MANAGEMENT
// ============================================================================

export function addTeam(companyId: string, teamName: string): Team | null {
  const company = getCompanyById(companyId);
  if (!company) return null;

  const newTeam: Team = {
    id: uuidv4(),
    name: teamName,
    reps: [],
    createdAt: new Date().toISOString(),
  };

  company.teams.push(newTeam);
  updateCompany(company);
  return newTeam;
}

export function updateTeam(companyId: string, team: Team): boolean {
  const company = getCompanyById(companyId);
  if (!company) return false;

  const index = company.teams.findIndex(t => t.id === team.id);
  if (index !== -1) {
    company.teams[index] = team;
    updateCompany(company);
    return true;
  }
  return false;
}

export function deleteTeam(companyId: string, teamId: string): boolean {
  const company = getCompanyById(companyId);
  if (!company || company.teams.length <= 1) return false;

  const index = company.teams.findIndex(t => t.id === teamId);
  if (index !== -1) {
    // Unassign reps from deleted team
    company.reps.forEach(rep => {
      if (rep.teamId === teamId) {
        rep.teamId = null;
      }
    });
    company.teams.splice(index, 1);
    updateCompany(company);
    return true;
  }
  return false;
}

// ============================================================================
// REP MANAGEMENT
// ============================================================================

export function addRep(companyId: string, rep: Partial<Rep>): Rep | null {
  const company = getCompanyById(companyId);
  if (!company) return null;

  const newRep: Rep = {
    id: uuidv4(),
    name: rep.name || 'New Rep',
    email: rep.email || '',
    phone: rep.phone || '',
    role: rep.role || 'rep',
    teamId: rep.teamId || null,
    hireDate: new Date().toISOString(),
    isActive: true,
    ...rep,
  };

  company.reps.push(newRep);

  // Add to team if assigned
  if (newRep.teamId) {
    const team = company.teams.find(t => t.id === newRep.teamId);
    if (team && !team.reps.includes(newRep.id)) {
      team.reps.push(newRep.id);
    }
  }

  updateCompany(company);
  return newRep;
}

export function updateRep(companyId: string, rep: Rep): boolean {
  const company = getCompanyById(companyId);
  if (!company) return false;

  const index = company.reps.findIndex(r => r.id === rep.id);
  if (index !== -1) {
    const oldRep = company.reps[index];
    company.reps[index] = rep;

    // Handle team changes
    if (oldRep.teamId !== rep.teamId) {
      // Remove from old team
      if (oldRep.teamId) {
        const oldTeam = company.teams.find(t => t.id === oldRep.teamId);
        if (oldTeam) {
          oldTeam.reps = oldTeam.reps.filter(id => id !== rep.id);
        }
      }
      // Add to new team
      if (rep.teamId) {
        const newTeam = company.teams.find(t => t.id === rep.teamId);
        if (newTeam && !newTeam.reps.includes(rep.id)) {
          newTeam.reps.push(rep.id);
        }
      }
    }

    updateCompany(company);
    return true;
  }
  return false;
}

export function deleteRep(companyId: string, repId: string): boolean {
  const company = getCompanyById(companyId);
  if (!company) return false;

  const index = company.reps.findIndex(r => r.id === repId);
  if (index !== -1) {
    const rep = company.reps[index];
    
    // Remove from team
    if (rep.teamId) {
      const team = company.teams.find(t => t.id === rep.teamId);
      if (team) {
        team.reps = team.reps.filter(id => id !== repId);
      }
    }
    
    company.reps.splice(index, 1);
    updateCompany(company);
    return true;
  }
  return false;
}

// ============================================================================
// INSTALLER MANAGEMENT
// ============================================================================

export function addInstaller(companyId: string, installer: Partial<Installer>): Installer | null {
  const company = getCompanyById(companyId);
  if (!company) return null;

  const newInstaller: Installer = {
    id: uuidv4(),
    name: installer.name || 'New Installer',
    phone: installer.phone || '',
    email: installer.email || '',
    licenseNumber: installer.licenseNumber || '',
    rating: installer.rating || 5,
    totalInstalls: installer.totalInstalls || 0,
    isActive: true,
    ...installer,
  };

  company.installers.push(newInstaller);
  updateCompany(company);
  return newInstaller;
}

export function updateInstaller(companyId: string, installer: Installer): boolean {
  const company = getCompanyById(companyId);
  if (!company) return false;

  const index = company.installers.findIndex(i => i.id === installer.id);
  if (index !== -1) {
    company.installers[index] = installer;
    updateCompany(company);
    return true;
  }
  return false;
}

export function deleteInstaller(companyId: string, installerId: string): boolean {
  const company = getCompanyById(companyId);
  if (!company) return false;

  const index = company.installers.findIndex(i => i.id === installerId);
  if (index !== -1) {
    company.installers.splice(index, 1);
    updateCompany(company);
    return true;
  }
  return false;
}

// ============================================================================
// LOOKUP HELPERS
// ============================================================================

export function getRepById(repId: string): Rep | null {
  const company = getActiveCompany();
  if (!company) return null;
  return company.reps.find(r => r.id === repId) || null;
}

export function getRepByName(name: string): Rep | null {
  const company = getActiveCompany();
  if (!company) return null;
  return company.reps.find(r => r.name === name) || null;
}

export function getInstallerById(installerId: string): Installer | null {
  const company = getActiveCompany();
  if (!company) return null;
  return company.installers.find(i => i.id === installerId) || null;
}

export function getInstallerByName(name: string): Installer | null {
  const company = getActiveCompany();
  if (!company) return null;
  return company.installers.find(i => i.name === name) || null;
}

export function getTeamById(teamId: string): Team | null {
  const company = getActiveCompany();
  if (!company) return null;
  return company.teams.find(t => t.id === teamId) || null;
}

export function getRepsForTeam(teamId: string): Rep[] {
  const company = getActiveCompany();
  if (!company) return [];
  return company.reps.filter(r => r.teamId === teamId);
}

// ============================================================================
// INITIALIZE ON LOAD
// ============================================================================

loadCompanyState();
