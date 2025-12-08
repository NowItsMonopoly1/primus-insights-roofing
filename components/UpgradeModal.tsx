
import React from 'react';
import type { PlanId } from "../types";
import { startCheckout } from "../services/billing";
import { X, Check, Zap, Crown, Building, Shield } from 'lucide-react';
import { SUBSCRIPTION_PLANS } from '../constants';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiredPlan: PlanId | null;
}

export function UpgradeModal({ isOpen, onClose, requiredPlan }: UpgradeModalProps) {
  if (!isOpen || !requiredPlan) return null;

  const targetPlan = SUBSCRIPTION_PLANS.find(p => p.id === requiredPlan);
  if (!targetPlan) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl relative overflow-hidden animate-fade-in z-10 flex flex-col">
        
        {/* Header with decorative background */}
        <div className="relative p-8 pb-6 border-b border-slate-800 overflow-hidden">
            <div className={`absolute inset-0 opacity-10 ${targetPlan.id === 'TITAN' ? 'bg-purple-600' : targetPlan.id === 'EMPIRE' ? 'bg-emerald-600' : 'bg-solar-orange'}`}></div>
            
            <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors z-20">
                <X size={20} />
            </button>

            <div className="relative z-10">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Unlock Feature</p>
                <h2 className="text-2xl font-display font-bold text-white flex items-center gap-3">
                    Upgrade to {targetPlan.name}
                    {targetPlan.id === 'TITAN' && <Crown className="text-purple-400" size={24} />}
                    {targetPlan.id === 'EMPIRE' && <Building className="text-emerald-400" size={24} />}
                    {targetPlan.id === 'CLOSER' && <Zap className="text-solar-orange" size={24} />}
                </h2>
                <p className="text-slate-300 mt-2 text-sm">{targetPlan.description}</p>
            </div>
        </div>

        {/* Benefits List */}
        <div className="p-8 space-y-6 bg-slate-950/50">
            <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide">What you get:</h3>
                <ul className="space-y-2">
                    {targetPlan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                            <div className={`mt-0.5 p-0.5 rounded-full ${targetPlan.color.replace('text-', 'bg-').replace('400', '500')} text-slate-900`}>
                                <Check size={10} strokeWidth={4} />
                            </div>
                            {feature}
                        </li>
                    ))}
                </ul>
            </div>

            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                    <p className="text-xs text-slate-500 font-bold uppercase">Price</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-white">${targetPlan.price}</span>
                        <span className="text-sm text-slate-500">/mo</span>
                    </div>
                </div>
                <button
                    onClick={() => startCheckout(requiredPlan)}
                    className={`px-6 py-3 rounded-xl text-sm font-bold text-white shadow-lg transition-all active:scale-95 ${targetPlan.btnColor}`}
                >
                    Upgrade Now
                </button>
            </div>
        </div>
        
        <div className="p-4 bg-slate-900 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-500">Secure payment via Stripe. Cancel anytime.</p>
        </div>
      </div>
    </div>
  );
}
