import React, { useState, useEffect } from 'react';
import { User, MapPin, Briefcase, Save, CheckCircle2, Shield, Camera } from 'lucide-react';
import { UserProfile } from '../types';
import { save } from '../utils/storage';
import { AVATAR_OPTIONS } from '../constants';

interface UserProfileProps {
  profile: UserProfile;
  onUpdate: (profile: UserProfile) => void;
}

const USER_PROFILE_KEY = 'primus_user_profile';

export const UserProfileView: React.FC<UserProfileProps> = ({ profile, onUpdate }) => {
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [isSaved, setIsSaved] = useState(false);

  // Sync with parent state if it changes externally
  useEffect(() => {
    setFormData(profile);
  }, [profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    save(USER_PROFILE_KEY, formData);
    onUpdate(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const selectedAvatar = AVATAR_OPTIONS.find(a => a.id === formData.avatarId);

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-display font-bold text-slate-100 flex items-center gap-3">
             <User className="text-solar-orange" />
             My Profile
          </h2>
          <p className="text-slate-400 mt-1">Manage your account settings and preferences.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Avatar & Summary */}
        <div className="glass-panel p-6 border border-slate-800 flex flex-col items-center text-center">
            <div className="relative group cursor-pointer mb-4">
                <div className={`w-32 h-32 rounded-full border-4 border-slate-700 flex items-center justify-center text-3xl font-bold text-slate-400 overflow-hidden group-hover:border-solar-orange transition-colors shadow-2xl ${selectedAvatar ? selectedAvatar.gradient : 'bg-slate-800'}`}>
                    {selectedAvatar ? (
                      <span className="text-white drop-shadow-md">{getInitials(formData.name)}</span>
                    ) : (
                      getInitials(formData.name)
                    )}
                </div>
            </div>
            
            <h3 className="text-xl font-bold text-white mb-1">{formData.name}</h3>
            <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 mb-6">
                <Shield size={12} />
                <span className="font-bold">{formData.role}</span>
            </div>

            <div className="w-full space-y-3">
                <div className="flex justify-between text-sm py-2 border-b border-slate-800">
                    <span className="text-slate-500">Market</span>
                    <span className="text-slate-300 font-medium">{formData.market}</span>
                </div>
                <div className="flex justify-between text-sm py-2 border-b border-slate-800">
                    <span className="text-slate-500">User ID</span>
                    <span className="text-slate-500 font-mono text-xs">{formData.id}</span>
                </div>
            </div>
        </div>

        {/* Right Column: Edit Form */}
        <div className="md:col-span-2 glass-panel p-8 border border-slate-800">
            <h3 className="text-lg font-bold text-slate-200 mb-6 border-b border-slate-800 pb-4">Edit Details</h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Avatar Selection */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Avatar</label>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {AVATAR_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setFormData({...formData, avatarId: opt.id})}
                        className={`w-12 h-12 rounded-full ${opt.gradient} border-2 transition-transform hover:scale-110 ${formData.avatarId === opt.id ? 'border-white scale-110 ring-2 ring-white/20' : 'border-transparent opacity-60 hover:opacity-100'}`}
                        title={opt.label}
                      />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                        <div className="relative">
                            <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input 
                                type="text" 
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-slate-200 focus:outline-none focus:border-solar-orange focus:ring-1 focus:ring-solar-orange transition-all"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Role</label>
                            <div className="relative">
                                <Briefcase size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                <select 
                                    value={formData.role}
                                    onChange={(e) => setFormData({...formData, role: e.target.value as any})}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-slate-200 focus:outline-none focus:border-solar-orange focus:ring-1 focus:ring-solar-orange transition-all appearance-none cursor-pointer"
                                >
                                    <option value="REP">Sales Rep</option>
                                    <option value="CLOSER">Senior Closer</option>
                                    <option value="OWNER">Owner / Admin</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Market Region</label>
                            <div className="relative">
                                <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input 
                                    type="text" 
                                    value={formData.market}
                                    onChange={(e) => setFormData({...formData, market: e.target.value})}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-slate-200 focus:outline-none focus:border-solar-orange focus:ring-1 focus:ring-solar-orange transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-6 flex items-center justify-end gap-4">
                    {isSaved && (
                        <span className="text-emerald-400 text-sm font-bold flex items-center gap-2 animate-fade-in">
                            <CheckCircle2 size={16} /> Changes Saved
                        </span>
                    )}
                    <button 
                        type="submit"
                        className="bg-solar-orange hover:bg-orange-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-bold transition-all shadow-lg shadow-orange-500/20 active:scale-95"
                    >
                        <Save size={18} /> Save Profile
                    </button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};