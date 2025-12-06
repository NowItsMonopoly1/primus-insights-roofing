
import React, { useState, useEffect } from 'react';
import { MOCK_LEADS, MOCK_SOLAR_ANALYSIS } from '../constants';
import { simulateSolarAnalysis, generateProposalStrategy, dealCopilotSuggestions, analyzeCompliance } from '../services/geminiService';
import { SolarAnalysis, ComplianceAnalysis } from '../types';
import { Sun, Zap, Loader2, Sparkles, MessageSquare, Calculator, Shield, AlertTriangle, CheckCircle2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { generateSolarHeatmap } from '../utils/heatmap';

const SolarIntelligence: React.FC = () => {
  const [leadId, setLeadId] = useState<string>(MOCK_LEADS[0]?.id || "");
  const [analysis, setAnalysis] = useState<SolarAnalysis | null>(MOCK_SOLAR_ANALYSIS[0] || null);
  const [proposal, setProposal] = useState("");
  const [dealHelp, setDealHelp] = useState("");
  const [compliance, setCompliance] = useState<ComplianceAnalysis | null>(null);
  
  const [activeTab, setActiveTab] = useState<'ANALYSIS' | 'COPILOT' | 'COMPLIANCE'>('ANALYSIS');
  
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [loadingCopilot, setLoadingCopilot] = useState(false);
  const [loadingCompliance, setLoadingCompliance] = useState(false);

  const selectedLead = MOCK_LEADS.find(l => l.id === leadId);

  // When lead changes, reset localized state
  useEffect(() => {
    setProposal("");
    setDealHelp("");
    setCompliance(null);
    const existing = MOCK_SOLAR_ANALYSIS.find(a => a.leadId === leadId);
    setAnalysis(existing || null);
    if (existing) {
        // Run light compliance check automatically if analysis exists
        runComplianceCheck(selectedLead!, existing);
    }
  }, [leadId]);

  const runAnalysis = async () => {
    if (!selectedLead) return;
    setLoadingAnalysis(true);
    const a = await simulateSolarAnalysis(selectedLead);
    setAnalysis(a);
    const p = await generateProposalStrategy(selectedLead, a);
    setProposal(p);
    
    // Chain compliance check
    runComplianceCheck(selectedLead, a);
    
    setLoadingAnalysis(false);
  };

  const runDealCopilot = async () => {
    if (!selectedLead) return;
    setLoadingCopilot(true);
    const help = await dealCopilotSuggestions(selectedLead, "PERMITTING"); // Hardcoded stage for demo context
    setDealHelp(help);
    setLoadingCopilot(false);
  };

  const runComplianceCheck = async (lead: typeof selectedLead, an: SolarAnalysis) => {
    if (!lead || !an) return;
    setLoadingCompliance(true);
    const comp = await analyzeCompliance(lead, an);
    setCompliance(comp);
    setLoadingCompliance(false);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-display font-bold text-slate-100 flex items-center gap-3">
            <Sun className="text-solar-orange" />
            Solar Intelligence
          </h2>
          <p className="text-slate-400 mt-1">AI-powered roof analysis, deal coaching, and ethical auditing.</p>
        </div>
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-700 p-1 rounded-lg">
           <select 
             className="bg-transparent text-slate-300 text-sm border-none focus:ring-0 cursor-pointer py-1 px-3 min-w-[200px]"
             value={leadId}
             onChange={(e) => setLeadId(e.target.value)}
           >
             {MOCK_LEADS.map(lead => (
               <option key={lead.id} value={lead.id}>{lead.name} - {lead.address}</option>
             ))}
           </select>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
          <button 
            onClick={() => setActiveTab('ANALYSIS')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'ANALYSIS' ? 'bg-slate-800 text-white border border-slate-600' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Roof & Financials
          </button>
          <button 
            onClick={() => setActiveTab('COPILOT')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'COPILOT' ? 'bg-slate-800 text-white border border-slate-600' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Deal Copilot
          </button>
          <button 
            onClick={() => setActiveTab('COMPLIANCE')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'COMPLIANCE' ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/50' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Shield size={14} />
            Ethics Shield
          </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Context Aware */}
        <div className="space-y-6">
            {/* Analysis Card */}
            <div className="glass-panel rounded-2xl p-6 border border-slate-700/50 shadow-xl">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-200">System Metrics</h3>
                    <button 
                        onClick={runAnalysis}
                        disabled={loadingAnalysis}
                        className="text-xs bg-solar-orange/10 hover:bg-solar-orange/20 text-solar-orange border border-solar-orange/50 px-3 py-1.5 rounded-lg font-bold transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                        {loadingAnalysis ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                        Run Intelligence
                    </button>
                </div>

                {analysis ? (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                                <div className="text-xs text-slate-500 uppercase">System Size</div>
                                <div className="text-xl font-mono font-bold text-white">{analysis.systemSizeKw} <span className="text-xs text-slate-500">kW</span></div>
                            </div>
                            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                                <div className="text-xs text-slate-500 uppercase">Viability</div>
                                <div className={`text-xl font-mono font-bold ${analysis.viabilityScore > 80 ? 'text-green-400' : 'text-yellow-400'}`}>
                                    {analysis.viabilityScore}<span className="text-sm">/100</span>
                                </div>
                            </div>
                        </div>
                        {generateSolarHeatmap(analysis)}
                    </div>
                ) : (
                    <div className="text-center py-10 text-slate-500 text-sm">
                        Select a lead and run analysis.
                    </div>
                )}
            </div>

             {/* Financials (Always Visible) */}
            {analysis && (
              <div className="glass-panel rounded-2xl p-6 border border-slate-700/50 shadow-xl relative overflow-hidden">
                  <h3 className="text-lg font-bold text-slate-200 mb-6 flex items-center gap-2 relative z-10">
                    <Calculator size={18} className="text-emerald-500"/> Financial Snapshot
                  </h3>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                        <div className="bg-emerald-900/20 p-4 rounded-xl border border-emerald-500/30 text-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-emerald-500/5 animate-pulse-slow"></div>
                            <div className="relative z-10">
                              <div className="text-xs text-emerald-400 uppercase font-bold mb-1">New Pmt</div>
                              <div className="text-2xl font-display font-bold text-white">${analysis.estimatedMonthlyPayment}</div>
                            </div>
                        </div>
                         <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 text-center">
                            <div className="text-xs text-slate-400 uppercase font-bold mb-1">Savings</div>
                            <div className="text-2xl font-display font-bold text-emerald-400">+${analysis.estimatedMonthlySavings}</div>
                        </div>
                    </div>
              </div>
            )}
        </div>

        {/* Right Column: Dynamic Tabs */}
        <div className="space-y-6">
           
           {activeTab === 'ANALYSIS' && (
              <div className="glass-panel rounded-2xl p-6 border border-slate-700/50 min-h-[400px] animate-fade-in">
                <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
                    <Zap size={18} className="text-yellow-400"/> Proposal Strategy
                </h3>
                {proposal ? (
                   <div className="prose prose-invert prose-sm">
                         <ReactMarkdown>{proposal}</ReactMarkdown>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-48 text-slate-600 text-sm">
                      <p>Run analysis to generate closing strategy.</p>
                    </div>
                )}
              </div>
           )}

           {activeTab === 'COPILOT' && (
              <div className="glass-panel rounded-2xl p-6 border border-slate-700/50 flex flex-col min-h-[400px] animate-fade-in">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                        <MessageSquare size={18} className="text-blue-400"/> Objection Handlers
                    </h3>
                    <button 
                        onClick={runDealCopilot}
                        disabled={loadingCopilot}
                        className="secondary-btn text-xs bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg border border-slate-600 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                        {loadingCopilot ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                        Generate
                    </button>
                </div>
                <div className="flex-1 bg-slate-900/30 rounded-xl p-4 border border-slate-800/50 overflow-y-auto">
                    {dealHelp ? (
                        <div className="prose prose-invert prose-sm">
                            <ReactMarkdown>{dealHelp}</ReactMarkdown>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-3">
                             <MessageSquare size={24} className="opacity-50" />
                            <p className="text-sm">Ask Copilot for help closing.</p>
                        </div>
                    )}
                </div>
              </div>
           )}

           {activeTab === 'COMPLIANCE' && (
              <div className="glass-panel rounded-2xl p-6 border border-slate-700/50 min-h-[400px] animate-fade-in relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-5">
                      <Shield size={120} />
                  </div>
                  
                  <div className="flex justify-between items-center mb-6 relative z-10">
                    <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                        <Shield size={18} className="text-emerald-500"/> Ethics Shield (2025 Audit)
                    </h3>
                  </div>

                  {compliance ? (
                      <div className="space-y-6 relative z-10">
                          {/* Score Header */}
                          <div className="flex items-center gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                             <div className={`relative w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold border-4 
                                ${compliance.score >= 90 ? 'border-emerald-500 text-emerald-500' : compliance.score >= 70 ? 'border-yellow-500 text-yellow-500' : 'border-red-500 text-red-500'}`}>
                                 {compliance.score}
                             </div>
                             <div>
                                 <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Compliance Score</div>
                                 <div className="text-sm text-slate-300">Risk Level: <strong className={compliance.riskLevel === 'LOW' ? 'text-emerald-400' : 'text-red-400'}>{compliance.riskLevel}</strong></div>
                             </div>
                          </div>

                          {/* Flags */}
                          {compliance.flags.length > 0 && (
                              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                                  <h4 className="text-xs font-bold text-red-400 uppercase mb-2 flex items-center gap-2">
                                      <AlertTriangle size={12} /> Risk Flags
                                  </h4>
                                  <ul className="space-y-1">
                                      {compliance.flags.map((flag, i) => (
                                          <li key={i} className="text-sm text-red-300/80 flex items-start gap-2">
                                              <span className="mt-1.5 w-1 h-1 rounded-full bg-red-400"></span>
                                              {flag}
                                          </li>
                                      ))}
                                  </ul>
                              </div>
                          )}

                          {/* Recommendations */}
                          <div className="bg-slate-900/30 border border-slate-800 rounded-lg p-4">
                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2">
                                    <CheckCircle2 size={12} /> Recommendations
                                </h4>
                                <ul className="space-y-1">
                                    {compliance.recommendations.map((rec, i) => (
                                        <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                                            <span className="mt-1.5 w-1 h-1 rounded-full bg-slate-500"></span>
                                            {rec}
                                        </li>
                                    ))}
                                </ul>
                          </div>

                          {compliance.disclaimerRequired && (
                              <div className="text-xs text-slate-500 bg-slate-950 p-2 rounded text-center">
                                  * Mandatory disclaimer required for proposal PDF.
                              </div>
                          )}
                      </div>
                  ) : (
                      <div className="flex flex-col items-center justify-center h-64 text-slate-600">
                          {loadingCompliance ? (
                              <div className="flex flex-col items-center gap-3">
                                  <Loader2 size={24} className="animate-spin text-emerald-500" />
                                  <p className="text-sm">Auditing deal parameters...</p>
                              </div>
                          ) : (
                              <p className="text-sm">Run analysis to perform ethics audit.</p>
                          )}
                      </div>
                  )}
              </div>
           )}

        </div>
      </div>
    </div>
  );
};

export default SolarIntelligence;
