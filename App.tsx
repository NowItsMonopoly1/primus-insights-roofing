
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import SolarIntelligence from './components/BlindspotDetector';
import LeadBoard from './components/JobBoard';
import { ProjectTracker } from './components/ProjectTracker';
import { CommissionLog } from './components/CommissionLog';
import { UserProfileView } from './components/UserProfile';
import { PricingPage } from './components/PricingPage';
import { UpgradeModal } from './components/UpgradeModal';
import { loadOrDefault } from './utils/storage';
import { UserProfile, PlanId } from './types';

const USER_PROFILE_KEY = 'primus_user_profile';

const DEFAULT_PROFILE: UserProfile = {
  id: 'u-001',
  name: 'John Doe',
  role: 'REP',
  market: 'CA-North',
  avatarId: 'avatar-3',
  plan: 'FREE' // Default to FREE (SCOUT)
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [userProfile, setUserProfile] = useState<UserProfile>(() => 
    loadOrDefault<UserProfile>(USER_PROFILE_KEY, DEFAULT_PROFILE)
  );
  
  // Upgrade Modal State
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradePlan, setUpgradePlan] = useState<PlanId | null>(null);

  const handleProfileUpdate = (updatedProfile: UserProfile) => {
    setUserProfile(updatedProfile);
  };

  const requestUpgrade = (required: PlanId) => {
    setUpgradePlan(required);
    setUpgradeOpen(true);
  };

  const getPageTitle = () => {
    switch (activeTab) {
        case 'dashboard': return 'Command Center';
        case 'leads': return 'Lead Board';
        case 'solar-tools': return 'Solar Intelligence';
        case 'projects': return 'Project Tracker';
        case 'commissions': return 'Commission Log';
        case 'billing': return 'Subscription & Billing';
        case 'profile': return 'User Profile';
        default: return 'Overview';
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard onRequestUpgrade={requestUpgrade} />;
      case 'leads': return <LeadBoard userProfile={userProfile} onRequestUpgrade={requestUpgrade} />;
      case 'solar-tools': return <SolarIntelligence userProfile={userProfile} onRequestUpgrade={requestUpgrade} />;
      case 'projects': return <ProjectTracker onRequestUpgrade={requestUpgrade} />;
      case 'commissions': return <CommissionLog onRequestUpgrade={requestUpgrade} />;
      case 'billing': return <PricingPage userProfile={userProfile} onRequestUpgrade={requestUpgrade} />;
      case 'profile': return <UserProfileView profile={userProfile} onUpdate={handleProfileUpdate} />;
      default: return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-solar-orange selection:text-white overflow-hidden">
      {/* Global Upgrade Modal */}
      <UpgradeModal 
        isOpen={upgradeOpen} 
        onClose={() => setUpgradeOpen(false)} 
        requiredPlan={upgradePlan} 
      />

      {/* Left Sidebar - Fixed */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        userProfile={userProfile} 
        onRequestUpgrade={requestUpgrade}
      />
      
      {/* Main Content Area - Scrollable */}
      <div className="flex-1 ml-64 flex flex-col h-screen relative">
        
        {/* Top Header - Sticky */}
        <Header 
          title={getPageTitle()} 
          userProfile={userProfile} 
          onRequestUpgrade={requestUpgrade}
        />

        {/* Ambient Background - Toned down for professional look */}
        <div className="fixed inset-0 pointer-events-none z-0">
             <div className="absolute top-[-20%] left-[20%] w-[500px] h-[500px] bg-blue-900/20 blur-[120px] rounded-full mix-blend-screen opacity-50"></div>
             <div className="absolute bottom-[-10%] right-[10%] w-[400px] h-[400px] bg-emerald-900/10 blur-[100px] rounded-full mix-blend-screen opacity-40"></div>
        </div>

        {/* Scrollable Content Container */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-8 relative z-10 scroll-smooth">
          <div className="max-w-7xl mx-auto pb-10">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
