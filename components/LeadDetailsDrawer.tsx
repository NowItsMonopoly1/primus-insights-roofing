import React from 'react';
import { X, User, MapPin, DollarSign, Calendar, FileText, Flame, Tag, Brain, Zap } from 'lucide-react';
import { Lead } from '../types';
import { getScoreColor, getPriorityColor } from '../services/leadIntelligence';

interface LeadDetailsDrawerProps {
  open: boolean;
  lead: Lead | null;
  onClose: () => void;
}

const LeadDetailsDrawer: React.FC<LeadDetailsDrawerProps> = ({ open, lead, onClose }) => {
  if (!open || !lead) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'CONTACTED': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'QUALIFIED': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'PROPOSAL_SENT': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'CLOSED_WON': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'CLOSED_LOST': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getQualityColor = (quality?: string) => {
    switch (quality) {
      case 'HOT': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'WARM': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'COLD': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl z-50 overflow-y-auto animate-slide-in-right">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-display font-bold text-white flex items-center gap-2">
            <User size={18} className="text-solar-orange" />
            Lead Details
          </h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Name & Status */}
          <div className="space-y-3">
            <h3 className="text-2xl font-bold text-white">{lead.name}</h3>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(lead.status)}`}>
                {lead.status.replace('_', ' ')}
              </span>
              {lead.routing?.quality && (
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${getQualityColor(lead.routing.quality)}`}>
                  <Flame size={12} />
                  {lead.routing.quality}
                </span>
              )}
            </div>
          </div>

          {/* Info Cards */}
          <div className="space-y-3">
            {/* Address */}
            <div className="glass-panel p-4 rounded-xl border border-slate-800">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-800 rounded-lg">
                  <MapPin size={16} className="text-slate-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Address</p>
                  <p className="text-slate-200 mt-0.5">{lead.address}</p>
                </div>
              </div>
            </div>

            {/* Estimated Bill */}
            <div className="glass-panel p-4 rounded-xl border border-slate-800">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <DollarSign size={16} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Est. Monthly Bill</p>
                  <p className="text-2xl font-mono font-bold text-emerald-400 mt-0.5">
                    ${lead.estimatedBill?.toLocaleString() ?? 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Age */}
            {lead.age && (
              <div className="glass-panel p-4 rounded-xl border border-slate-800">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-800 rounded-lg">
                    <Calendar size={16} className="text-slate-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Age</p>
                    <p className="text-slate-200 mt-0.5">
                      {lead.age} years old
                      {lead.age > 65 && (
                        <span className="ml-2 text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded border border-red-500/30">
                          SENIOR
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            {lead.notes && (
              <div className="glass-panel p-4 rounded-xl border border-slate-800">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-800 rounded-lg">
                    <FileText size={16} className="text-slate-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Notes</p>
                    <p className="text-slate-300 mt-1 text-sm leading-relaxed">{lead.notes}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* AI Insights Section (Future-Proofed) */}
          {(lead.aiScore !== undefined || lead.routing) && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Brain size={14} />
                AI Intelligence
              </h4>
              
              {/* New AI Score from leadIntelligence */}
              {lead.aiScore !== undefined && (
                <div className="glass-panel p-4 rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Zap size={14} className="text-emerald-400" />
                      <span className="text-xs font-bold text-slate-400">Lead IQ Score</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xl font-mono font-bold ${getScoreColor(lead.aiScore)}`}>{lead.aiScore}</span>
                      {lead.priority && (
                        <span className={`text-[10px] px-2 py-0.5 rounded border font-bold uppercase ${getPriorityColor(lead.priority)}`}>
                          {lead.priority}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        lead.aiScore >= 75 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' :
                        lead.aiScore >= 50 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' :
                        'bg-gradient-to-r from-red-500 to-red-400'
                      }`}
                      style={{ width: `${lead.aiScore}%` }}
                    />
                  </div>
                </div>
              )}

              {/* AI Tags */}
              {lead.aiTags && lead.aiTags.length > 0 && (
                <div className="glass-panel p-4 rounded-xl border border-slate-800">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-slate-800 rounded-lg">
                      <Tag size={16} className="text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">AI Tags</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {lead.aiTags.map((tag, i) => (
                          <span key={i} className="text-xs px-2 py-1 bg-slate-800 text-slate-300 rounded-full border border-slate-700">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Legacy AI Routing Score (if available) */}
              {lead.routing && (
                <>
                  <div className="glass-panel p-4 rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-400">Routing Score</span>
                      <span className="text-lg font-mono font-bold text-solar-orange">{lead.routing.score}/100</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-solar-orange to-red-500 rounded-full transition-all duration-500"
                        style={{ width: `${lead.routing.score}%` }}
                      />
                    </div>
                    {lead.routing.reasoning && (
                      <p className="text-xs text-slate-500 mt-2">{lead.routing.reasoning}</p>
                    )}
                  </div>

                  {/* Recommended Agent */}
                  {lead.routing.recommendedAgentType && (
                    <div className="glass-panel p-4 rounded-xl border border-slate-800">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                          <User size={16} className="text-purple-400" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Recommended Agent</p>
                          <p className="text-purple-400 font-medium mt-0.5">{lead.routing.recommendedAgentType}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* No AI Data Placeholder */}
              {!lead.aiScore && !lead.routing && (
                <div className="glass-panel p-4 rounded-xl border border-slate-800 border-dashed opacity-50">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-slate-800 rounded-lg">
                      <Zap size={16} className="text-slate-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">AI Intelligence</p>
                      <p className="text-slate-600 text-xs mt-0.5">No AI analysis yet. Edit this lead to run intelligence.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-6 py-4">
          <button 
            onClick={onClose}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-2.5 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default LeadDetailsDrawer;
