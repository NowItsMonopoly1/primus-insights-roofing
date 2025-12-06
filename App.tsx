import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header'; // New import
import Dashboard from './components/Dashboard';
import SolarIntelligence from './components/BlindspotDetector';
import LeadBoard from './components/JobBoard';
import { ProjectTracker } from './components/ProjectTracker';
import { CommissionLog } from './components/CommissionLog';
import { UserProfileView } from './components/UserProfile';
import { loadOrDefault } from './utils/storage';
import { UserProfile } from './types';

const USER_PROFILE_KEY = 'primus_user_profile';

const DEFAULT_PROFILE: UserProfile = {
  id: 'u-001',
  name: 'John Doe',
  role: 'REP',
  market: 'CA-North',
  avatarId: 'avatar-3'
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [userProfile, setUserProfile] = useState<UserProfile>(() => 
    loadOrDefault<UserProfile>(USER_PROFILE_KEY, DEFAULT_PROFILE)
  );

  const handleProfileUpdate = (updatedProfile: UserProfile) => {
    setUserProfile(updatedProfile);
  };

  const getPageTitle = () => {
    switch (activeTab) {
        case 'dashboard': return 'Command Center';
        case 'leads': return 'Lead Board';
        case 'solar-tools': return 'Solar Intelligence';
        case 'projects': return 'Project Tracker';
        case 'commissions': return 'Commission Log';
        case 'profile': return 'User Profile';
        default: return 'Overview';
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'leads': return <LeadBoard />;
      case 'solar-tools': return <SolarIntelligence />;
      case 'projects': return <ProjectTracker />;
      case 'commissions': return <CommissionLog />;
      case 'profile': return <UserProfileView profile={userProfile} onUpdate={handleProfileUpdate} />;
      default: return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-solar-orange selection:text-white overflow-hidden">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Left Sidebar - Responsive */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => { setActiveTab(tab); setSidebarOpen(false); }} 
        userProfile={userProfile}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      
      {/* Main Content Area - Scrollable */}
      <div className="flex-1 md:ml-64 flex flex-col h-screen relative">
        
        {/* Top Header - Sticky */}
        <Header title={getPageTitle()} userProfile={userProfile} setSidebarOpen={setSidebarOpen} />

        {/* Ambient Background - Toned down for professional look */}
        <div className="fixed inset-0 pointer-events-none z-0">
             <div className="absolute top-[-20%] left-[20%] w-[500px] h-[500px] bg-blue-900/20 blur-[120px] rounded-full mix-blend-screen opacity-50"></div>
             <div className="absolute bottom-[-10%] right-[10%] w-[400px] h-[400px] bg-emerald-900/10 blur-[100px] rounded-full mix-blend-screen opacity-40"></div>
        </div>

        {/* Scrollable Content Container */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 relative z-10 scroll-smooth">
          <div className="max-w-7xl mx-auto pb-10">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;