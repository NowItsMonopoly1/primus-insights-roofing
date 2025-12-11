// services/rbac.ts
// Role-Based Access Control for Primus Home Pro

// ============================================================================
// ROLES
// ============================================================================

export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  REP: 'rep',
  INSTALLER: 'installer',
  FINANCE: 'finance',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

// ============================================================================
// PERMISSIONS
// ============================================================================

export const PERMISSIONS = {
  // Lead Permissions
  VIEW_LEADS: ['admin', 'manager', 'rep'],
  EDIT_LEADS: ['admin', 'manager'],
  DELETE_LEADS: ['admin'],
  ROUTE_LEADS: ['admin', 'manager'],
  ASSIGN_LEADS: ['admin', 'manager'],
  
  // Project Permissions
  VIEW_PROJECTS: ['admin', 'manager', 'installer'],
  EDIT_PROJECTS: ['admin', 'manager'],
  DELETE_PROJECTS: ['admin'],
  UPDATE_PROJECT_STATUS: ['admin', 'manager', 'installer'],
  
  // Commission Permissions
  VIEW_COMMISSIONS: ['admin', 'manager', 'finance'],
  MODIFY_COMMISSIONS: ['admin', 'finance'],
  APPROVE_COMMISSIONS: ['admin', 'finance'],
  PAY_COMMISSIONS: ['admin', 'finance'],
  
  // Analytics & Reports
  VIEW_ANALYTICS: ['admin', 'manager'],
  VIEW_REVENUE_FORECAST: ['admin', 'manager', 'finance'],
  VIEW_INSTALLER_METRICS: ['admin', 'manager'],
  VIEW_HEALTH_SCORE: ['admin', 'manager'],
  VIEW_AI_COPILOT: ['admin', 'manager'],
  
  // AI Features
  USE_AI_SCORING: ['admin', 'manager', 'rep'],
  USE_BLINDSPOT_DETECTOR: ['admin', 'manager', 'rep'],
  USE_DEAL_COACHING: ['admin', 'manager', 'rep'],
  
  // Company Administration
  COMPANY_SETTINGS: ['admin'],
  MANAGE_TEAMS: ['admin'],
  MANAGE_REPS: ['admin', 'manager'],
  MANAGE_INSTALLERS: ['admin', 'manager'],
  VIEW_ALL_REPS: ['admin', 'manager'],
  
  // User Profile
  EDIT_OWN_PROFILE: ['admin', 'manager', 'rep', 'installer', 'finance'],
  VIEW_USER_DIRECTORY: ['admin', 'manager'],
} as const;

export type Permission = keyof typeof PERMISSIONS;

// ============================================================================
// PERMISSION CHECK
// ============================================================================

/**
 * Check if a user role has a specific permission
 */
export function can(userRole: Role | string, permission: Permission): boolean {
  const allowedRoles = PERMISSIONS[permission];
  if (!allowedRoles) {
    console.warn(`Unknown permission: ${permission}`);
    return false;
  }
  return (allowedRoles as readonly string[]).includes(userRole);
}

/**
 * Check if user has any of the specified permissions
 */
export function canAny(userRole: Role | string, permissions: Permission[]): boolean {
  return permissions.some(permission => can(userRole, permission));
}

/**
 * Check if user has all of the specified permissions
 */
export function canAll(userRole: Role | string, permissions: Permission[]): boolean {
  return permissions.every(permission => can(userRole, permission));
}

// ============================================================================
// ROLE UTILITIES
// ============================================================================

/**
 * Get all permissions for a role
 */
export function getPermissionsForRole(role: Role): Permission[] {
  return (Object.keys(PERMISSIONS) as Permission[]).filter(
    permission => (PERMISSIONS[permission] as readonly string[]).includes(role)
  );
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: Role): string {
  const displayNames: Record<Role, string> = {
    admin: 'Administrator',
    manager: 'Manager',
    rep: 'Sales Rep',
    installer: 'Installer',
    finance: 'Finance',
  };
  return displayNames[role] || role;
}

/**
 * Get role badge color class
 */
export function getRoleBadgeColor(role: Role): string {
  const colors: Record<Role, string> = {
    admin: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    manager: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    rep: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    installer: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    finance: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  };
  return colors[role] || 'bg-slate-500/20 text-slate-400 border-slate-500/30';
}

/**
 * Check if role is elevated (admin or manager)
 */
export function isElevatedRole(role: Role): boolean {
  return role === 'admin' || role === 'manager';
}

/**
 * Get role hierarchy level (higher = more permissions)
 */
export function getRoleLevel(role: Role): number {
  const levels: Record<Role, number> = {
    admin: 100,
    manager: 80,
    finance: 60,
    rep: 40,
    installer: 20,
  };
  return levels[role] || 0;
}

/**
 * Check if roleA can manage roleB (has higher or equal level)
 */
export function canManageRole(managerRole: Role, targetRole: Role): boolean {
  return getRoleLevel(managerRole) > getRoleLevel(targetRole);
}

// ============================================================================
// PERMISSION GROUPS (for UI sections)
// ============================================================================

export const PERMISSION_GROUPS = {
  SALES: {
    label: 'Sales',
    permissions: ['VIEW_LEADS', 'EDIT_LEADS', 'DELETE_LEADS', 'ROUTE_LEADS', 'ASSIGN_LEADS'] as Permission[],
  },
  OPERATIONS: {
    label: 'Operations',
    permissions: ['VIEW_PROJECTS', 'EDIT_PROJECTS', 'DELETE_PROJECTS', 'UPDATE_PROJECT_STATUS'] as Permission[],
  },
  FINANCE: {
    label: 'Finance',
    permissions: ['VIEW_COMMISSIONS', 'MODIFY_COMMISSIONS', 'APPROVE_COMMISSIONS', 'PAY_COMMISSIONS'] as Permission[],
  },
  ANALYTICS: {
    label: 'Analytics',
    permissions: ['VIEW_ANALYTICS', 'VIEW_REVENUE_FORECAST', 'VIEW_INSTALLER_METRICS', 'VIEW_HEALTH_SCORE', 'VIEW_AI_COPILOT'] as Permission[],
  },
  AI_FEATURES: {
    label: 'AI Features',
    permissions: ['USE_AI_SCORING', 'USE_BLINDSPOT_DETECTOR', 'USE_DEAL_COACHING'] as Permission[],
  },
  ADMINISTRATION: {
    label: 'Administration',
    permissions: ['COMPANY_SETTINGS', 'MANAGE_TEAMS', 'MANAGE_REPS', 'MANAGE_INSTALLERS', 'VIEW_ALL_REPS', 'VIEW_USER_DIRECTORY'] as Permission[],
  },
};

// ============================================================================
// ROLE OPTIONS FOR DROPDOWNS
// ============================================================================

export const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: 'admin', label: 'Administrator' },
  { value: 'manager', label: 'Manager' },
  { value: 'rep', label: 'Sales Rep' },
  { value: 'installer', label: 'Installer' },
  { value: 'finance', label: 'Finance' },
];
