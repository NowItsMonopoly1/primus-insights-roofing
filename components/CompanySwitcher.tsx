// components/CompanySwitcher.tsx
// Global Company Switcher - Multi-Company Architecture for Primus Home Pro

import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  ChevronDown,
  Check,
  Plus,
  Settings,
  X,
} from 'lucide-react';
import {
  getCompanies,
  getActiveCompanyId,
  setActiveCompanyId,
  addCompany,
  createDefaultCompany,
  Company,
  loadCompanyState,
} from '../services/companyStore';

interface Props {
  onNavigateToSettings?: () => void;
  compact?: boolean;
}

export default function CompanySwitcher({ onNavigateToSettings, compact = false }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadCompanyState();
    refreshCompanies();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const refreshCompanies = () => {
    setCompanies(getCompanies());
    setActiveId(getActiveCompanyId());
  };

  const handleSelectCompany = (companyId: string) => {
    setActiveCompanyId(companyId);
    setActiveId(companyId);
    setIsOpen(false);
    // Trigger page reload to refresh all data with new company context
    window.location.reload();
  };

  const handleCreateCompany = () => {
    if (newCompanyName.trim()) {
      const newCompany = addCompany({ name: newCompanyName.trim() });
      setNewCompanyName('');
      setShowCreateModal(false);
      refreshCompanies();
      handleSelectCompany(newCompany.id);
    }
  };

  const activeCompany = companies.find((c) => c.id === activeId);

  if (compact) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-2 py-1.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-lg transition-all group"
          title="Switch company"
          aria-label="Switch company"
        >
          <div className="w-6 h-6 bg-solar-orange/20 rounded flex items-center justify-center">
            {activeCompany?.logoUrl ? (
              <img
                src={activeCompany.logoUrl}
                alt={activeCompany.name}
                className="w-full h-full object-cover rounded"
              />
            ) : (
              <Building2 size={14} className="text-solar-orange" />
            )}
          </div>
          <ChevronDown
            size={14}
            className={`text-slate-500 group-hover:text-slate-300 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {isOpen && (
          <CompanyDropdown
            companies={companies}
            activeId={activeId}
            onSelect={handleSelectCompany}
            onCreateNew={() => {
              setIsOpen(false);
              setShowCreateModal(true);
            }}
            onSettings={onNavigateToSettings}
          />
        )}

        {showCreateModal && (
          <CreateCompanyModal
            value={newCompanyName}
            onChange={setNewCompanyName}
            onSubmit={handleCreateCompany}
            onClose={() => {
              setShowCreateModal(false);
              setNewCompanyName('');
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-3 py-2.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-xl transition-all group"
        title="Switch company"
        aria-label="Switch company"
      >
        <div className="w-9 h-9 bg-solar-orange/20 rounded-lg flex items-center justify-center flex-shrink-0">
          {activeCompany?.logoUrl ? (
            <img
              src={activeCompany.logoUrl}
              alt={activeCompany.name}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <Building2 size={18} className="text-solar-orange" />
          )}
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-bold text-white truncate">
            {activeCompany?.name || 'Select Company'}
          </p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">
            {companies.length} workspace{companies.length !== 1 ? 's' : ''}
          </p>
        </div>
        <ChevronDown
          size={16}
          className={`text-slate-500 group-hover:text-slate-300 transition-transform flex-shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <CompanyDropdown
          companies={companies}
          activeId={activeId}
          onSelect={handleSelectCompany}
          onCreateNew={() => {
            setIsOpen(false);
            setShowCreateModal(true);
          }}
          onSettings={onNavigateToSettings}
        />
      )}

      {showCreateModal && (
        <CreateCompanyModal
          value={newCompanyName}
          onChange={setNewCompanyName}
          onSubmit={handleCreateCompany}
          onClose={() => {
            setShowCreateModal(false);
            setNewCompanyName('');
          }}
        />
      )}
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface CompanyDropdownProps {
  companies: Company[];
  activeId: string;
  onSelect: (id: string) => void;
  onCreateNew: () => void;
  onSettings?: () => void;
}

function CompanyDropdown({
  companies,
  activeId,
  onSelect,
  onCreateNew,
  onSettings,
}: CompanyDropdownProps) {
  return (
    <div className="absolute left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
      <div className="max-h-64 overflow-y-auto">
        {companies.map((company) => (
          <button
            key={company.id}
            onClick={() => onSelect(company.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-800 transition-all text-left ${
              company.id === activeId ? 'bg-slate-800/50' : ''
            }`}
          >
            <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
              {company.logoUrl ? (
                <img
                  src={company.logoUrl}
                  alt={company.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <Building2 size={16} className="text-slate-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{company.name}</p>
              <p className="text-[10px] text-slate-500">
                {company.reps.length} rep{company.reps.length !== 1 ? 's' : ''} •{' '}
                {company.teams.length} team{company.teams.length !== 1 ? 's' : ''}
              </p>
            </div>
            {company.id === activeId && (
              <Check size={16} className="text-emerald-400 flex-shrink-0" />
            )}
          </button>
        ))}
      </div>

      <div className="border-t border-slate-700">
        <button
          onClick={onCreateNew}
          className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-slate-800 transition-all text-left text-sm text-slate-400 hover:text-white"
        >
          <Plus size={16} />
          Create New Company
        </button>
        {onSettings && (
          <button
            onClick={onSettings}
            className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-slate-800 transition-all text-left text-sm text-slate-400 hover:text-white"
          >
            <Settings size={16} />
            Company Settings
          </button>
        )}
      </div>
    </div>
  );
}

interface CreateCompanyModalProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

function CreateCompanyModal({ value, onChange, onSubmit, onClose }: CreateCompanyModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden animate-fade-in z-10">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/30">
          <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
            <div className="p-1.5 bg-solar-orange/10 rounded-lg">
              <Building2 size={16} className="text-solar-orange" />
            </div>
            Create New Company
          </h3>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors"
            title="Close"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Company Name
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="e.g. Sunshine Solar Co."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-solar-orange transition-all placeholder:text-slate-600"
              aria-label="Company name"
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              disabled={!value.trim()}
              className="px-4 py-2 bg-solar-orange hover:bg-orange-500 text-white rounded-lg font-bold transition-colors shadow-lg shadow-solar-orange/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Company
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
