/**
 * Tenant Management System
 * Wraps companyStore with multi-tenant and mode-aware operations
 */

import {
  getCompanies,
  getCompanyById,
  addCompany,
  deleteCompany as deleteCompanyFromStore,
  setActiveCompanyId,
  createDefaultCompany,
  type Company
} from "./companyStore";
import { isBuilderMode } from "./mode";
import { type PlanType } from "./plans";
import { logAudit } from "./auditLog";

export interface TenantInfo extends Company {
  plan: PlanType;
  repCount: number;
  createdDate: string;
}

/**
 * Get all companies (tenants)
 * Only available in builder mode
 */
export function getAllCompanies(): TenantInfo[] {
  if (!isBuilderMode()) {
    console.warn("getAllCompanies() only available in builder mode");
    return [];
  }

  const companies = getCompanies();
  return companies.map(company => ({
    ...company,
    plan: getTenantPlan(company.id),
    repCount: company.reps.length,
    createdDate: company.createdAt
  }));
}

/**
 * Create a new company (tenant)
 * Only available in builder mode
 */
export function createCompany(name: string, plan: PlanType = "FREE"): Company | null {
  if (!isBuilderMode()) {
    console.warn("createCompany() only available in builder mode");
    return null;
  }

  try {
    const newCompany = addCompany({ name });

    // Set initial plan
    setTenantPlan(newCompany.id, plan);

    // Log audit
    logAudit({
      action: "company_created",
      entity: "company",
      entityId: newCompany.id,
      userId: "system",
      metadata: { name, plan }
    });

    return newCompany;
  } catch (error) {
    console.error("Failed to create company:", error);
    return null;
  }
}

/**
 * Delete a company (tenant)
 * Only available in builder mode
 */
export function deleteCompanyTenant(companyId: string): boolean {
  if (!isBuilderMode()) {
    console.warn("deleteCompany() only available in builder mode");
    return false;
  }

  try {
    const company = getCompanyById(companyId);
    if (!company) return false;

    const success = deleteCompanyFromStore(companyId);

    if (success) {
      // Clean up associated data
      removeTenantPlan(companyId);

      // Log audit
      logAudit({
        action: "company_deleted",
        entity: "company",
        entityId: companyId,
        userId: "system",
        metadata: { name: company.name }
      });
    }

    return success;
  } catch (error) {
    console.error("Failed to delete company:", error);
    return false;
  }
}

/**
 * Switch to a different company
 * Available in builder mode only
 */
export function switchToCompany(companyId: string): boolean {
  if (!isBuilderMode()) {
    console.warn("switchToCompany() only available in builder mode");
    return false;
  }

  try {
    const company = getCompanyById(companyId);
    if (!company) {
      console.error(`Company ${companyId} not found`);
      return false;
    }

    setActiveCompanyId(companyId);

    // Log audit
    logAudit({
      action: "company_switched",
      entity: "company",
      entityId: companyId,
      userId: "system",
      metadata: { name: company.name }
    });

    return true;
  } catch (error) {
    console.error("Failed to switch company:", error);
    return false;
  }
}

/**
 * Get company count
 */
export function getCompanyCount(): number {
  return getCompanies().length;
}

/**
 * Get tenant plan
 */
export function getTenantPlan(companyId: string): PlanType {
  try {
    const stored = localStorage.getItem(`tenant_plan_${companyId}`);
    if (stored && (stored === "FREE" || stored === "PRO" || stored === "ENTERPRISE")) {
      return stored as PlanType;
    }
  } catch (error) {
    console.error("Failed to get tenant plan:", error);
  }
  return "FREE";
}

/**
 * Set tenant plan
 */
export function setTenantPlan(companyId: string, plan: PlanType): void {
  try {
    localStorage.setItem(`tenant_plan_${companyId}`, plan);

    // Log audit
    logAudit({
      action: "plan_updated",
      entity: "company",
      entityId: companyId,
      userId: "system",
      metadata: { plan }
    });
  } catch (error) {
    console.error("Failed to set tenant plan:", error);
    throw error;
  }
}

/**
 * Remove tenant plan
 */
function removeTenantPlan(companyId: string): void {
  try {
    localStorage.removeItem(`tenant_plan_${companyId}`);
  } catch (error) {
    console.error("Failed to remove tenant plan:", error);
  }
}

/**
 * Validate tenant isolation
 * Ensures data access is scoped to the correct company
 */
export function validateTenantAccess(companyId: string, userId: string): boolean {
  const company = getCompanyById(companyId);
  if (!company) return false;

  // Check if user belongs to this company
  const userExists = company.reps.some(rep => rep.id === userId);
  return userExists;
}

/**
 * Get tenant statistics
 */
export function getTenantStats(companyId: string) {
  const company = getCompanyById(companyId);
  if (!company) return null;

  return {
    companyId: company.id,
    companyName: company.name,
    plan: getTenantPlan(companyId),
    repCount: company.reps.length,
    teamCount: company.teams.length,
    installerCount: company.installers.length,
    createdAt: company.createdAt,
    updatedAt: company.updatedAt
  };
}

/**
 * Initialize default tenant if none exists
 */
export function initializeDefaultTenant(): void {
  const companies = getCompanies();
  if (companies.length === 0) {
    const defaultCompany = createDefaultCompany("Primus Home Pro");
    addCompany(defaultCompany);
    setTenantPlan(defaultCompany.id, "PRO");
  }
}
