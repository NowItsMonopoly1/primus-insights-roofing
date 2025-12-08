
import React, { useState } from 'react';
import { Check, CreditCard, Download, Shield, Zap, Sparkles, Building, CheckCircle2, Crown } from 'lucide-react';
import { UserProfile, PlanId } from '../types';
import { SUBSCRIPTION_PLANS } from '../constants';

interface PricingPageProps {
  userProfile: UserProfile;
  onRequestUpgrade: (plan: PlanId) => void;
}

const INVOICES = [
  { id: 'INV-2024-001', date: 'Dec 01, 2025', amount: 48.00, status: 'Paid' },
  { id: 'INV-2024-002', date: 'Nov 01, 2025', amount: 48.00, status: 'Paid' },
  { id: 'INV-2024-003', date: 'Oct 01, 2025', amount: 48.00, status: 'Paid' },
];

export const PricingPage: React.FC<PricingPageProps> = ({ userProfile, onRequestUpgrade }) => {
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleSubscribe = (planId: string) => {
    setIsLoading(planId);
    // Simulate Stripe Redirect
    setTimeout(() => {
        setIsLoading(null);
        alert(`Redirecting to Stripe Checkout for ${planId} plan...`);
    }, 1500);
  };

  return (
    <div className="space-y-12 animate-fade-in max-w-7xl mx-auto pb-10">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h2 className="text-3xl font-display font-bold text-slate-100 flex items-center gap-3">
             <CreditCard className="text-emerald-500" />
             Billing & Subscription
          </h2>
          <p className="text-slate-400 mt-1 max-w-xl">
             Choose the plan that fits your growth. Upgrade to <strong className="text-solar-orange">Closer</strong> to unlock AI signing, or <strong className="text-purple-400">Titan</strong> to run your entire dealership.
          </p>
        </div>
        
        {/* Billing Toggle */}
        <div className="bg-slate-900 p-1 rounded-lg border border-slate-800 flex items-center">
            <button 
                onClick={() => setBillingCycle('MONTHLY')}
                className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${billingCycle === 'MONTHLY' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
            >
                Monthly
            </button>
            <button 
                onClick={() => setBillingCycle('YEARLY')}
                className={`px-4 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${billingCycle === 'YEARLY' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
            >
                Yearly <span className="text-[9px] text-slate-900 bg-emerald-400 px-1.5 py-0.5 rounded font-bold">-20%</span>
            </button>
        </div>
      </div>

      {/* Pricing Cards - 4 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {SUBSCRIPTION_PLANS.map((plan) => {
            const isCurrent = userProfile.plan === plan.id;
            // Determine if this plan is "higher" than current (simple check for demo)
            const planOrder = ['FREE', 'PRO', 'TEAM', 'DEALER'];
            const currentIdx = planOrder.indexOf(userProfile.plan);
            const thisIdx = planOrder.indexOf(plan.id);
            const isUpgrade = thisIdx > currentIdx;
            const isDowngrade = thisIdx < currentIdx;

            return (
                <div key={plan.id} className={`glass-panel p-6 rounded-2xl border transition-all relative flex flex-col ${isCurrent ? 'border-emerald-500/50 bg-emerald-900/5' : plan.highlight ? 'border-solar-orange/50 shadow-2xl shadow-solar-orange/5' : 'border-slate-800 hover:border-slate-700'}`}>
                    
                    {plan.highlight && (
                        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-yellow-500 to-red-500 rounded-t-2xl"></div>
                    )}
                    
                    {plan.highlight && !isCurrent && (
                         <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                             <span className="text-[10px] font-bold bg-solar-orange text-white px-3 py-1 rounded-full shadow-lg shadow-orange-500/30 tracking-wide uppercase">
                                 Best Value
                             </span>
                         </div>
                    )}
                    
                    {isCurrent && (
                        <div className="absolute top-4 right-4">
                            <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <CheckCircle2 size={10} /> Active
                            </span>
                        </div>
                    )}
                    
                    <div className="mb-4 mt-2">
                        <h3 className={`text-xl font-bold ${plan.color} flex items-center gap-2`}>
                            {plan.id === 'FREE' && <Shield size={20}/>}
                            {plan.id === 'PRO' && <Zap size={20}/>}
                            {plan.id === 'TEAM' && <Building size={20}/>}
                            {plan.id === 'DEALER' && <Crown size={20}/>}
                            {plan.name}
                        </h3>
                        <p className="text-xs text-slate-400 mt-2 h-10 leading-relaxed">{plan.description}</p>
                    </div>

                    <div className="mb-6 pb-6 border-b border-slate-800/50">
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-display font-bold text-slate-100">
                                ${billingCycle === 'MONTHLY' ? plan.price : Math.round(plan.priceYearly / 12)}
                            </span>
                            <span className="text-slate-500 text-sm font-medium">/mo</span>
                        </div>
                        {billingCycle === 'YEARLY' && plan.price > 0 && (
                            <p className="text-xs text-emerald-500 mt-1 font-medium">Billed ${plan.priceYearly} yearly</p>
                        )}
                        {billingCycle === 'MONTHLY' && plan.price > 0 && (
                            <p className="text-xs text-slate-600 mt-1">Billed monthly</p>
                        )}
                    </div>

                    <div className="space-y-4 mb-8 flex-1">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            {plan.id === 'FREE' ? 'Includes:' : `Everything in ${SUBSCRIPTION_PLANS[thisIdx-1]?.name}, plus:`}
                        </p>
                        {plan.features.map((feat, i) => (
                            <div key={i} className="flex items-start gap-3 text-sm text-slate-300">
                                <div className={`mt-1 p-0.5 rounded-full ${plan.highlight || isCurrent ? 'bg-emerald-500 text-slate-900' : 'bg-slate-800 text-slate-400'}`}>
                                    <Check size={8} strokeWidth={4} />
                                </div>
                                <span className="text-xs leading-relaxed">{feat}</span>
                            </div>
                        ))}
                    </div>

                    <button 
                        onClick={() => !isCurrent && handleSubscribe(plan.name)}
                        disabled={isCurrent || isLoading !== null}
                        className={`w-full py-3 rounded-xl text-sm font-bold transition-all active:scale-95 ${isCurrent ? 'bg-slate-800 text-slate-500 cursor-default border border-slate-700' : plan.btnColor}`}
                    >
                        {isLoading === plan.name ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                Processing...
                            </span>
                        ) : isCurrent ? 'Current Plan' : isDowngrade ? 'Downgrade' : 'Upgrade Now'}
                    </button>
                </div>
            );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Payment Method */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <CreditCard size={16} className="text-slate-500"/> Payment Method
              </h3>
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                      <div className="w-10 h-6 bg-slate-200 rounded flex items-center justify-center">
                          <span className="text-[10px] font-bold text-slate-900">VISA</span>
                      </div>
                      <div>
                          <p className="text-sm font-bold text-slate-200">•••• 4242</p>
                          <p className="text-xs text-slate-500">Expires 12/28</p>
                      </div>
                  </div>
                  <span className="text-xs bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded border border-emerald-500/20">Default</span>
              </div>
              <button className="text-xs text-solar-orange hover:text-white transition-colors font-medium">
                  + Add new payment method
              </button>
          </div>

          {/* Invoice History */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Download size={16} className="text-slate-500"/> Invoice History
              </h3>
              <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                      <thead className="text-xs text-slate-500 uppercase font-bold bg-slate-900/50">
                          <tr>
                              <th className="px-4 py-2 rounded-l-lg">Date</th>
                              <th className="px-4 py-2">Invoice</th>
                              <th className="px-4 py-2">Amount</th>
                              <th className="px-4 py-2">Status</th>
                              <th className="px-4 py-2 text-right rounded-r-lg">Download</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                          {INVOICES.map((inv) => (
                              <tr key={inv.id}>
                                  <td className="px-4 py-3 text-slate-300">{inv.date}</td>
                                  <td className="px-4 py-3 text-slate-400 font-mono text-xs">{inv.id}</td>
                                  <td className="px-4 py-3 text-slate-200 font-bold">${inv.amount.toFixed(2)}</td>
                                  <td className="px-4 py-3">
                                      <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                                          <Check size={10} /> {inv.status}
                                      </span>
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                      <button className="text-slate-500 hover:text-white transition-colors">
                                          <Download size={14} />
                                      </button>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      </div>
    </div>
  );
};
