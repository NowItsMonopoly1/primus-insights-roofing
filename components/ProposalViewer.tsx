
import React from 'react';
import { X, Printer, Download, CheckCircle2, Shield, Zap, Leaf, Home } from 'lucide-react';
import { Lead, SolarAnalysis, UserProfile } from '../types';
import { generateSolarHeatmap } from '../utils/heatmap';

interface ProposalViewerProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
  analysis: SolarAnalysis;
  userProfile: UserProfile;
}

export const ProposalViewer: React.FC<ProposalViewerProps> = ({ 
  isOpen, 
  onClose, 
  lead, 
  analysis,
  userProfile 
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', month: 'long', day: 'numeric' 
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <div className="bg-slate-900 w-full max-w-5xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-800">
        
        {/* Toolbar */}
        <div className="h-16 px-6 border-b border-slate-800 flex justify-between items-center bg-slate-900">
            <h2 className="text-white font-display font-bold flex items-center gap-2">
                <Zap className="text-solar-orange" size={20} />
                Proposal Preview
            </h2>
            <div className="flex gap-3">
                <button 
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-bold transition-colors print:hidden"
                >
                    <Printer size={16} /> Print / Save PDF
                </button>
                <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors print:hidden">
                    <X size={24} />
                </button>
            </div>
        </div>

        {/* Scrollable Document Area - Light Mode for Paper Feel */}
        <div className="flex-1 overflow-y-auto bg-slate-800 p-8 print:p-0 print:overflow-visible">
            <div className="max-w-[8.5in] mx-auto bg-white min-h-[11in] shadow-xl text-slate-900 print:shadow-none print:w-full">
                
                {/* PAGE 1: EXECUTIVE SUMMARY */}
                <div className="p-12 flex flex-col h-[11in] relative print:break-after-page">
                    <div className="flex justify-between items-start mb-16">
                        <div>
                            <h1 className="text-4xl font-display font-bold text-slate-900 tracking-tight">Solar Proposal</h1>
                            <p className="text-slate-500 mt-2 font-medium">Prepared for {lead.name}</p>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-slate-900 flex items-center justify-end gap-1">
                                PRIMUS <span className="text-orange-500">HOME PRO</span>
                            </div>
                            <p className="text-sm text-slate-500 mt-1">{currentDate}</p>
                            <p className="text-sm text-slate-500">Rep: {userProfile.name}</p>
                        </div>
                    </div>

                    <div className="relative mb-12 rounded-2xl overflow-hidden h-64 bg-slate-100 border border-slate-200 flex items-center justify-center">
                        <div className="scale-150 transform">
                            {/* Reusing heatmap logic visually, but normally this would be a map image */}
                            {generateSolarHeatmap(analysis)}
                        </div>
                        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-4 py-2 rounded-lg shadow-sm border border-slate-200">
                            <p className="text-xs font-bold text-slate-500 uppercase">Installation Address</p>
                            <p className="font-bold text-slate-900">{lead.address}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6 mb-12">
                        <div className="bg-orange-50 p-6 rounded-xl border border-orange-100 text-center">
                            <Zap size={24} className="mx-auto text-orange-500 mb-2" />
                            <p className="text-sm text-slate-600 font-bold uppercase">System Size</p>
                            <p className="text-3xl font-display font-bold text-slate-900">{analysis.systemSizeKw} kW</p>
                        </div>
                        <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100 text-center">
                            <Leaf size={24} className="mx-auto text-emerald-500 mb-2" />
                            <p className="text-sm text-slate-600 font-bold uppercase">Yr 1 Savings</p>
                            <p className="text-3xl font-display font-bold text-slate-900">${(analysis.estimatedMonthlySavings * 12).toLocaleString()}</p>
                        </div>
                        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 text-center">
                            <Shield size={24} className="mx-auto text-blue-500 mb-2" />
                            <p className="text-sm text-slate-600 font-bold uppercase">Offset</p>
                            <p className="text-3xl font-display font-bold text-slate-900">103%</p>
                        </div>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200 flex-1">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">Your Energy Independence Plan</h3>
                        <p className="text-slate-600 leading-relaxed mb-6">
                            Based on your roof's unique geometry ({analysis.roofPitch} pitch, {analysis.sunHoursPerDay} sun hours), we have designed a {analysis.systemSizeKw} kW system that is projected to offset 100% of your current utility usage.
                        </p>
                        <p className="text-slate-600 leading-relaxed">
                            By switching to solar, you lock in your electricity rates, protecting yourself from the average 4-6% annual utility rate hikes. This system pays for itself through monthly savings and the Federal Investment Tax Credit (ITC).
                        </p>
                    </div>
                    
                    <div className="mt-auto text-center text-xs text-slate-400">
                        Proposal ID: {lead.id}-{Date.now().toString().slice(-4)} • Valid for 7 days
                    </div>
                </div>

                {/* PAGE 2: FINANCIAL BREAKDOWN */}
                <div className="p-12 flex flex-col h-[11in] relative border-t-2 border-dashed border-slate-200 print:border-none print:break-after-page">
                    <h2 className="text-2xl font-bold text-slate-900 mb-8 pb-4 border-b border-slate-200">Financial Breakdown</h2>

                    <div className="grid grid-cols-2 gap-12 mb-12">
                        <div>
                            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Home size={18} /> Cost of Doing Nothing
                            </h3>
                            <div className="bg-slate-100 p-6 rounded-xl space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Current Avg Bill</span>
                                    <span className="font-bold text-slate-900">${lead.estimatedBill}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">10-Year Rate Hike (5%)</span>
                                    <span className="font-bold text-red-500">+$14,200</span>
                                </div>
                                <div className="pt-4 border-t border-slate-300 flex justify-between">
                                    <span className="font-bold text-slate-900">Total 25-Yr Cost</span>
                                    <span className="font-bold text-slate-900">${(lead.estimatedBill! * 12 * 25 * 1.5).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Zap size={18} className="text-orange-500" /> Your Solar Savings
                            </h3>
                            <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-xl space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-slate-700">New Solar Payment</span>
                                    <span className="font-bold text-slate-900">${analysis.estimatedMonthlyPayment}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-700">Net Monthly Savings</span>
                                    <span className="font-bold text-emerald-600">+${analysis.estimatedMonthlySavings}</span>
                                </div>
                                <div className="pt-4 border-t border-emerald-200 flex justify-between">
                                    <span className="font-bold text-slate-900">25-Yr Savings</span>
                                    <span className="font-bold text-emerald-600 text-xl">${(analysis.estimatedMonthlySavings * 12 * 25).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <h3 className="font-bold text-slate-900 mb-6">Investment Summary</h3>
                    <table className="w-full text-left mb-12">
                        <tbody className="divide-y divide-slate-200">
                            <tr className="py-4">
                                <td className="py-3 text-slate-600">Gross System Cost</td>
                                <td className="py-3 text-right font-mono font-bold text-slate-900">${analysis.systemCost.toLocaleString()}</td>
                            </tr>
                            <tr className="py-4 bg-emerald-50/50">
                                <td className="py-3 pl-4 text-emerald-700 font-medium">Federal Tax Credit (30% ITC)</td>
                                <td className="py-3 pr-4 text-right font-mono font-bold text-emerald-600">-${analysis.taxCredit30.toLocaleString()}</td>
                            </tr>
                            <tr className="py-4">
                                <td className="py-3 text-slate-900 font-bold text-lg">Net System Cost</td>
                                <td className="py-3 text-right font-mono font-bold text-slate-900 text-lg border-t-2 border-slate-900">${analysis.netCost.toLocaleString()}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div className="bg-slate-50 p-6 rounded-xl mt-auto">
                        <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-emerald-500" />
                            Next Steps
                        </h4>
                        <ol className="list-decimal list-inside space-y-2 text-sm text-slate-600">
                            <li>Sign Installation Agreement (Digital Signature)</li>
                            <li>Site Survey & Engineering Design (Days 1-7)</li>
                            <li>Permitting & Interconnection Application (Days 8-21)</li>
                            <li>Installation & Inspection (Days 22-30)</li>
                            <li>Permission to Operate (PTO) - Turn it on!</li>
                        </ol>
                    </div>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
};
