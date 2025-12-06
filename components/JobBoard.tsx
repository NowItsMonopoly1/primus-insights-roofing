
import React, { useState, useEffect } from 'react';
import { MOCK_LEADS } from '../constants';
import { LeadStatus, Lead } from '../types';
import { Filter, Search, MapPin, Sparkles, Battery, Plus, X, User, DollarSign, FileText, Calendar, Flame, Loader2 } from 'lucide-react';
import { loadOrDefault, save } from '../utils/storage';
import { routeLead } from '../services/geminiService';

const LEADS_KEY = "primus_leads";

const LeadBoard: React.FC = () => {
  // Persistence State
  const [leads, setLeads] = useState<Lead[]>(() => 
    loadOrDefault<Lead[]>(LEADS_KEY, MOCK_LEADS)
  );
  
  // UI State
  const [filter, setFilter] = useState<LeadStatus | "ALL">("ALL");
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRouting, setIsRouting] = useState(false);

  // Form State
  const [newLead, setNewLead] = useState({
    name: '',
    address: '',
    estimatedBill: '',
    age: '',
    notes: ''
  });

  // Sync with LocalStorage
  useEffect(() => {
    save(LEADS_KEY, leads);
  }, [leads]);

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRouting(true);
    
    // 1. Create Base Lead
    const baseLead: Lead = {
      id: `L-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      name: newLead.name,
      address: newLead.address,
      estimatedBill: Number(newLead.estimatedBill) || 0,
      age: newLead.age ? Number(newLead.age) : undefined,
      notes: newLead.notes,
      status: "NEW",
      createdAt: new Date().toISOString().slice(0, 10)
    };

    // 2. Run AI Routing
    const routingInfo = await routeLead(baseLead);
    const finalLead = { ...baseLead, routing: routingInfo };

    // 3. Update State
    setLeads([finalLead, ...leads]);
    setIsModalOpen(false);
    setIsRouting(false);
    setNewLead({ name: '', address: '', estimatedBill: '', age: '', notes: '' });
  };

  const filteredLeads = leads.filter((lead) => {
    const statusMatch = filter === "ALL" ? true : lead.status === filter;
    const searchMatch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        lead.address.toLowerCase().includes(searchTerm.toLowerCase());
    return statusMatch && searchMatch;
  });

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in relative">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-100">Lead Board</h2>
          <p className="text-slate-400 mt-1 text-sm md:text-base">Manage and track your solar sales pipeline.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-solar-orange hover:bg-orange-600 text-white px-4 md:px-5 py-2 md:py-2.5 rounded-lg flex items-center gap-2 font-bold transition-all shadow-lg shadow-orange-500/20 text-sm cursor-pointer hover:scale-105 active:scale-95 w-full sm:w-auto justify-center"
        >
          <Plus size={18} /> New Lead
        </button>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden border border-slate-800">
        {/* Toolbar */}
        <div className="p-3 md:p-4 border-b border-slate-800 flex flex-col sm:flex-row gap-3 md:gap-4 bg-slate-900/50">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text"
              placeholder="Search homeowners..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-solar-orange focus:ring-1 focus:ring-solar-orange transition-all placeholder:text-slate-600"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-500 hidden sm:block" />
            <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-300 py-2.5 px-3 focus:outline-none focus:border-solar-orange cursor-pointer"
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

        {/* Table */}
        <div className="overflow-x-auto min-h-[300px] md:min-h-[400px]">
          <table className="w-full text-left text-sm min-w-[600px]">
            <thead className="bg-slate-900/80 text-slate-400 font-medium uppercase text-[10px] md:text-xs tracking-wider">
              <tr>
                <th className="px-3 md:px-6 py-3 md:py-4">Homeowner</th>
                <th className="px-3 md:px-6 py-3 md:py-4">Lead IQ</th>
                <th className="px-3 md:px-6 py-3 md:py-4">Status</th>
                <th className="px-3 md:px-6 py-3 md:py-4">Bill</th>
                <th className="px-3 md:px-6 py-3 md:py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredLeads.map((lead) => {
                return (
                  <tr key={lead.id} className="hover:bg-slate-800/50 transition-colors group">
                    <td className="px-3 md:px-6 py-3 md:py-4">
                      <div className="font-bold text-slate-200 text-sm md:text-base">{lead.name}</div>
                      <div className="text-slate-500 text-[10px] md:text-xs flex items-center gap-1 mt-1 font-mono">
                        <MapPin size={10} className="md:w-3 md:h-3" /> <span className="truncate max-w-[100px] md:max-w-none">{lead.address}</span>
                        {lead.age && lead.age > 65 && (
                          <span className="ml-2 text-[10px] bg-red-500/20 text-red-400 px-1 rounded border border-red-500/30">
                            SENIOR ({lead.age})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4">
                      {lead.routing ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1 md:gap-2">
                            <span className={`flex items-center gap-1 text-[10px] md:text-xs font-bold px-1 md:px-1.5 py-0.5 rounded
                              ${lead.routing.quality === 'HOT' ? 'bg-orange-500/20 text-solar-orange border border-solar-orange/30' : 
                                lead.routing.quality === 'WARM' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 
                                'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
                               {lead.routing.quality === 'HOT' && <Flame size={10} fill="currentColor" />}
                               {lead.routing.score}
                            </span>
                            <span className="text-[10px] md:text-xs text-slate-400 font-mono hidden sm:inline">
                               {lead.routing.quality}
                            </span>
                          </div>
                          <div className="text-[9px] md:text-[10px] text-emerald-400 hidden sm:block">
                             Assign: <span className="font-bold">{lead.routing.recommendedAgentType}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-600 text-[10px] md:text-xs italic">Pending...</span>
                      )}
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4">
                      <span className={`px-1.5 md:px-2.5 py-0.5 md:py-1 rounded text-[10px] md:text-xs font-bold border uppercase tracking-wider
                        ${lead.status === 'NEW' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                          lead.status === 'QUALIFIED' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 
                          lead.status === 'CLOSED_WON' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                          lead.status === 'CLOSED_LOST' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                          'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
                        {lead.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4">
                       <div className="flex items-center gap-1 md:gap-2">
                          <Battery size={12} className="text-solar-orange md:w-[14px] md:h-[14px]"/>
                          <span className="font-mono font-bold text-slate-300 text-xs md:text-sm">${lead.estimatedBill}</span>
                       </div>
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 text-right">
                      <button className="text-slate-400 hover:text-white hover:bg-slate-700 px-2 md:px-3 py-1 md:py-1.5 rounded-md text-[10px] md:text-xs font-medium transition-colors border border-transparent hover:border-slate-600">
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredLeads.length === 0 && (
              <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                  <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-4">
                      <Sparkles size={24} className="text-slate-700" />
                  </div>
                  <p>No leads found matching your criteria.</p>
                  <button 
                    onClick={() => {setFilter('ALL'); setSearchTerm('');}}
                    className="mt-2 text-solar-orange hover:underline text-sm"
                  >
                    Clear filters
                  </button>
              </div>
          )}
        </div>
      </div>

      {/* Add Lead Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => !isRouting && setIsModalOpen(false)}></div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl relative overflow-hidden animate-fade-in z-10 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="px-4 md:px-6 py-3 md:py-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/30 sticky top-0">
                    <h3 className="text-base md:text-lg font-display font-bold text-white flex items-center gap-2">
                        <div className="p-1.5 bg-solar-orange/10 rounded-lg">
                           <Sparkles size={16} className="text-solar-orange"/> 
                        </div>
                        Add New Lead
                    </h3>
                    {!isRouting && (
                        <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* Form */}
                <form onSubmit={handleAddLead} className="p-4 md:p-6 space-y-3 md:space-y-4">
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
                                value={newLead.name}
                                onChange={e => setNewLead({...newLead, name: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
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
                                  value={newLead.estimatedBill}
                                  onChange={e => setNewLead({...newLead, estimatedBill: e.target.value})}
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
                                  value={newLead.age}
                                  onChange={e => setNewLead({...newLead, age: e.target.value})}
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
                                value={newLead.address}
                                onChange={e => setNewLead({...newLead, address: e.target.value})}
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
                                value={newLead.notes}
                                onChange={e => setNewLead({...newLead, notes: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
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
                                "Create Lead"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default LeadBoard;
