
import React from 'react';
import { LayoutDashboard, Sun, DollarSign, Settings, Zap, Briefcase, HardHat, ChevronRight } from 'lucide-react';
import { UserProfile } from '../types';
import { AVATAR_OPTIONS } from '../constants';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userProfile: UserProfile;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, userProfile }) => {
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

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-logo">
        <div className="sidebar-orb">
          <Zap size={18} />
        </div>
        <div className="sidebar-title">
          <h1>PRIMUS <span>HOME PRO</span></h1>
          <span className="sidebar-version">Sales OS v2.0</span>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Main Menu</div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`nav-link ${isActive ? 'nav-link-active' : ''}`}
            >
              <div className="nav-link-content">
                  <Icon size={18} className="nav-link-icon" />
                  <span className="nav-link-label">{item.label}</span>
              </div>
              {isActive && <div className="nav-link-indicator"></div>}
            </button>
          );
        })}

        <div className="sidebar-divider"></div>

        <div className="sidebar-section-label">System</div>
        
        <button
          onClick={() => setActiveTab('profile')}
          className={`nav-link ${activeTab === 'profile' ? 'nav-link-active' : ''}`}
        >
          <div className="nav-link-content">
            <Settings size={18} className="nav-link-icon" />
            <span className="nav-link-label">Settings</span>
          </div>
        </button>
      </nav>

      {/* User Footer */}
      <div className="sidebar-user-card">
        <button 
          onClick={() => setActiveTab('profile')}
          className="sidebar-user-card-inner"
        >
          <div className="sidebar-user-avatar">
             <div className={`sidebar-user-avatar-img ${selectedAvatar ? selectedAvatar.gradient : 'bg-slate-800 text-slate-300'}`}>
               {getInitials(userProfile.name)}
             </div>
             <div className="sidebar-user-status"></div>
          </div>
          <div className="sidebar-user-info">
             <p className="sidebar-user-name">{userProfile.name}</p>
             <p className="sidebar-user-market">{userProfile.market}</p>
          </div>
          <ChevronRight size={14} className="sidebar-user-chevron" />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
