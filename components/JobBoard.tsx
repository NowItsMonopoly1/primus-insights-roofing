
import React, { useState, useEffect } from 'react';
import { MOCK_LEADS } from '../constants';
import { LeadStatus, Lead, UserProfile, PlanId } from '../types';
import { Filter, Search, MapPin, Sparkles, Battery, Plus, X, User, DollarSign, FileText, Calendar, Flame, Loader2, Lock, Edit2, ChevronRight, Phone, Eye, Zap } from 'lucide-react';
import { loadOrDefault, save } from '../utils/storage';
import { routeLead } from '../services/geminiService';
import { hasAccess } from '../utils/plan';
import { scoreLead, getScoreColor } from '../services/leadIntelligence';
import LeadDetailsDrawer from './LeadDetailsDrawer';

const LEADS_KEY = "primus_leads";

interface LeadBoardProps {
  userProfile: UserProfile;
  onRequestUpgrade: (plan: PlanId) => void;
}

const LeadBoard: React.FC<LeadBoardProps> = ({ userProfile, onRequestUpgrade }) => {
  // Persistence State
  const [leads, setLeads] = useState<Lead[]>(() => 
    loadOrDefault<Lead[]>(LEADS_KEY, MOCK_LEADS)
  );
  
  // UI State
  const [filter, setFilter] = useState<LeadStatus | "ALL">("ALL");
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRouting, setIsRouting] = useState(false);
  
  // Drawer State
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);

  // Check Permissions using Utility
  const canUseRouter = hasAccess(userProfile.plan as PlanId, 'leadRouting');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    estimatedBill: '',
    age: '',
    notes: ''
  });

  // AI Score Preview State (for modal)
  const [previewAiScore, setPreviewAiScore] = useState<number | null>(null);
  const [previewAiTags, setPreviewAiTags] = useState<string[]>([]);
  const [previewPriority, setPreviewPriority] = useState<'low' | 'medium' | 'high' | null>(null);

  // Sync with LocalStorage
  useEffect(() => {
    save(LEADS_KEY, leads);
  }, [leads]);

  const handleOpenCreate = () => {
      setEditingId(null);
      setFormData({ name: '', address: '', estimatedBill: '', age: '', notes: '' });
      setPreviewAiScore(null);
      setPreviewAiTags([]);
      setPreviewPriority(null);
      setIsModalOpen(true);
  };

  const runIntelligence = () => {
      const analysis = scoreLead({
          name: formData.name,
          address: formData.address,
          estimatedBill: Number(formData.estimatedBill) || 0,
          age: formData.age ? Number(formData.age) : undefined,
          notes: formData.notes
      });
      setPreviewAiScore(analysis.score);
      setPreviewAiTags(analysis.tags);
      setPreviewPriority(analysis.priority);
  };

  const openLeadDetails = (lead: Lead) => {
      setSelectedLead(lead);
      setIsDrawerOpen(true);
  };

  const handleOpenEdit = (e: React.MouseEvent, lead: Lead) => {
      e.stopPropagation(); 
      setEditingId(lead.id);
      setFormData({
          name: lead.name,
          address: lead.address,
          estimatedBill: lead.estimatedBill?.toString() || '',
          age: lead.age?.toString() || '',
          notes: lead.notes || ''
      });
      // Populate existing AI scores if available
      setPreviewAiScore(lead.aiScore ?? null);
      setPreviewAiTags(lead.aiTags ?? []);
      setPreviewPriority(lead.priority ?? null);
      setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // UPDATE EXISTING LEAD
    if (editingId) {
        const updatedLeadData = {
            name: formData.name,
            address: formData.address,
            estimatedBill: Number(formData.estimatedBill) || 0,
            age: formData.age ? Number(formData.age) : undefined,
            notes: formData.notes
        };
        // Re-run AI scoring on edit
        const updatedAnalysis = scoreLead(updatedLeadData);
        
        setLeads(prev => prev.map(l => l.id === editingId ? {
            ...l,
            ...updatedLeadData,
            aiScore: updatedAnalysis.score,
            aiTags: updatedAnalysis.tags,
            priority: updatedAnalysis.priority
        } : l));
        
        setIsModalOpen(false);
        setEditingId(null);
        setFormData({ name: '', address: '', estimatedBill: '', age: '', notes: '' });
        setPreviewAiScore(null);
        setPreviewAiTags([]);
        setPreviewPriority(null);
        return;
    }

    // CREATE NEW LEAD
    // Generate AI score for new lead
    const analysis = scoreLead({
        name: formData.name,
        address: formData.address,
        estimatedBill: Number(formData.estimatedBill) || 0,
        age: formData.age ? Number(formData.age) : undefined,
        notes: formData.notes
    });

    const baseLead: Lead = {
      id: `L-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      name: formData.name,
      address: formData.address,
      estimatedBill: Number(formData.estimatedBill) || 0,
      age: formData.age ? Number(formData.age) : undefined,
      notes: formData.notes,
      status: "NEW",
      createdAt: new Date().toISOString().slice(0, 10),
      aiScore: analysis.score,
      aiTags: analysis.tags,
      priority: analysis.priority
    };

    let finalLead = baseLead;

    // Run AI Routing ONLY if allowed (EMPIRE+)
    if (canUseRouter) {
        setIsRouting(true);
        const routingInfo = await routeLead(baseLead);
        finalLead = { ...baseLead, routing: routingInfo };
        setIsRouting(false);
    }

    setLeads([finalLead, ...leads]);
    setIsModalOpen(false);
    setFormData({ name: '', address: '', estimatedBill: '', age: '', notes: '' });
    setPreviewAiScore(null);
    setPreviewAiTags([]);
    setPreviewPriority(null);
  };

  const filteredLeads = leads.filter((lead) => {
    const statusMatch = filter === "ALL" ? true : lead.status === filter;
    const searchMatch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        lead.address.toLowerCase().includes(searchTerm.toLowerCase());
    return statusMatch && searchMatch;
  });

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'NEW': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
          case 'QUALIFIED': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
          case 'CLOSED_WON': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
          case 'CLOSED_LOST': return 'bg-red-500/10 text-red-400 border-red-500/20';
          default: return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      }
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-display font-bold text-slate-100">Lead Board</h2>
          <p className="text-slate-400 mt-1">Manage and track your solar sales pipeline.</p>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="bg-solar-orange hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-bold transition-all shadow-lg shadow-orange-500/20 text-sm cursor-pointer hover:scale-105 active:scale-95"
        >
          <Plus size={18} /> New Lead
        </button>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden border border-slate-800">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row gap-4 bg-slate-900/50">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text"
              placeholder="Search homeowners or addresses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-solar-orange focus:ring-1 focus:ring-solar-orange transition-all placeholder:text-slate-600"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-500 hidden md:block" />
            <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="w-full md:w-auto bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-300 py-2.5 px-3 focus:outline-none focus:border-solar-orange cursor-pointer"
            >
                <option value="ALL">All Statuses</option>
                <option value="NEW">New</option>
                <option value="QUALIFIED">Qualified</option>
                <option value="PROPOSAL_SENT">Proposal Sent</option>
                <option value="CLOSED_WON">Closed Won</option>
                <option value="CLOSED_LOST">Closed Lost</option>
            </select>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto min-h-[400px]">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/80 text-slate-400 font-medium uppercase text-xs tracking-wider">
              <tr>
                <th className="px-6 py-4">Homeowner</th>
                <th className="px-6 py-4 flex items-center gap-2">
                    Lead IQ 
                    {!canUseRouter && <Lock size={12} className="text-slate-600" />}
                </th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Est. Bill</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredLeads.map((lead) => {
                return (
                  <tr key={lead.id} className="hover:bg-slate-800/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-200 text-base">{lead.name}</div>
                      <div className="text-slate-500 text-xs flex items-center gap-1 mt-1 font-mono">
                        <MapPin size={12} /> {lead.address}
                        {lead.age && lead.age > 65 && (
                          <span className="ml-2 text-[10px] bg-red-500/20 text-red-400 px-1 rounded border border-red-500/30">
                            SENIOR ({lead.age})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {/* AI Score Display */}
                      {lead.aiScore !== undefined ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className={`flex items-center gap-1 text-sm font-bold ${getScoreColor(lead.aiScore)}`}>
                              <Zap size={12} />
                              {lead.aiScore}
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium uppercase
                              ${lead.priority === 'high' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                                lead.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                                'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}>
                              {lead.priority || 'low'}
                            </span>
                          </div>
                          {lead.aiTags && lead.aiTags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {lead.aiTags.slice(0, 2).map((tag, i) => (
                                <span key={i} className="text-[9px] px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded border border-slate-700">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : lead.routing ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className={`flex items-center gap-1 text-xs font-bold px-1.5 py-0.5 rounded
                              ${lead.routing.quality === 'HOT' ? 'bg-orange-500/20 text-solar-orange border border-solar-orange/30' : 
                                lead.routing.quality === 'WARM' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 
                                'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
                               {lead.routing.quality === 'HOT' && <Flame size={10} fill="currentColor" />}
                               {lead.routing.score}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">
                               {lead.routing.quality}
                            </span>
                          </div>
                          <div className="text-[10px] text-emerald-400">
                             Assign: <span className="font-bold">{lead.routing.recommendedAgentType}</span>
                          </div>
                        </div>
                      ) : !canUseRouter ? (
                        <div 
                            className="flex items-center gap-2 text-slate-600 text-xs bg-slate-900/50 px-2 py-1 rounded w-fit cursor-pointer hover:bg-slate-900 hover:text-slate-400"
                            onClick={() => onRequestUpgrade('TEAM')}
                        >
                            <Lock size={10} />
                            <span>Upgrade to Empire</span>
                        </div>
                      ) : (
                        <span className="text-slate-600 text-xs italic">No AI Score</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded text-xs font-bold border uppercase tracking-wider ${getStatusColor(lead.status)}`}>
                        {lead.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2">
                          <Battery size={14} className="text-solar-orange"/>
                          <span className="font-mono font-bold text-slate-300">${lead.estimatedBill}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <button 
                          onClick={() => openLeadDetails(lead)}
                          className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 px-3 py-1.5 rounded-md text-xs font-medium transition-colors border border-transparent hover:border-emerald-500/30 flex items-center gap-2"
                        >
                          <Eye size={12} /> View
                        </button>
                        <button 
                          onClick={(e) => handleOpenEdit(e, lead)}
                          className="text-slate-400 hover:text-white hover:bg-slate-700 px-3 py-1.5 rounded-md text-xs font-medium transition-colors border border-transparent hover:border-slate-600 flex items-center gap-2"
                        >
                          <Edit2 size={12} /> Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden p-4 space-y-4 min-h-[400px]">
             {filteredLeads.map((lead) => (
                 <div key={lead.id} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 active:scale-[0.98] transition-transform" onClick={(e) => handleOpenEdit(e, lead)}>
                    <div className="flex justify-between items-start mb-3">
                        <div>
                             <h4 className="font-bold text-slate-200 text-base">{lead.name}</h4>
                             <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                                 <MapPin size={10} /> {lead.address}
                             </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getStatusColor(lead.status)}`}>
                             {lead.status.replace('_', ' ')}
                        </span>
                    </div>
                    
                    <div className="flex items-center justify-between border-t border-slate-800/50 pt-3 mt-2">
                         <div className="flex items-center gap-2">
                            <Battery size={14} className="text-solar-orange"/>
                            <span className="font-mono font-bold text-slate-300 text-sm">${lead.estimatedBill}/mo</span>
                         </div>
                         
                         {lead.aiScore !== undefined ? (
                             <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${getScoreColor(lead.aiScore)} bg-slate-800 border border-slate-700`}>
                                 <Zap size={10} /> AI: {lead.aiScore}
                             </div>
                         ) : lead.routing?.quality === 'HOT' ? (
                             <div className="flex items-center gap-1 px-2 py-0.5 bg-orange-500/10 border border-orange-500/20 rounded text-solar-orange text-xs font-bold">
                                 <Flame size={10} fill="currentColor" /> HOT LEAD
                             </div>
                         ) : null}
                         
                         <button className="text-slate-400">
                             <Edit2 size={16} />
                         </button>
                    </div>
                 </div>
             ))}
        </div>
      </div>

      {/* Add/Edit Lead Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => !isRouting && setIsModalOpen(false)}></div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl relative overflow-hidden animate-fade-in z-10 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/30">
                    <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
                        <div className="p-1.5 bg-solar-orange/10 rounded-lg">
                           <Sparkles size={16} className="text-solar-orange"/> 
                        </div>
                        {editingId ? "Edit Lead" : "Add New Lead"}
                    </h3>
                    {!isRouting && (
                        <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* Form - Scrollable Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Homeowner Name</label>
                        <div className="relative">
                            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input 
                                required
                                disabled={isRouting}
                                type="text" 
                                placeholder="e.g. John Smith"
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-slate-200 focus:outline-none focus:border-solar-orange focus:ring-1 focus:ring-solar-orange transition-all disabled:opacity-50"
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Est. Monthly Bill ($)</label>
                          <div className="relative">
                              <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                              <input 
                                  required
                                  disabled={isRouting}
                                  type="number" 
                                  min="0"
                                  placeholder="250"
                                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-slate-200 focus:outline-none focus:border-solar-orange focus:ring-1 focus:ring-solar-orange transition-all font-mono disabled:opacity-50"
                                  value={formData.estimatedBill}
                                  onChange={e => setFormData({...formData, estimatedBill: e.target.value})}
                              />
                          </div>
                      </div>
                      <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Age (Optional)</label>
                          <div className="relative">
                              <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                              <input 
                                  type="number" 
                                  disabled={isRouting}
                                  min="18"
                                  max="120"
                                  placeholder="45"
                                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-slate-200 focus:outline-none focus:border-solar-orange focus:ring-1 focus:ring-solar-orange transition-all font-mono disabled:opacity-50"
                                  value={formData.age}
                                  onChange={e => setFormData({...formData, age: e.target.value})}
                              />
                          </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Address</label>
                        <div className="relative">
                            <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input 
                                required
                                disabled={isRouting}
                                type="text" 
                                placeholder="e.g. 123 Sun Ave, Solar City"
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-slate-200 focus:outline-none focus:border-solar-orange focus:ring-1 focus:ring-solar-orange transition-all disabled:opacity-50"
                                value={formData.address}
                                onChange={e => setFormData({...formData, address: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Notes</label>
                        <div className="relative">
                            <FileText size={16} className="absolute left-3 top-3 text-slate-500" />
                            <textarea 
                                rows={3}
                                disabled={isRouting}
                                placeholder="e.g. Referred by neighbor, south facing roof..."
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-slate-200 focus:outline-none focus:border-solar-orange focus:ring-1 focus:ring-solar-orange transition-all resize-none disabled:opacity-50"
                                value={formData.notes}
                                onChange={e => setFormData({...formData, notes: e.target.value})}
                            />
                        </div>
                    </div>

                    {/* Run Intelligence Button & Preview */}
                    <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Zap size={16} className="text-emerald-400" />
                                <span className="text-sm font-bold text-slate-300">AI Lead Intelligence</span>
                            </div>
                            <button
                                type="button"
                                onClick={runIntelligence}
                                disabled={isRouting || !formData.name}
                                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                            >
                                <Sparkles size={12} />
                                Run Intelligence
                            </button>
                        </div>
                        
                        {previewAiScore !== null && (
                            <div className="pt-3 border-t border-slate-700 space-y-2">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-400">Score:</span>
                                        <span className={`text-lg font-bold ${getScoreColor(previewAiScore)}`}>
                                            {previewAiScore}
                                        </span>
                                    </div>
                                    {previewPriority && (
                                        <span className={`text-[10px] px-2 py-0.5 rounded border font-bold uppercase
                                            ${previewPriority === 'high' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                                              previewPriority === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                                              'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}>
                                            {previewPriority} priority
                                        </span>
                                    )}
                                </div>
                                {previewAiTags.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {previewAiTags.map((tag, i) => (
                                            <span key={i} className="text-[10px] px-2 py-0.5 bg-slate-900 text-slate-300 rounded border border-slate-600">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    
                    {!canUseRouter && !editingId && (
                        <div className="bg-slate-800/50 p-3 rounded-lg flex items-center gap-3 border border-slate-700">
                             <Lock size={16} className="text-slate-400" />
                             <span className="text-xs text-slate-400">AI Lead Routing is disabled on {userProfile.plan}. <button type="button" onClick={() => onRequestUpgrade('TEAM')} className="text-solar-orange hover:underline">Upgrade to Empire</button> for auto-assignment.</span>
                        </div>
                    )}

                    <div className="pt-4 flex gap-3 sticky bottom-0 bg-slate-900 pb-2">
                        <button 
                            type="button" 
                            disabled={isRouting}
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 py-2.5 rounded-lg border border-slate-700 text-slate-300 font-bold hover:bg-slate-800 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={isRouting}
                            className="flex-1 py-2.5 rounded-lg bg-solar-orange text-white font-bold hover:bg-orange-600 shadow-[0_0_15px_rgba(249,115,22,0.3)] transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                        >
                            {isRouting ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Routing...
                                </>
                            ) : (
                                editingId ? "Update Lead" : "Create Lead"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Lead Details Drawer */}
      <LeadDetailsDrawer
        open={isDrawerOpen}
        lead={selectedLead}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
};

export default LeadBoard;