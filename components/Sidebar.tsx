import React from 'react';
import { LayoutDashboard, Sun, DollarSign, Settings, Zap, Briefcase, HardHat, ChevronRight, CreditCard, ArrowUpCircle, X, Building2 } from 'lucide-react';
import { UserProfile, PlanId } from '../types';
import { AVATAR_OPTIONS } from '../constants';
import CompanySwitcher from './CompanySwitcher';
import { can } from '../services/rbac';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userProfile: UserProfile;
  onRequestUpgrade: (plan: PlanId) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, userProfile, onRequestUpgrade, sidebarOpen, setSidebarOpen }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'leads', label: 'Lead Board', icon: Briefcase },
    { id: 'solar-tools', label: 'Solar Intelligence', icon: Sun },
    { id: 'projects', label: 'Projects', icon: HardHat },
    { id: 'commissions', label: 'Commissions', icon: DollarSign },
  ];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const selectedAvatar = AVATAR_OPTIONS.find(a => a.id === userProfile.avatarId);

  const handleQuickUpgrade = () => {
      const nextTier = userProfile.plan === 'FREE' ? 'PRO' : 'TEAM';
      onRequestUpgrade(nextTier);
  };

  return (
    <aside className={`w-64 bg-slate-950/95 backdrop-blur-xl border-r border-slate-800 flex flex-col h-screen fixed left-0 top-0 z-40 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-solar-orange to-red-600 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Zap size={18} className="text-white fill-white" />
          </div>
          <div>
            <h1 className="text-sm font-display font-bold tracking-tight text-white leading-none">PRIMUS <span className="text-solar-orange">HOME PRO</span></h1>
            <span className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Sales OS v2.0</span>
          </div>
        </div>
        {/* Close button for mobile */}
        <button 
          onClick={() => setSidebarOpen(false)}
          title="Close sidebar"
          aria-label="Close sidebar"
          className="md:hidden text-slate-400 hover:text-white p-1"
        >
          <X size={20} />
        </button>
      </div>

      {/* Company Switcher */}
      <div className="px-3 pt-4">
        <CompanySwitcher 
          onNavigateToSettings={() => setActiveTab('company')}
        />
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 mb-2">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Main Menu</span>
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                isActive 
                  ? 'bg-slate-900 text-white shadow-inner shadow-black/20' 
                  : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                  <Icon size={18} className={isActive ? 'text-solar-orange' : 'text-slate-500 group-hover:text-slate-400'} />
                  <span className="font-medium text-sm">{item.label}</span>
              </div>
              {isActive && <div className="w-1.5 h-1.5 rounded-full bg-solar-orange shadow-[0_0_8px_rgba(245,158,11,0.8)]"></div>}
            </button>
          );
        })}

        <div className="my-6 border-t border-slate-800/50 mx-3"></div>

        <div className="px-3 mb-2">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">System</span>
        </div>
        
        <button
          onClick={() => setActiveTab('billing')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
            activeTab === 'billing'
              ? 'bg-slate-900 text-white' 
              : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-200'
          }`}
        >
           <CreditCard size={18} className={activeTab === 'billing' ? 'text-solar-orange' : 'text-slate-500 group-hover:text-slate-400'} />
           <span className="font-medium text-sm">Billing</span>
        </button>

        {/* Company Settings - Admin Only */}
        {can(userProfile.role.toLowerCase(), 'COMPANY_SETTINGS') && (
          <button
            onClick={() => setActiveTab('company')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
              activeTab === 'company'
                ? 'bg-slate-900 text-white' 
                : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-200'
            }`}
          >
             <Building2 size={18} className={activeTab === 'company' ? 'text-solar-orange' : 'text-slate-500 group-hover:text-slate-400'} />
             <span className="font-medium text-sm">Company</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('profile')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
            activeTab === 'profile'
              ? 'bg-slate-900 text-white' 
              : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-200'
          }`}
        >
           <Settings size={18} className={activeTab === 'profile' ? 'text-solar-orange' : 'text-slate-500 group-hover:text-slate-400'} />
           <span className="font-medium text-sm">Settings</span>
        </button>
      </nav>

      {/* Upgrade CTA */}
      {userProfile.plan !== 'DEALER' && (
          <div className="px-4 mb-4">
              <button 
                onClick={handleQuickUpgrade}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-solar-orange/10 to-red-500/10 border border-solar-orange/20 text-solar-orange hover:bg-solar-orange hover:text-white px-3 py-2 rounded-lg text-xs font-bold transition-all group"
              >
                  <ArrowUpCircle size={14} />
                  Upgrade Plan
              </button>
          </div>
      )}

      {/* User Footer */}
      <div className="p-4 border-t border-slate-800/50">
        <button 
          onClick={() => setActiveTab('profile')}
          className="w-full group flex items-center gap-3 p-2 rounded-lg hover:bg-slate-900/50 transition-all border border-transparent hover:border-slate-800 cursor-pointer"
        >
          <div className="relative">
             <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white border border-slate-700 group-hover:border-slate-500 transition-colors ${selectedAvatar ? selectedAvatar.gradient : 'bg-slate-800 text-slate-300'}`}>
               {getInitials(userProfile.name)}
             </div>
             <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-950 rounded-full"></div>
          </div>
          <div className="flex-1 text-left min-w-0">
             <p className="text-sm font-medium text-slate-200 truncate group-hover:text-white">{userProfile.name}</p>
             <p className="text-[10px] text-slate-500 uppercase tracking-wider truncate">{userProfile.plan} Plan</p>
          </div>
          <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-400" />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
