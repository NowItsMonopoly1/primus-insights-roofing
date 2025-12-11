// components/CompanySettings.tsx
// Company Settings Page - Multi-Company Architecture for Primus Home Pro

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  UserPlus,
  HardHat,
  Settings,
  Shield,
  Save,
  Trash2,
  Plus,
  Edit2,
  X,
  Check,
  Upload,
  Mail,
  Phone,
  MapPin,
  Clock,
  ChevronDown,
  ChevronRight,
  UserCircle,
  Briefcase,
  Star,
  AlertCircle,
  GitBranch,
  Timer,
  Sliders,
  DollarSign,
  Bell,
  Download,
  Upload as UploadIcon,
  FileText,
  RotateCcw,
} from 'lucide-react';
import PipelineEditor from './PipelineEditor';
import SLAEditor from './SLAEditor';
import CustomFieldsEditor from './CustomFieldsEditor';
import CommissionRulesEditor from './CommissionRulesEditor';
import AuditLogViewer from './AuditLogViewer';
import DataImportModal from './DataImportModal';
import DataExportModal from './DataExportModal';
import AdminOverrideTools from './AdminOverrideTools';
import {
  getActiveCompany,
  updateCompany,
  addTeam,
  deleteTeam,
  addRep,
  updateRep,
  deleteRep,
  addInstaller,
  updateInstaller,
  deleteInstaller,
  Company,
  Team,
  Rep,
  Installer,
} from '../services/companyStore';
import {
  ROLES,
  Role,
  ROLE_OPTIONS,
  PERMISSION_GROUPS,
  getRoleDisplayName,
  getRoleBadgeColor,
  can,
} from '../services/rbac';
import { UserProfile } from '../types';

interface Props {
  userProfile: UserProfile;
}

type TabType =
  | 'profile'
  | 'teams'
  | 'reps'
  | 'installers'
  | 'permissions'
  | 'pipeline'
  | 'sla'
  | 'customFields'
  | 'commissions'
  | 'dataExport'
  | 'dataImport'
  | 'auditLog'
  | 'dataTools'
  | 'adminControls';

