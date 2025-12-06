
import React from 'react';
import { Search, Bell, Wifi, HelpCircle, Menu } from 'lucide-react';
import { UserProfile } from '../types';

interface HeaderProps {
  title: string;
  userProfile: UserProfile;
  setSidebarOpen?: (open: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ title, userProfile, setSidebarOpen }) => {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/50 backdrop-blur-md sticky top-0 z-10 px-4 md:px-8 flex items-center justify-between">
      {/* Left: Hamburger + Breadcrumb */}
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger */}
        {setSidebarOpen && (
          <button 
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Menu size={20} />
          </button>
        )}
        <h2 className="text-slate-200 font-display font-medium text-sm tracking-wide">
          <span className="hidden md:inline">PRIMUS HOME PRO</span>
          <span className="md:hidden">PHP</span>
          <span className="text-slate-600 mx-2">/</span> 
          <span className="text-white font-bold">{title}</span>
        </h2>
      </div>

      {/* Center: Global Search (Optional) */}
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
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500/5 border border-emerald-500/20 rounded-full">
            <Wifi size={12} className="text-emerald-500" />
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider pr-1">Online</span>
        </div>

        <div className="h-6 w-px bg-slate-800 mx-1"></div>

        <button className="text-slate-400 hover:text-white transition-colors relative">
          <Bell size={18} />
          <span className="absolute top-0 right-0 block h-2 w-2 rounded-full ring-2 ring-slate-950 bg-solar-orange transform translate-x-1/2 -translate-y-1/2"></span>
        </button>
        
        <button className="text-slate-400 hover:text-white transition-colors">
          <HelpCircle size={18} />
        </button>
      </div>
    </header>
  );
};

export default Header;
