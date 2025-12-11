"use client";

import React from "react";
import { getRecommendedPlan, getFeatureMessage, type PlanFeature } from "@/services/plans";

interface PlanGateProps {
  feature: string;
  featureKey?: PlanFeature;
  customMessage?: string;
  showUpgradeButton?: boolean;
  children?: React.ReactNode;
}

export default function PlanGate({
  feature,
  featureKey,
  customMessage,
  showUpgradeButton = true,
  children
}: PlanGateProps) {
  const recommendedPlan = featureKey ? getRecommendedPlan(featureKey) : "PRO";
  const defaultMessage = featureKey ? getFeatureMessage(featureKey) : `${feature} is a premium feature`;
  const message = customMessage || defaultMessage;

  const handleUpgrade = () => {
    // In a real app, this would navigate to pricing/upgrade page
    alert(`Upgrade to ${recommendedPlan} plan to access this feature.`);
  };

  return (
    <div className="plan-gate">
      <div className="plan-gate-icon">🔒</div>
      <h3 className="plan-gate-title">{feature}</h3>
      <p className="plan-gate-message">{message}</p>

      {recommendedPlan && (
        <div className="plan-gate-badge">
          Available in <strong>{recommendedPlan}</strong> plan
        </div>
      )}

      {showUpgradeButton && (
        <button onClick={handleUpgrade} className="plan-gate-button">
          Upgrade to {recommendedPlan}
        </button>
      )}

      {children && <div className="plan-gate-extra">{children}</div>}

      <style jsx>{`
        .plan-gate {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 40px;
          background: linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%);
          border-radius: 12px;
          border: 2px dashed #cbd5e0;
          text-align: center;
          min-height: 300px;
        }

        .plan-gate-icon {
          font-size: 64px;
          margin-bottom: 20px;
          opacity: 0.7;
        }

        .plan-gate-title {
          margin: 0 0 12px 0;
          font-size: 28px;
          color: #2d3748;
          font-weight: 700;
        }

        .plan-gate-message {
          margin: 0 0 20px 0;
          font-size: 16px;
          color: #4a5568;
          max-width: 500px;
          line-height: 1.6;
        }

        .plan-gate-badge {
          display: inline-block;
          padding: 8px 16px;
          background: #fff;
          border: 2px solid #e2e8f0;
          border-radius: 20px;
          font-size: 14px;
          color: #4a5568;
          margin-bottom: 24px;
        }

        .plan-gate-badge strong {
          color: #2563eb;
          font-weight: 700;
        }

        .plan-gate-button {
          padding: 14px 32px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .plan-gate-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
        }

        .plan-gate-button:active {
          transform: translateY(0);
        }

        .plan-gate-extra {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #e2e8f0;
          width: 100%;
          max-width: 500px;
        }

        @media (max-width: 768px) {
          .plan-gate {
            padding: 40px 20px;
            min-height: 250px;
          }

          .plan-gate-icon {
            font-size: 48px;
          }

          .plan-gate-title {
            font-size: 22px;
          }

          .plan-gate-message {
            font-size: 14px;
          }

          .plan-gate-button {
            padding: 12px 24px;
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Inline PlanGate - smaller version for inline use
 */
export function InlinePlanGate({ feature, featureKey }: { feature: string; featureKey?: PlanFeature }) {
  const recommendedPlan = featureKey ? getRecommendedPlan(featureKey) : "PRO";

  return (
    <div className="inline-plan-gate">
      <span className="lock-icon">🔒</span>
      <span className="gate-text">
        {feature} <span className="gate-plan">(requires {recommendedPlan})</span>
      </span>

      <style jsx>{`
        .inline-plan-gate {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          background: #f7fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 14px;
          color: #4a5568;
        }

        .lock-icon {
          font-size: 16px;
          opacity: 0.7;
        }

        .gate-text {
          font-weight: 500;
        }

        .gate-plan {
          font-weight: 600;
          color: #2563eb;
        }
      `}</style>
    </div>
  );
}

/**
 * Badge PlanGate - badge overlay for features
 */
export function PlanBadge({ plan }: { plan: string }) {
  return (
    <div className="plan-badge">
      {plan}
      <style jsx>{`
        .plan-badge {
          display: inline-block;
          padding: 4px 10px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);
        }
      `}</style>
    </div>
  );
}