export default function CompanySettings({ userProfile }: Props) {
  const [company, setCompany] = useState<Company | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [isSaved, setIsSaved] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Form states
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [editingRep, setEditingRep] = useState<Rep | null>(null);
  const [editingInstaller, setEditingInstaller] = useState<Installer | null>(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [showAddRep, setShowAddRep] = useState(false);
  const [showAddInstaller, setShowAddInstaller] = useState(false);

  useEffect(() => {
    const activeCompany = getActiveCompany();
    if (activeCompany) {
      setCompany({ ...activeCompany });
    }
  }, []);

  const handleSaveCompany = () => {
    if (company) {
      updateCompany(company);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
  };

  const handleProfileChange = (field: keyof Company, value: string) => {
    if (company) {
      setCompany({ ...company, [field]: value });
    }
  };

  const handleSettingsChange = (field: string, value: any) => {
    if (company) {
      setCompany({
        ...company,
        settings: { ...company.settings, [field]: value },
      });
    }
  };

  const handleAddTeam = () => {
    if (company && newTeamName.trim()) {
      const newTeam = addTeam(company.id, newTeamName.trim());
      if (newTeam) {
        setCompany({ ...getActiveCompany()! });
        setNewTeamName('');
        setShowAddTeam(false);
      }
    }
  };

  const handleDeleteTeam = (teamId: string) => {
    if (company && confirm('Delete this team? Reps will be unassigned.')) {
      deleteTeam(company.id, teamId);
      setCompany({ ...getActiveCompany()! });
    }
  };

  const handleAddRep = (rep: Partial<Rep>) => {
    if (company) {
      addRep(company.id, rep);
      setCompany({ ...getActiveCompany()! });
      setShowAddRep(false);
    }
  };

  const handleUpdateRep = (rep: Rep) => {
    if (company) {
      updateRep(company.id, rep);
      setCompany({ ...getActiveCompany()! });
      setEditingRep(null);
    }
  };

  const handleDeleteRep = (repId: string) => {
    if (company && confirm('Delete this rep?')) {
      deleteRep(company.id, repId);
      setCompany({ ...getActiveCompany()! });
    }
  };

  const handleAddInstaller = (installer: Partial<Installer>) => {
    if (company) {
      addInstaller(company.id, installer);
      setCompany({ ...getActiveCompany()! });
      setShowAddInstaller(false);
    }
  };

  const handleUpdateInstaller = (installer: Installer) => {
    if (company) {
      updateInstaller(company.id, installer);
      setCompany({ ...getActiveCompany()! });
      setEditingInstaller(null);
    }
  };

  const handleDeleteInstaller = (installerId: string) => {
    if (company && confirm('Delete this installer?')) {
      deleteInstaller(company.id, installerId);
      setCompany({ ...getActiveCompany()! });
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // RBAC Check
  if (!can(userProfile.role, 'COMPANY_SETTINGS')) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
          <Shield size={32} className="text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
        <p className="text-slate-400 max-w-md">
          You don't have permission to access Company Settings.
          Contact your administrator to request access.
        </p>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-solar-orange"></div>
      </div>
    );
  }

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'profile', label: 'Company Profile', icon: <Building2 size={16} /> },
    { id: 'teams', label: 'Teams', icon: <Users size={16} /> },
    { id: 'reps', label: 'Reps Directory', icon: <UserPlus size={16} /> },
    { id: 'installers', label: 'Installers', icon: <HardHat size={16} /> },
    { id: 'permissions', label: 'Permissions', icon: <Shield size={16} /> },
    { id: 'pipeline', label: 'Pipeline Stages', icon: <GitBranch size={16} /> },
    { id: 'sla', label: 'SLA Rules', icon: <Timer size={16} /> },
    { id: 'customFields', label: 'Custom Fields', icon: <Sliders size={16} /> },
    { id: 'commissions', label: 'Commission Rules', icon: <DollarSign size={16} /> },
    { id: 'auditLog', label: 'Audit Log', icon: <RotateCcw size={16} /> },
    { id: 'dataTools', label: 'Data Tools', icon: <FileText size={16} /> },
    { id: 'adminControls', label: 'Admin Controls', icon: <Shield size={16} /> },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-slate-100 flex items-center gap-3">
            <Settings className="text-solar-orange" />
            Company Settings
          </h2>
          <p className="text-slate-400 mt-1">
            Manage your company profile, teams, and permissions.
          </p>
        </div>
        <button
          onClick={handleSaveCompany}
          className="primary-btn flex items-center gap-2 px-4 py-2.5 bg-solar-orange hover:bg-orange-500 text-white rounded-lg font-bold transition-all shadow-lg shadow-solar-orange/20"
        >
          {isSaved ? <Check size={18} /> : <Save size={18} />}
          {isSaved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-slate-800 text-white border border-slate-600'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-700/50">
        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <Building2 size={20} className="text-solar-orange" />
              Company Profile
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Company Name */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Company Name
                </label>
                <input
                  type="text"
                  value={company.name}
                  onChange={(e) => handleProfileChange('name', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-solar-orange transition-all"
                  aria-label="Company name"
                />
              </div>

              {/* Primary Contact */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Primary Contact
                </label>
                <div className="relative">
                  <UserCircle size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={company.primaryContact}
                    onChange={(e) => handleProfileChange('primaryContact', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-slate-200 focus:outline-none focus:border-solar-orange transition-all"
                    aria-label="Primary contact"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Email
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    value={company.email}
                    onChange={(e) => handleProfileChange('email', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-slate-200 focus:outline-none focus:border-solar-orange transition-all"
                    aria-label="Company email"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Phone
                </label>
                <div className="relative">
                  <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="tel"
                    value={company.phone}
                    onChange={(e) => handleProfileChange('phone', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-slate-200 focus:outline-none focus:border-solar-orange transition-all"
                    aria-label="Company phone"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Address
                </label>
                <div className="relative">
                  <MapPin size={18} className="absolute left-3 top-3 text-slate-500" />
                  <textarea
                    value={company.address}
                    onChange={(e) => handleProfileChange('address', e.target.value)}
                    rows={2}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-slate-200 focus:outline-none focus:border-solar-orange transition-all resize-none"
                    aria-label="Company address"
                  />
                </div>
              </div>

              {/* Timezone */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Timezone
                </label>
                <div className="relative">
                  <Clock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <select
                    value={company.timezone}
                    onChange={(e) => handleProfileChange('timezone', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-slate-200 focus:outline-none focus:border-solar-orange transition-all cursor-pointer appearance-none"
                    aria-label="Company timezone"
                  >
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="America/Phoenix">Arizona (MST)</option>
                  </select>
                </div>
              </div>

              {/* Logo URL */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Logo URL
                </label>
                <div className="relative">
                  <Upload size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={company.logoUrl}
                    onChange={(e) => handleProfileChange('logoUrl', e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-slate-200 focus:outline-none focus:border-solar-orange transition-all placeholder:text-slate-600"
                    aria-label="Company logo URL"
                  />
                </div>
              </div>
            </div>

            {/* SLA Settings */}
            <div className="border-t border-slate-800 pt-6 mt-6">
              <h4 className="text-md font-bold text-white mb-4">SLA Targets (Days)</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Permit Days
                  </label>
                  <input
                    type="number"
                    value={company.settings.slaTargets.permitDays}
                    onChange={(e) =>
                      setCompany({
                        ...company,
                        settings: {
                          ...company.settings,
                          slaTargets: {
                            ...company.settings.slaTargets,
                            permitDays: parseInt(e.target.value) || 0,
                          },
                        },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-solar-orange transition-all"
                    aria-label="Permit SLA days"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Install Days
                  </label>
                  <input
                    type="number"
                    value={company.settings.slaTargets.installDays}
                    onChange={(e) =>
                      setCompany({
                        ...company,
                        settings: {
                          ...company.settings,
                          slaTargets: {
                            ...company.settings.slaTargets,
                            installDays: parseInt(e.target.value) || 0,
                          },
                        },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-solar-orange transition-all"
                    aria-label="Install SLA days"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Inspection Days
                  </label>
                  <input
                    type="number"
                    value={company.settings.slaTargets.inspectionDays}
                    onChange={(e) =>
                      setCompany({
                        ...company,
                        settings: {
                          ...company.settings,
                          slaTargets: {
                            ...company.settings.slaTargets,
                            inspectionDays: parseInt(e.target.value) || 0,
                          },
                        },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-solar-orange transition-all"
                    aria-label="Inspection SLA days"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TEAMS TAB */}
        {activeTab === 'teams' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Users size={20} className="text-solar-orange" />
                Teams ({company.teams.length})
              </h3>
              <button
                onClick={() => setShowAddTeam(true)}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-bold transition-all"
              >
                <Plus size={16} /> Add Team
              </button>
            </div>

            {/* Add Team Form */}
            {showAddTeam && (
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 animate-fade-in">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="Team name..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-solar-orange"
                    aria-label="New team name"
                    autoFocus
                  />
                  <button
                    onClick={handleAddTeam}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-all"
                    title="Add team"
                    aria-label="Add team"
                  >
                    <Check size={18} aria-hidden="true" />
                    <span className="sr-only">Add team</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowAddTeam(false);
                      setNewTeamName('');
                    }}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold transition-all"
                    title="Cancel add team"
                    aria-label="Cancel add team"
                  >
                    <X size={18} aria-hidden="true" />
                    <span className="sr-only">Cancel</span>
                  </button>
                </div>
              </div>
            )}

            {/* Teams List */}
            <div className="space-y-3">
              {company.teams.map((team) => {
                const teamReps = company.reps.filter((r) => r.teamId === team.id);
                return (
                  <div
                    key={team.id}
                    className="bg-slate-800/30 rounded-lg border border-slate-700/50 overflow-hidden"
                  >
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-800/50 transition-all"
                      onClick={() => toggleSection(`team-${team.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        {expandedSections[`team-${team.id}`] ? (
                          <ChevronDown size={18} className="text-slate-500" />
                        ) : (
                          <ChevronRight size={18} className="text-slate-500" />
                        )}
                        <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                          <Users size={18} className="text-slate-400" />
                        </div>
                        <div>
                          <h4 className="font-bold text-white">{team.name}</h4>
                          <p className="text-xs text-slate-500">
                            {teamReps.length} rep{teamReps.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTeam(team.id);
                          }}
                          className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                          title="Delete team"
                          aria-label="Delete team"
                          disabled={company.teams.length <= 1}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    {expandedSections[`team-${team.id}`] && (
                      <div className="px-4 pb-4 pt-2 border-t border-slate-700/50">
                        {teamReps.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {teamReps.map((rep) => (
                              <div
                                key={rep.id}
                                className="flex items-center gap-2 p-2 bg-slate-800/50 rounded-lg"
                              >
                                <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
                                  <UserCircle size={16} className="text-slate-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-white truncate">
                                    {rep.name}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {getRoleDisplayName(rep.role as Role)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500 italic">
                            No reps assigned to this team
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* REPS TAB */}
        {activeTab === 'reps' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UserPlus size={20} className="text-solar-orange" />
                Reps Directory ({company.reps.length})
              </h3>
              <button
                onClick={() => setShowAddRep(true)}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-bold transition-all"
              >
                <Plus size={16} /> Add Rep
              </button>
            </div>

            {/* Add/Edit Rep Form */}
            {(showAddRep || editingRep) && (
              <RepForm
                rep={editingRep}
                teams={company.teams}
                onSave={(rep) => {
                  if (editingRep) {
                    handleUpdateRep(rep as Rep);
                  } else {
                    handleAddRep(rep);
                  }
                }}
                onCancel={() => {
                  setShowAddRep(false);
                  setEditingRep(null);
                }}
              />
            )}

            {/* Reps List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {company.reps.map((rep) => {
                const team = company.teams.find((t) => t.id === rep.teamId);
                return (
                  <div
                    key={rep.id}
                    className="bg-slate-800/30 rounded-lg border border-slate-700/50 p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center">
                          <UserCircle size={24} className="text-slate-400" />
                        </div>
                        <div>
                          <h4 className="font-bold text-white">{rep.name}</h4>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full border ${getRoleBadgeColor(
                              rep.role as Role
                            )}`}
                          >
                            {getRoleDisplayName(rep.role as Role)}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setEditingRep(rep)}
                          className="p-1.5 text-slate-500 hover:text-white transition-colors"
                          title="Edit rep"
                          aria-label="Edit rep"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteRep(rep.id)}
                          className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                          title="Delete rep"
                          aria-label="Delete rep"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5 text-sm">
                      {rep.email && (
                        <p className="text-slate-400 flex items-center gap-2">
                          <Mail size={12} /> {rep.email}
                        </p>
                      )}
                      {rep.phone && (
                        <p className="text-slate-400 flex items-center gap-2">
                          <Phone size={12} /> {rep.phone}
                        </p>
                      )}
                      {team && (
                        <p className="text-slate-400 flex items-center gap-2">
                          <Users size={12} /> {team.name}
                        </p>
                      )}
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center justify-between">
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          rep.isActive
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-slate-500/20 text-slate-400'
                        }`}
                      >
                        {rep.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* INSTALLERS TAB */}
        {activeTab === 'installers' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <HardHat size={20} className="text-solar-orange" />
                Installers ({company.installers.length})
              </h3>
              <button
                onClick={() => setShowAddInstaller(true)}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-bold transition-all"
              >
                <Plus size={16} /> Add Installer
              </button>
            </div>

            {/* Add/Edit Installer Form */}
            {(showAddInstaller || editingInstaller) && (
              <InstallerForm
                installer={editingInstaller}
                onSave={(installer) => {
                  if (editingInstaller) {
                    handleUpdateInstaller(installer as Installer);
                  } else {
                    handleAddInstaller(installer);
                  }
                }}
                onCancel={() => {
                  setShowAddInstaller(false);
                  setEditingInstaller(null);
                }}
              />
            )}

            {/* Installers List */}
            {company.installers.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <HardHat size={48} className="mx-auto mb-4 opacity-50" />
                <p className="font-medium">No installers added yet</p>
                <p className="text-sm mt-1">Add installers to assign them to projects</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {company.installers.map((installer) => (
                  <div
                    key={installer.id}
                    className="bg-slate-800/30 rounded-lg border border-slate-700/50 p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center">
                          <HardHat size={24} className="text-amber-500" />
                        </div>
                        <div>
                          <h4 className="font-bold text-white">{installer.name}</h4>
                          <div className="flex items-center gap-1 mt-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={12}
                                className={
                                  i < installer.rating
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-slate-600'
                                }
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setEditingInstaller(installer)}
                          className="p-1.5 text-slate-500 hover:text-white transition-colors"
                          title="Edit installer"
                          aria-label="Edit installer"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteInstaller(installer.id)}
                          className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                          title="Delete installer"
                          aria-label="Delete installer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5 text-sm">
                      {installer.email && (
                        <p className="text-slate-400 flex items-center gap-2">
                          <Mail size={12} /> {installer.email}
                        </p>
                      )}
                      {installer.phone && (
                        <p className="text-slate-400 flex items-center gap-2">
                          <Phone size={12} /> {installer.phone}
                        </p>
                      )}
                      {installer.licenseNumber && (
                        <p className="text-slate-400 flex items-center gap-2">
                          <Briefcase size={12} /> License: {installer.licenseNumber}
                        </p>
                      )}
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        {installer.totalInstalls} installs
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          installer.isActive
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-slate-500/20 text-slate-400'
                        }`}
                      >
                        {installer.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PERMISSIONS TAB */}
        {activeTab === 'permissions' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Shield size={20} className="text-solar-orange" />
                Role Permissions Overview
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Permission</th>
                    {ROLE_OPTIONS.map((role) => (
                      <th
                        key={role.value}
                        className="text-center py-3 px-2 text-slate-400 font-medium"
                      >
                        <span
                          className={`px-2 py-1 rounded text-xs ${getRoleBadgeColor(
                            role.value
                          )}`}
                        >
                          {role.label}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(PERMISSION_GROUPS).map(([groupKey, group]) => (
                    <React.Fragment key={groupKey}>
                      <tr className="bg-slate-800/30">
                        <td
                          colSpan={ROLE_OPTIONS.length + 1}
                          className="py-2 px-4 font-bold text-solar-orange text-xs uppercase tracking-wider"
                        >
                          {group.label}
                        </td>
                      </tr>
                      {group.permissions.map((perm) => (
                        <tr key={perm} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                          <td className="py-2 px-4 text-slate-300">
                            {perm.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                          </td>
                          {ROLE_OPTIONS.map((role) => (
                            <td key={role.value} className="text-center py-2 px-2">
                              {can(role.value, perm) ? (
                                <Check size={16} className="inline text-emerald-400" />
                              ) : (
                                <X size={16} className="inline text-slate-600" />
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PIPELINE STAGES TAB */}
        {activeTab === 'pipeline' && <PipelineEditor />}

        {/* SLA RULES TAB */}
        {activeTab === 'sla' && <SLAEditor />}

        {/* CUSTOM FIELDS TAB */}
        {activeTab === 'customFields' && <CustomFieldsEditor />}

        {/* COMMISSION RULES TAB */}
        {activeTab === 'commissions' && <CommissionRulesEditor />}

        {/* AUDIT LOG TAB */}
        {activeTab === 'auditLog' && (
          <div className="animate-fade-in">
            <AuditLogViewer />
          </div>
        )}

        {/* DATA TOOLS TAB (Import/Export) */}
        {activeTab === 'dataTools' && (
          <div className="flex flex-col md:flex-row gap-8 animate-fade-in">
            <div className="flex-1">
              <DataImportModal isOpen={true} onClose={() => {}} />
            </div>
            <div className="flex-1">
              <DataExportModal isOpen={true} onClose={() => {}} />
            </div>
          </div>
        )}

        {/* ADMIN CONTROLS TAB */}
        {activeTab === 'adminControls' && (
          <div className="animate-fade-in">
            <AdminOverrideTools />
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface RepFormProps {
  rep: Rep | null;
  teams: Team[];
  onSave: (rep: Partial<Rep>) => void;
  onCancel: () => void;
}

function RepForm({ rep, teams, onSave, onCancel }: RepFormProps) {
  const [formData, setFormData] = useState<Partial<Rep>>({
    name: rep?.name || '',
    email: rep?.email || '',
    phone: rep?.phone || '',
    role: rep?.role || 'rep',
    teamId: rep?.teamId || null,
    isActive: rep?.isActive ?? true,
    ...(rep ? { id: rep.id } : {}),
  });

  return (
    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 animate-fade-in">
      <h4 className="font-bold text-white mb-4">{rep ? 'Edit Rep' : 'Add New Rep'}</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-solar-orange"
            aria-label="Rep name"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-solar-orange"
            aria-label="Rep email"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phone</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-solar-orange"
            aria-label="Rep phone"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Role</label>
          <select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-solar-orange cursor-pointer"
            aria-label="Rep role"
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Team</label>
          <select
            value={formData.teamId || ''}
            onChange={(e) => setFormData({ ...formData, teamId: e.target.value || null })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-solar-orange cursor-pointer"
            aria-label="Rep team"
          >
            <option value="">No Team</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status</label>
          <select
            value={formData.isActive ? 'active' : 'inactive'}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'active' })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-solar-orange cursor-pointer"
            aria-label="Rep status"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-700">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-all"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(formData)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-all"
        >
          {rep ? 'Update' : 'Add'} Rep
        </button>
      </div>
    </div>
  );
}

interface InstallerFormProps {
  installer: Installer | null;
  onSave: (installer: Partial<Installer>) => void;
  onCancel: () => void;
}

function InstallerForm({ installer, onSave, onCancel }: InstallerFormProps) {
  const [formData, setFormData] = useState<Partial<Installer>>({
    name: installer?.name || '',
    email: installer?.email || '',
    phone: installer?.phone || '',
    licenseNumber: installer?.licenseNumber || '',
    rating: installer?.rating || 5,
    isActive: installer?.isActive ?? true,
    ...(installer ? { id: installer.id, totalInstalls: installer.totalInstalls } : {}),
  });

  return (
    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 animate-fade-in">
      <h4 className="font-bold text-white mb-4">
        {installer ? 'Edit Installer' : 'Add New Installer'}
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-solar-orange"
            aria-label="Installer name"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-solar-orange"
            aria-label="Installer email"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phone</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-solar-orange"
            aria-label="Installer phone"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            License Number
          </label>
          <input
            type="text"
            value={formData.licenseNumber}
            onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-solar-orange"
            aria-label="Installer license number"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Rating (1-5)
          </label>
          <input
            type="number"
            min="1"
            max="5"
            value={formData.rating}
            onChange={(e) =>
              setFormData({ ...formData, rating: Math.min(5, Math.max(1, parseInt(e.target.value) || 1)) })
            }
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-solar-orange"
            aria-label="Installer rating"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status</label>
          <select
            value={formData.isActive ? 'active' : 'inactive'}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'active' })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-solar-orange cursor-pointer"
            aria-label="Installer status"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-700">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-all"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(formData)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-all"
        >
          {installer ? 'Update' : 'Add'} Installer
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// DATA EXPORT TAB
// ============================================================================

import { dataApi } from '../services/api';

interface DataExportTabProps {
  companyId: string;
}

function DataExportTab({ companyId }: DataExportTabProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<string | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setExportResult(null);
    
    try {
      const response = await dataApi.exportAll();
      if (response.success && response.data) {
        // Create downloadable JSON file
        const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `primus_export_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        const counts = [
          `${response.data.leads?.length || 0} leads`,
          `${response.data.projects?.length || 0} projects`,
          `${response.data.commissions?.length || 0} commissions`,
          `${response.data.reps?.length || 0} reps`,
          `${response.data.installers?.length || 0} installers`
        ].join(', ');
        
        setExportResult(`✅ Export successful: ${counts}`);
      } else {
        setExportResult(`❌ Export failed: ${response.error}`);
      }
    } catch (err) {
      setExportResult('❌ Export failed: Unknown error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
      <div className="flex items-center gap-3 mb-4">
        <Download className="text-emerald-400" size={24} />
        <h3 className="text-xl font-bold text-white">Export Company Data</h3>
      </div>
      
      <p className="text-slate-400 mb-6">
        Export all your company data including leads, projects, commissions, reps, and installers 
        as a JSON file. This can be used for backup or migration purposes.
      </p>
      
      <div className="bg-slate-950 rounded-lg p-4 mb-6 border border-slate-800">
        <h4 className="text-sm font-bold text-slate-300 mb-2">Included Data:</h4>
        <ul className="text-sm text-slate-400 space-y-1">
          <li>• All leads and their custom field values</li>
          <li>• All projects with SLA tracking data</li>
          <li>• Commission records</li>
          <li>• Rep directory</li>
          <li>• Installer directory</li>
        </ul>
      </div>
      
      <button
        onClick={handleExport}
        disabled={isExporting}
        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-bold transition-all flex items-center gap-2"
      >
        {isExporting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            Exporting...
          </>
        ) : (
          <>
            <Download size={18} />
            Export All Data
          </>
        )}
      </button>
      
      {exportResult && (
        <div className={`mt-4 p-3 rounded-lg ${
          exportResult.startsWith('✅') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
        }`}>
          {exportResult}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// DATA IMPORT TAB
// ============================================================================

interface DataImportTabProps {
  companyId: string;
  onImportComplete: () => void;
}

function DataImportTab({ companyId, onImportComplete }: DataImportTabProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImportResult(null);
      setPreviewData(null);
      
      // Read and preview
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          setPreviewData(data);
        } catch {
          setImportResult('❌ Invalid JSON file');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleImport = async () => {
    if (!previewData) return;
    
    setIsImporting(true);
    setImportResult(null);
    
    try {
      const response = await dataApi.importAll(previewData);
      if (response.success && response.data) {
        const counts = Object.entries(response.data.imported)
          .map(([key, count]) => `${count} ${key}`)
          .join(', ');
        
        setImportResult(`✅ Import successful: ${counts}`);
        onImportComplete();
      } else {
        setImportResult(`❌ Import failed: ${response.error}`);
      }
    } catch (err) {
      setImportResult('❌ Import failed: Unknown error');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
      <div className="flex items-center gap-3 mb-4">
        <UploadIcon className="text-blue-400" size={24} />
        <h3 className="text-xl font-bold text-white">Import Company Data</h3>
      </div>
      
      <p className="text-slate-400 mb-6">
        Import data from a previously exported JSON file. This will add the imported data 
        to your existing records (duplicates will be created).
      </p>
      
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-2">
          <AlertCircle className="text-yellow-400 mt-0.5" size={18} />
          <div>
            <h4 className="text-sm font-bold text-yellow-400">Caution</h4>
            <p className="text-sm text-yellow-300/80">
              Importing data will not replace existing records. All imported items will be added as new entries.
              Make sure you have a backup before importing.
            </p>
          </div>
        </div>
      </div>
      
      {/* File Input */}
      <div className="mb-6">
        <label 
          className="block w-full p-8 border-2 border-dashed border-slate-700 rounded-xl hover:border-slate-600 cursor-pointer transition-colors text-center"
        >
          <input
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
          />
          <UploadIcon className="mx-auto mb-2 text-slate-500" size={32} />
          <p className="text-slate-400">
            {selectedFile ? selectedFile.name : 'Click to select a JSON file'}
          </p>
        </label>
      </div>
      
      {/* Preview */}
      {previewData && (
        <div className="bg-slate-950 rounded-lg p-4 mb-6 border border-slate-800">
          <h4 className="text-sm font-bold text-slate-300 mb-2">Preview:</h4>
          <ul className="text-sm text-slate-400 space-y-1">
            <li>• {previewData.leads?.length || 0} leads</li>
            <li>• {previewData.projects?.length || 0} projects</li>
            <li>• {previewData.commissions?.length || 0} commissions</li>
            <li>• {previewData.reps?.length || 0} reps</li>
            <li>• {previewData.installers?.length || 0} installers</li>
          </ul>
          {previewData.exportedAt && (
            <p className="text-xs text-slate-500 mt-2">
              Exported: {new Date(previewData.exportedAt).toLocaleString()}
            </p>
          )}
        </div>
      )}
      
      <button
        onClick={handleImport}
        disabled={isImporting || !previewData}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-bold transition-all flex items-center gap-2"
      >
        {isImporting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            Importing...
          </>
        ) : (
          <>
            <UploadIcon size={18} />
            Import Data
          </>
        )}
      </button>
      
      {importResult && (
        <div className={`mt-4 p-3 rounded-lg ${
          importResult.startsWith('✅') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
        }`}>
          {importResult}
        </div>
      )}
    </div>
  );
}