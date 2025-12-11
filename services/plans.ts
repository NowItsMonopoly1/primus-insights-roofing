/**
 * Plan Awareness System
 * Defines subscription tiers and feature gating
 */

export type PlanType = "FREE" | "PRO" | "ENTERPRISE";

export type PlanFeature =
  | "MAX_REPS"
  | "CUSTOM_PIPELINES"
  | "ADVANCED_ANALYTICS"
  | "AI_COPILOT"
  | "WHITE_LABEL"
  | "MULTI_COMPANY"
  | "CUSTOM_FIELDS"
  | "API_ACCESS"
  | "PRIORITY_SUPPORT"
  | "REVENUE_FORECASTING"
  | "COMMISSION_TRACKING"
  | "AUDIT_LOGS"
  | "DATA_EXPORT"
  | "SSO";

export interface PlanConfig {
  id: PlanType;
  name: string;
  description: string;
  price: number;
  features: {
    [key in PlanFeature]?: number | boolean;
  };
}

export const PLANS: Record<PlanType, PlanConfig> = {
  FREE: {
    id: "FREE",
    name: "Free",
    description: "Essential features for small teams",
    price: 0,
    features: {
      MAX_REPS: 3,
      CUSTOM_PIPELINES: false,
      ADVANCED_ANALYTICS: false,
      AI_COPILOT: false,
      WHITE_LABEL: false,
      MULTI_COMPANY: false,
      CUSTOM_FIELDS: false,
      API_ACCESS: false,
      PRIORITY_SUPPORT: false,
      REVENUE_FORECASTING: false,
      COMMISSION_TRACKING: false,
      AUDIT_LOGS: false,
      DATA_EXPORT: false,
      SSO: false
    }
  },

  PRO: {
    id: "PRO",
    name: "Pro",
    description: "Advanced features for growing businesses",
    price: 99,
    features: {
      MAX_REPS: 25,
      CUSTOM_PIPELINES: true,
      ADVANCED_ANALYTICS: true,
      AI_COPILOT: true,
      WHITE_LABEL: false,
      MULTI_COMPANY: false,
      CUSTOM_FIELDS: true,
      API_ACCESS: true,
      PRIORITY_SUPPORT: false,
      REVENUE_FORECASTING: true,
      COMMISSION_TRACKING: true,
      AUDIT_LOGS: true,
      DATA_EXPORT: true,
      SSO: false
    }
  },

  ENTERPRISE: {
    id: "ENTERPRISE",
    name: "Enterprise",
    description: "Complete platform with unlimited capabilities",
    price: 499,
    features: {
      MAX_REPS: Infinity,
      CUSTOM_PIPELINES: true,
      ADVANCED_ANALYTICS: true,
      AI_COPILOT: true,
      WHITE_LABEL: true,
      MULTI_COMPANY: true,
      CUSTOM_FIELDS: true,
      API_ACCESS: true,
      PRIORITY_SUPPORT: true,
      REVENUE_FORECASTING: true,
      COMMISSION_TRACKING: true,
      AUDIT_LOGS: true,
      DATA_EXPORT: true,
      SSO: true
    }
  }
};

/**
 * Check if a plan has a specific feature
 */
export function hasFeature(plan: PlanType, feature: PlanFeature): boolean {
  const planConfig = PLANS[plan];
  if (!planConfig) return false;

  const featureValue = planConfig.features[feature];
  if (typeof featureValue === "boolean") return featureValue;
  if (typeof featureValue === "number") return featureValue > 0;
  return false;
}

/**
 * Get feature limit for a plan
 */
export function getFeatureLimit(plan: PlanType, feature: PlanFeature): number {
  const planConfig = PLANS[plan];
  if (!planConfig) return 0;

  const featureValue = planConfig.features[feature];
  if (typeof featureValue === "number") return featureValue;
  return featureValue ? Infinity : 0;
}

/**
 * Check if usage is within plan limits
 */
export function isWithinLimit(plan: PlanType, feature: PlanFeature, currentUsage: number): boolean {
  const limit = getFeatureLimit(plan, feature);
  return currentUsage < limit;
}

/**
 * Get recommended plan for a feature
 */
export function getRecommendedPlan(feature: PlanFeature): PlanType | null {
  for (const planType of ["PRO", "ENTERPRISE"] as PlanType[]) {
    if (hasFeature(planType, feature)) {
      return planType;
    }
  }
  return null;
}

/**
 * Get plan upgrade path
 */
export function getUpgradePath(currentPlan: PlanType): PlanType | null {
  if (currentPlan === "FREE") return "PRO";
  if (currentPlan === "PRO") return "ENTERPRISE";
  return null;
}

/**
 * Get feature availability message
 */
export function getFeatureMessage(feature: PlanFeature): string {
  const messages: Record<PlanFeature, string> = {
    MAX_REPS: "Maximum number of sales representatives",
    CUSTOM_PIPELINES: "Custom sales pipeline stages and workflows",
    ADVANCED_ANALYTICS: "Advanced analytics and reporting dashboards",
    AI_COPILOT: "AI-powered sales assistant and insights",
    WHITE_LABEL: "White-label branding and customization",
    MULTI_COMPANY: "Multi-company management and tenant isolation",
    CUSTOM_FIELDS: "Custom fields and data structures",
    API_ACCESS: "REST API access for integrations",
    PRIORITY_SUPPORT: "Priority customer support",
    REVENUE_FORECASTING: "Advanced revenue forecasting and projections",
    COMMISSION_TRACKING: "Commission tracking and calculations",
    AUDIT_LOGS: "Comprehensive audit logging",
    DATA_EXPORT: "Data export and backup tools",
    SSO: "Single sign-on and enterprise authentication"
  };

  return messages[feature] || "Premium feature";
}

/**
 * Compare two plans
 */
export function comparePlans(plan1: PlanType, plan2: PlanType): number {
  const order: PlanType[] = ["FREE", "PRO", "ENTERPRISE"];
  return order.indexOf(plan1) - order.indexOf(plan2);
}

/**
 * Get all available plans
 */
export function getAllPlans(): PlanConfig[] {
  return Object.values(PLANS);
}
