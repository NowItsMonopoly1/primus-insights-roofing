
import React, { useState, useEffect, useRef } from 'react';
import { SEED_LEADS, SEED_ANALYSES, createProjectForLead, generateMilestoneCommissions } from '../constants';
import { simulateSolarAnalysis, generateProposalStrategy, dealCopilotSuggestions, analyzeCompliance, analyzeSolarImage, generateOutreachMessage } from '../services/geminiService';
import { SolarAnalysis, ComplianceAnalysis, Lead, Project, Commission, UserProfile, PlanId } from '../types';
import { Sun, Zap, Loader2, Sparkles, MessageSquare, Calculator, Shield, AlertTriangle, CheckCircle2, PenTool, Lock, Map, Image as ImageIcon, Upload, Globe, Mail, Send, Copy, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { generateSolarHeatmap } from '../utils/heatmap';
import { loadOrDefault, save } from '../utils/storage';
import { SignatureModal } from './SignatureModal';
import { ProposalViewer } from './ProposalViewer';
import { hasAccess, getRequiredPlan } from '../utils/plan';
import { LockedFeature } from './LockedFeature';

const LEADS_KEY = "primus_leads";
const PROJECTS_KEY = "primus_projects";
const ANALYSES_KEY = "primus_analyses";
const COMMISSIONS_KEY = "primus_commissions";

interface SolarIntelligenceProps {
  userProfile: UserProfile;
  onRequestUpgrade: (plan: PlanId) => void;
}

const SolarIntelligence: React.FC<SolarIntelligenceProps> = ({ userProfile, onRequestUpgrade }) => {
  // Persistence
  const [leads, setLeads] = useState<Lead[]>(() => 
    loadOrDefault<Lead[]>(LEADS_KEY, LEADS_KEY === "primus_leads" ? SEED_LEADS : [])
  );
  const [analyses, setAnalyses] = useState<SolarAnalysis[]>(() => 
    loadOrDefault<SolarAnalysis[]>(ANALYSES_KEY, SEED_ANALYSES)
  );
  const [projects, setProjects] = useState<Project[]>(() =>
    loadOrDefault<Project[]>(PROJECTS_KEY, [])
  );
  const [commissions, setCommissions] = useState<Commission[]>(() =>
    loadOrDefault<Commission[]>(COMMISSIONS_KEY, [])
  );

  const [leadId, setLeadId] = useState<string>(leads[0]?.id || "");
  const [currentAnalysis, setCurrentAnalysis] = useState<SolarAnalysis | null>(null);
  
  // UI State
  const [proposal, setProposal] = useState("");
  const [dealHelp, setDealHelp] = useState<{text: string, groundingUrls?: string[]} | null>(null);
  const [compliance, setCompliance] = useState<ComplianceAnalysis | null>(null);
  const [outreach, setOutreach] = useState("");
  const [activeTab, setActiveTab] = useState<'ANALYSIS' | 'COPILOT' | 'COMPLIANCE' | 'IMAGE' | 'COMMS'>('ANALYSIS');
  const [toast, setToast] = useState<string | null>(null);
  
  // Image Analysis State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageAnalysisResult, setImageAnalysisResult] = useState("");
  const [loadingImageAnalysis, setLoadingImageAnalysis] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modals
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isProposalOpen, setIsProposalOpen] = useState(false);
  
  // Loading States
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [loadingCopilot, setLoadingCopilot] = useState(false);
  const [loadingCompliance, setLoadingCompliance] = useState(false);
  const [loadingOutreach, setLoadingOutreach] = useState(false);

  const selectedLead = leads.find(l => l.id === leadId);
  const currentPlan = userProfile.plan as PlanId;

  // Persistence Effects
  useEffect(() => { save(LEADS_KEY, leads); }, [leads]);
  useEffect(() => { save(ANALYSES_KEY, analyses); }, [analyses]);
  useEffect(() => { save(PROJECTS_KEY, projects); }, [projects]);
  useEffect(() => { save(COMMISSIONS_KEY, commissions); }, [commissions]);

  // Sync analysis when lead changes
  useEffect(() => {
    setProposal("");
    setDealHelp(null);
    setCompliance(null);
    setOutreach("");
    setSelectedImage(null);
    setImageAnalysisResult("");
    
    const existing = analyses.find(a => a.leadId === leadId);
    setCurrentAnalysis(existing || null);

    if (existing && selectedLead && hasAccess(currentPlan, 'complianceShield')) {
        runComplianceCheck(selectedLead, existing);
    }
  }, [leadId, analyses, selectedLead, currentPlan]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const runAnalysis = async () => {
    if (!selectedLead) return;
    setLoadingAnalysis(true);
    
    try {
        const newAnalysis = await simulateSolarAnalysis(selectedLead);
        
        setAnalyses(prev => {
            const filtered = prev.filter(a => a.leadId !== selectedLead.id);
            return [...filtered, newAnalysis];
        });
        setCurrentAnalysis(newAnalysis);
        
        const p = await generateProposalStrategy(selectedLead, newAnalysis);
        setProposal(p);
        
        if (hasAccess(currentPlan, 'complianceShield')) {
           runComplianceCheck(selectedLead, newAnalysis);
        }
    } catch (error) {
        console.error("Analysis failed:", error);
        showToast("Analysis failed. Check API Key.");
    } finally {
        setLoadingAnalysis(false);
    }
  };

  const runDealCopilot = async () => {
    if (!selectedLead) return;
    setLoadingCopilot(true);
    const stage = selectedLead.status === 'NEW' ? 'NEW' : 'PERMITTING';
    try {
        const result = await dealCopilotSuggestions(selectedLead, stage);
        setDealHelp({ text: result.text, groundingUrls: result.groundingUrls });
    } catch(e) {
        console.error(e);
        showToast("Copilot failed.");
    } finally {
        setLoadingCopilot(false);
    }
  };

  const runComplianceCheck = async (lead: Lead, an: SolarAnalysis) => {
    if (!lead || !an) return;
    setLoadingCompliance(true);
    const comp = await analyzeCompliance(lead, an);
    setCompliance(comp);
    setLoadingCompliance(false);
  };

  const generateOutreach = async (type: 'EMAIL' | 'SMS') => {
      if (!selectedLead || !currentAnalysis) return;
      setLoadingOutreach(true);
      try {
          const msg = await generateOutreachMessage(selectedLead, currentAnalysis, type);
          setOutreach(msg);
      } catch (e) {
          showToast("Outreach generation failed.");
      } finally {
          setLoadingOutreach(false);
      }
  };

  const copyOutreach = () => {
      navigator.clipboard.writeText(outreach);
      showToast("Message copied to clipboard!");
  };

  // --- Image Analysis Flow ---
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setSelectedImage(reader.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleAnalyzeImage = async () => {
      if (!selectedImage) return;
      setLoadingImageAnalysis(true);
      
      const base64Data = selectedImage.split(',')[1];
      const mimeType = selectedImage.split(';')[0].split(':')[1];
      
      const prompt = "Analyze this image for solar sales potential. If it's a utility bill, extract the monthly usage and cost. If it's a roof, estimate the pitch, material, and shading.";
      
      const result = await analyzeSolarImage(base64Data, mimeType, prompt);
      setImageAnalysisResult(result);
      setLoadingImageAnalysis(false);
  };

  // --- Closing Flow ---
  
  const handleInitiateClose = () => {
      if (!selectedLead || !currentAnalysis) return;
      if (!hasAccess(currentPlan, 'contractSign')) {
          onRequestUpgrade(getRequiredPlan('contractSign'));
          return;
      }
      setIsSignModalOpen(true);
  };

  const handleContractSigned = (signatureData: string) => {
      if (!selectedLead || !currentAnalysis) return;
      setIsSignModalOpen(false);
      setLeads(prev => prev.map(l => l.id === selectedLead.id ? {...l, status: 'CLOSED_WON'} : l));

      if (!projects.some(p => p.leadId === selectedLead.id)) {
        const newProject = createProjectForLead(selectedLead, currentAnalysis);
        setProjects(prev => [...prev, newProject]);
        const newComms = generateMilestoneCommissions(newProject);
        const updatedComms = newComms.map(c => 
            c.milestone === 'SIGNED' ? { ...c, status: 'PAID' as const, expectedPayDate: new Date().toISOString().slice(0,10) } : c
        );
        setCommissions(prev => [...prev, ...updatedComms]);
        showToast("🎉 CONTRACT SIGNED! Project Started & Commission Logged.");
      } else {
        showToast("Contract updated.");
      }
  };

  const handlePreviewProposal = () => {
      if (!selectedLead || !currentAnalysis) return;
      setIsProposalOpen(true);
  };

  const canAccessCopilot = hasAccess(currentPlan, 'dealCopilot');
  const canAccessCompliance = hasAccess(currentPlan, 'complianceShield');

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto relative">
       {toast && (
        <div className="absolute top-0 right-0 z-50 bg-emerald-500 text-white px-4 py-3 rounded-lg shadow-lg shadow-emerald-500/20 flex items-center gap-2 animate-fade-in">
            <CheckCircle2 size={18} />
            <span className="font-bold text-sm">{toast}</span>
        </div>
      )}

      {/* Signature Modal */}
      {selectedLead && currentAnalysis && (
        <SignatureModal 
            isOpen={isSignModalOpen}
            onClose={() => setIsSignModalOpen(false)}
            onConfirm={handleContractSigned}
            contractDetails={{
                customerName: selectedLead.name,
                systemSize: currentAnalysis.systemSizeKw,
                monthlyPayment: currentAnalysis.estimatedMonthlyPayment,
                totalCost: currentAnalysis.netCost
            }}
        />
      )}

      {/* Proposal PDF Viewer Modal */}
      {selectedLead && currentAnalysis && (
        <ProposalViewer
            isOpen={isProposalOpen}
            onClose={() => setIsProposalOpen(false)}
            lead={selectedLead}
            analysis={currentAnalysis}
            userProfile={userProfile}
        />
      )}

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
             {leads.map(lead => (
               <option key={lead.id} value={lead.id}>{lead.name} - {lead.address}</option>
             ))}
           </select>
        </div>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
          <button 
            onClick={() => setActiveTab('ANALYSIS')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'ANALYSIS' ? 'bg-slate-800 text-white border border-slate-600' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Roof & Financials
          </button>
          
          <button 
            onClick={() => setActiveTab('IMAGE')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'IMAGE' ? 'bg-slate-800 text-white border border-slate-600' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <ImageIcon size={14} />
            Image Analysis
            <span className="bg-emerald-500 text-slate-950 text-[9px] px-1 rounded font-bold">NEW</span>
          </button>

          <button 
            onClick={() => setActiveTab('COMMS')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'COMMS' ? 'bg-slate-800 text-white border border-slate-600' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Mail size={14} />
            Smart Comms
          </button>

          {/* Gated Tabs */}
          <button 
            onClick={() => setActiveTab('COPILOT')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'COPILOT' 
                ? 'bg-slate-800 text-white border border-slate-600' 
                : !canAccessCopilot ? 'text-slate-600' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Deal Copilot
            {!canAccessCopilot && <Lock size={12} />}
          </button>

          <button 
            onClick={() => setActiveTab('COMPLIANCE')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'COMPLIANCE' 
                ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/50' 
                : !canAccessCompliance ? 'text-slate-600' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Shield size={14} />
            Ethics Shield
            {!canAccessCompliance && <Lock size={12} />}
          </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Context Aware */}
        <div className="space-y-6">
            {/* Analysis Card */}
            <div className="glass-panel rounded-2xl p-6 border border-slate-700/50 shadow-xl">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-200">System Metrics</h3>
                    <div className="flex gap-2">
                        {currentAnalysis && (
                            <button 
                                onClick={handlePreviewProposal}
                                className="text-xs bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-2"
                            >
                                <FileText size={14} />
                                Proposal
                            </button>
                        )}
                        {currentAnalysis && selectedLead?.status !== 'CLOSED_WON' && (
                             <button 
                                onClick={handleInitiateClose}
                                className={`text-xs px-4 py-1.5 rounded-lg font-bold transition-all flex items-center gap-2 
                                  ${hasAccess(currentPlan, 'contractSign') 
                                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white border border-emerald-500 shadow-lg shadow-emerald-500/20 animate-pulse-slow' 
                                    : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'}`}
                            >
                                {hasAccess(currentPlan, 'contractSign') ? <PenTool size={14} /> : <Lock size={12} />}
                                Sign
                            </button>
                        )}
                        <button 
                            onClick={runAnalysis}
                            disabled={loadingAnalysis}
                            className="text-xs bg-solar-orange/10 hover:bg-solar-orange/20 text-solar-orange border border-solar-orange/50 px-3 py-1.5 rounded-lg font-bold transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                            {loadingAnalysis ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                            {currentAnalysis ? "Re-Run" : "Run"}
                        </button>
                    </div>
                </div>

                {currentAnalysis ? (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                                <div className="text-xs text-slate-500 uppercase">Usable Area</div>
                                <div className="text-xl font-mono font-bold text-white">{currentAnalysis.usableAreaSqft} <span className="text-xs text-slate-500">sqft</span></div>
                            </div>
                            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                                <div className="text-xs text-slate-500 uppercase">Sun Hours</div>
                                <div className="text-xl font-mono font-bold text-white">{currentAnalysis.sunHoursPerDay} <span className="text-xs text-slate-500">hrs/day</span></div>
                            </div>
                            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                                <div className="text-xs text-slate-500 uppercase">System Size</div>
                                <div className="text-xl font-mono font-bold text-white">{currentAnalysis.systemSizeKw} <span className="text-xs text-slate-500">kW</span></div>
                            </div>
                            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                                <div className="text-xs text-slate-500 uppercase">Viability</div>
                                <div className={`text-xl font-mono font-bold ${currentAnalysis.viabilityScore > 80 ? 'text-green-400' : 'text-yellow-400'}`}>
                                    {currentAnalysis.viabilityScore}<span className="text-sm">/100</span>
                                </div>
                            </div>
                        </div>
                        {generateSolarHeatmap(currentAnalysis)}
                        
                         <div className="bg-slate-900/30 p-4 rounded-lg border border-slate-800">
                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Analysis Summary</h4>
                            <p className="text-sm text-slate-300 leading-relaxed">{currentAnalysis.summary}</p>
                            
                            {/* Maps Grounding Sources */}
                            {currentAnalysis.groundingUrls && currentAnalysis.groundingUrls.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-slate-800">
                                    <h5 className="text-[10px] font-bold text-emerald-500 uppercase flex items-center gap-1 mb-2">
                                        <Map size={10} /> Verified Sources (Google Maps)
                                    </h5>
                                    <div className="flex flex-wrap gap-2">
                                        {currentAnalysis.groundingUrls.map((url, i) => (
                                            <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-400 hover:text-blue-300 hover:underline bg-slate-900 px-2 py-1 rounded truncate max-w-[200px]">
                                                {url}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-10 text-slate-500 text-sm">
                        Select a lead and run analysis.
                    </div>
                )}
            </div>

             {/* Financials (Always Visible if Analysis Exists) */}
            {currentAnalysis && (
              <div className="glass-panel rounded-2xl p-6 border border-slate-700/50 shadow-xl relative overflow-hidden">
                  <h3 className="text-lg font-bold text-slate-200 mb-6 flex items-center gap-2 relative z-10">
                    <Calculator size={18} className="text-emerald-500"/> Financial Snapshot
                  </h3>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                        <div className="bg-emerald-900/20 p-4 rounded-xl border border-emerald-500/30 text-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-emerald-500/5 animate-pulse-slow"></div>
                            <div className="relative z-10">
                              <div className="text-xs text-emerald-400 uppercase font-bold mb-1">New Pmt</div>
                              <div className="text-2xl font-display font-bold text-white">${currentAnalysis.estimatedMonthlyPayment}</div>
                            </div>
                        </div>
                         <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 text-center">
                            <div className="text-xs text-slate-400 uppercase font-bold mb-1">Savings</div>
                            <div className="text-2xl font-display font-bold text-emerald-400">+${currentAnalysis.estimatedMonthlySavings}</div>
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

           {activeTab === 'IMAGE' && (
              <div className="glass-panel rounded-2xl p-6 border border-slate-700/50 min-h-[400px] animate-fade-in flex flex-col">
                  <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
                      <ImageIcon size={18} className="text-blue-400"/> Image Analysis
                  </h3>
                  
                  <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-700 rounded-xl bg-slate-900/30 p-6 relative">
                      {!selectedImage ? (
                          <div className="text-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                              <Upload size={32} className="mx-auto text-slate-500 mb-2" />
                              <p className="text-sm text-slate-400 font-bold">Upload Roof or Bill</p>
                              <p className="text-xs text-slate-600 mt-1">Supports JPG, PNG</p>
                              <input 
                                  type="file" 
                                  ref={fileInputRef} 
                                  className="hidden" 
                                  accept="image/*" 
                                  onChange={handleImageUpload} 
                              />
                          </div>
                      ) : (
                          <div className="w-full h-full flex flex-col">
                              <div className="relative flex-1 overflow-hidden rounded-lg mb-4 bg-slate-950">
                                  <img src={selectedImage} alt="Analysis Target" className="w-full h-full object-contain" />
                                  <button 
                                    onClick={() => setSelectedImage(null)}
                                    className="absolute top-2 right-2 p-1 bg-black/50 rounded-full hover:bg-black/80 text-white"
                                  >
                                      ×
                                  </button>
                              </div>
                              <button 
                                  onClick={handleAnalyzeImage}
                                  disabled={loadingImageAnalysis}
                                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                              >
                                  {loadingImageAnalysis ? <Loader2 size={16} className="animate-spin"/> : <Sparkles size={16}/>}
                                  Analyze with Gemini
                              </button>
                          </div>
                      )}
                  </div>
                  
                  {imageAnalysisResult && (
                      <div className="mt-4 p-4 bg-slate-900/50 rounded-xl border border-slate-800 h-48 overflow-y-auto custom-scrollbar">
                           <div className="prose prose-invert prose-sm">
                                <ReactMarkdown>{imageAnalysisResult}</ReactMarkdown>
                           </div>
                      </div>
                  )}
              </div>
           )}

           {activeTab === 'COMMS' && (
              <div className="glass-panel rounded-2xl p-6 border border-slate-700/50 min-h-[400px] animate-fade-in flex flex-col">
                  <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
                      <Mail size={18} className="text-solar-orange"/> Smart Outreach
                  </h3>

                  <div className="flex gap-2 mb-4">
                      <button 
                        onClick={() => generateOutreach('EMAIL')}
                        disabled={loadingOutreach || !currentAnalysis}
                        className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold rounded flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                         <Mail size={12} /> Email Draft
                      </button>
                      <button 
                        onClick={() => generateOutreach('SMS')}
                        disabled={loadingOutreach || !currentAnalysis}
                        className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold rounded flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                         <Send size={12} /> SMS Draft
                      </button>
                  </div>

                  {loadingOutreach ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                          <Loader2 size={24} className="animate-spin text-solar-orange mb-2" />
                          <p className="text-sm">Drafting message...</p>
                      </div>
                  ) : outreach ? (
                      <div className="flex-1 flex flex-col">
                          <textarea 
                             className="flex-1 w-full bg-slate-950/50 border border-slate-800 rounded-lg p-3 text-sm text-slate-300 focus:outline-none focus:border-solar-orange resize-none mb-3"
                             value={outreach}
                             onChange={(e) => setOutreach(e.target.value)}
                          />
                          <button 
                             onClick={copyOutreach}
                             className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded flex items-center justify-center gap-2"
                          >
                              <Copy size={14} /> Copy to Clipboard
                          </button>
                      </div>
                  ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-slate-800 rounded-xl">
                           <Mail size={24} className="opacity-50 mb-2" />
                           <p className="text-sm">Select a format to draft.</p>
                      </div>
                  )}
              </div>
           )}

           {activeTab === 'COPILOT' && (
             canAccessCopilot ? (
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
                        <>
                            <div className="prose prose-invert prose-sm">
                                <ReactMarkdown>{dealHelp.text}</ReactMarkdown>
                            </div>
                            
                             {/* Search Grounding Sources */}
                            {dealHelp.groundingUrls && dealHelp.groundingUrls.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-slate-800">
                                    <h5 className="text-[10px] font-bold text-blue-500 uppercase flex items-center gap-1 mb-2">
                                        <Globe size={10} /> Market Data Sources (Google Search)
                                    </h5>
                                    <div className="flex flex-col gap-1">
                                        {dealHelp.groundingUrls.map((url, i) => (
                                            <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-slate-400 hover:text-white hover:underline truncate">
                                                {url}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-3">
                             <MessageSquare size={24} className="opacity-50" />
                            <p className="text-sm">Ask Copilot for help closing.</p>
                        </div>
                    )}
                </div>
              </div>
             ) : (
               <LockedFeature 
                 featureLabel="Deal Copilot" 
                 requiredPlan={getRequiredPlan('dealCopilot')}
                 onUpgrade={onRequestUpgrade}
               />
             )
           )}

           {activeTab === 'COMPLIANCE' && (
             canAccessCompliance ? (
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
             ) : (
               <LockedFeature 
                 featureLabel="Compliance Shield" 
                 requiredPlan={getRequiredPlan('complianceShield')}
                 onUpgrade={onRequestUpgrade}
               />
             )
           )}

        </div>
      </div>
    </div>
  );
};

export default SolarIntelligence;
