import React from 'react';
import { Search, Wifi, HelpCircle, Menu } from 'lucide-react';
import { UserProfile, PlanId } from '../types';
import NotificationCenter from './NotificationCenter';
import ModeToggle from './ModeToggle';

interface HeaderProps {
  title: string;
  userProfile: UserProfile;
  onRequestUpgrade: (plan: PlanId) => void;
  setSidebarOpen: (open: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ title, userProfile, onRequestUpgrade, setSidebarOpen }) => {
  return (
    <header className="h-14 md:h-16 border-b border-slate-800 bg-slate-950/50 backdrop-blur-md sticky top-0 z-10 px-4 md:px-8 flex items-center justify-between">
      {/* Left: Hamburger + Breadcrumb */}
      <div className="flex items-center gap-3">
        {/* Hamburger Menu - Mobile Only */}
        <button 
          onClick={() => setSidebarOpen(true)}
          title="Open menu"
          aria-label="Open menu"
          className="md:hidden text-slate-400 hover:text-white p-1"
        >
          <Menu size={22} />
        </button>
        
        <h2 className="text-slate-200 font-display font-medium text-xs md:text-sm tracking-wide">
          <span className="hidden md:inline">PRIMUS HOME PRO</span>
          <span className="md:hidden">PHP</span>
          <span className="text-slate-600 mx-2">/</span> 
          <span className="text-white font-bold">{title}</span>
        </h2>
      </div>

      {/* Center: Global Search (Desktop Only) */}
      <div className="hidden md:flex flex-1 max-w-md mx-8 relative group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={14} className="text-slate-500 group-focus-within:text-solar-orange transition-colors" />
        </div>
        <input
          type="text"
          placeholder="Global Search (Command + K)"
          className="block w-full pl-10 pr-3 py-1.5 border border-slate-800 rounded-lg leading-5 bg-slate-900/50 text-slate-300 placeholder-slate-500 focus:outline-none focus:bg-slate-900 focus:border-solar-orange/50 focus:ring-1 focus:ring-solar-orange/50 sm:text-xs transition-all"
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
           <span className="text-[10px] text-slate-600 border border-slate-700 rounded px-1.5 py-0.5">⌘K</span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 md:gap-4">
        <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-emerald-500/5 border border-emerald-500/20 rounded-full">
            <Wifi size={10} className="text-emerald-500" />
            <span className="text-[9px] md:text-[10px] font-bold text-emerald-500 uppercase tracking-wider pr-1">Online</span>
        </div>

        <div className="hidden md:block h-6 w-px bg-slate-800 mx-1"></div>

        {/* Mode Toggle (Builder/Business) */}
        <ModeToggle userRole={userProfile.role} />

        {/* Notification Center */}
        <NotificationCenter />

        <button className="hidden md:block text-slate-400 hover:text-white transition-colors p-1" title="Help" aria-label="Help">
          <HelpCircle size={18} />
        </button>
      </div>
    </header>
  );
};

export default Header;