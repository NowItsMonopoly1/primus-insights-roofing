
import type { PlanId } from "../types";

export const USER_PLAN_KEY = "primus_user_plan";

const PLAN_ORDER: PlanId[] = ["FREE", "PRO", "TEAM", "DEALER"];

export const FEATURE_GATES = {
  contractSign: "PRO",
  dealCopilot: "PRO",
  leadRouting: "TEAM",
  teamDashboard: "TEAM",
  commissionTracker: "TEAM",
  complianceShield: "DEALER",
  integrations: "DEALER",
} as const;

export type FeatureKey = keyof typeof FEATURE_GATES;

export function hasAccess(currentPlan: PlanId, feature: FeatureKey): boolean {
  const required = FEATURE_GATES[feature];
  return PLAN_ORDER.indexOf(currentPlan) >= PLAN_ORDER.indexOf(required);
}

export function getRequiredPlan(feature: FeatureKey): PlanId {
    return FEATURE_GATES[feature];
}