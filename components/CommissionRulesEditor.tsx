// components/CommissionRulesEditor.tsx
// Commission Structure Builder UI - Configure commission tiers and bonuses

import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Plus,
  Trash2,
  Edit2,
  Save,
  RotateCcw,
  Check,
  Percent,
  Target,
  Gift,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Info,
  ChevronDown,
} from 'lucide-react';
import {
  loadCommissionRules,
  saveCommissionRules,
  resetCommissionRulesToDefaults,
  CommissionRules,
  CommissionTier,
  CommissionBonus,
  DealType,
  DEAL_TYPE_OPTIONS,
  CONDITION_FIELD_OPTIONS,
  OPERATOR_OPTIONS,
  BonusCondition,
} from '../services/commissionRules';
import { getActiveCompanyId } from '../services/companyStore';

type TabType = 'tiers' | 'bonuses';

export default function CommissionRulesEditor() {
  const [rules, setRules] = useState<CommissionRules | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('tiers');
  const [isSaved, setIsSaved] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<CommissionTier | null>(null);
  const [editingBonus, setEditingBonus] = useState<CommissionBonus | null>(null);

  const companyId = getActiveCompanyId();

  useEffect(() => {
    const loaded = loadCommissionRules(companyId);
    setRules(loaded);
  }, [companyId]);

  const handleSave = () => {
    if (rules) {
      saveCommissionRules(companyId, rules);
      setIsSaved(true);
      setHasChanges(false);
      setTimeout(() => setIsSaved(false), 2000);
    }
  };

  const handleResetDefaults = () => {
    if (confirm('Reset all commission rules to defaults?')) {
      resetCommissionRulesToDefaults(companyId);
      setRules(loadCommissionRules(companyId));
      setHasChanges(true);
    }
  };

  // Tier CRUD
  const handleAddTier = () => {
    setEditingTier(null);
    setIsModalOpen(true);
  };

  const handleEditTier = (tier: CommissionTier) => {
    setEditingTier(tier);
    setEditingBonus(null);
    setIsModalOpen(true);
  };

  const handleDeleteTier = (tierId: string) => {
    if (!rules) return;
    if (confirm('Delete this commission tier?')) {
      setRules({
        ...rules,
        tiers: rules.tiers.filter(t => t.id !== tierId),
      });
      setHasChanges(true);
    }
  };

  const handleSaveTier = (tier: CommissionTier) => {
    if (!rules) return;
    
    if (editingTier) {
      // Update existing
      setRules({
        ...rules,
        tiers: rules.tiers.map(t => t.id === tier.id ? tier : t),
      });
    } else {
      // Add new
      const newTier: CommissionTier = {
        ...tier,
        id: 'tier_' + Date.now().toString(36),
      };
      setRules({
        ...rules,
        tiers: [...rules.tiers, newTier],
      });
    }
    setHasChanges(true);
    setIsModalOpen(false);
  };

  // Bonus CRUD
  const handleAddBonus = () => {
    setEditingBonus(null);
    setEditingTier(null);
    setIsModalOpen(true);
  };

  const handleEditBonus = (bonus: CommissionBonus) => {
    setEditingBonus(bonus);
    setEditingTier(null);
    setIsModalOpen(true);
  };

  const handleDeleteBonus = (bonusId: string) => {
    if (!rules) return;
    if (confirm('Delete this bonus rule?')) {
      setRules({
        ...rules,
        bonuses: rules.bonuses.filter(b => b.id !== bonusId),
      });
      setHasChanges(true);
    }
  };

  const handleToggleBonus = (bonusId: string) => {
    if (!rules) return;
    setRules({
      ...rules,
      bonuses: rules.bonuses.map(b =>
        b.id === bonusId ? { ...b, isActive: !b.isActive } : b
      ),
    });
    setHasChanges(true);
  };

  const handleSaveBonus = (bonus: CommissionBonus) => {
    if (!rules) return;
    
    if (editingBonus) {
      // Update existing
      setRules({
        ...rules,
        bonuses: rules.bonuses.map(b => b.id === bonus.id ? bonus : b),
      });
    } else {
      // Add new
      const newBonus: CommissionBonus = {
        ...bonus,
        id: 'bonus_' + Date.now().toString(36),
      };
      setRules({
        ...rules,
        bonuses: [...rules.bonuses, newBonus],
      });
    }
    setHasChanges(true);
    setIsModalOpen(false);
  };

  if (!rules) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-solar-orange"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-white">Commission Rules</h3>
          <p className="text-sm text-slate-400 mt-1">
            Configure commission tiers and bonus structures for your team
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-all"
          >
            <RotateCcw size={14} />
            Reset Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              hasChanges
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            {isSaved ? <Check size={16} /> : <Save size={16} />}
            {isSaved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('tiers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-bold transition-all ${
            activeTab === 'tiers'
              ? 'bg-slate-800 text-white border-b-2 border-solar-orange'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Percent size={16} />
          Commission Tiers ({rules.tiers.length})
        </button>
        <button
          onClick={() => setActiveTab('bonuses')}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-bold transition-all ${
            activeTab === 'bonuses'
              ? 'bg-slate-800 text-white border-b-2 border-solar-orange'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Gift size={16} />
          Bonuses ({rules.bonuses.length})
        </button>
      </div>

      {/* TIERS TAB */}
      {activeTab === 'tiers' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={handleAddTier}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold transition-all"
            >
              <Plus size={14} />
              Add Tier
            </button>
          </div>

          <div className="grid gap-4">
            {rules.tiers.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <AlertCircle size={24} className="mx-auto mb-2 opacity-50" />
                <p>No commission tiers configured</p>
              </div>
            ) : (
              rules.tiers.map((tier) => (
                <div
                  key={tier.id}
                  className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-4 hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                        <Percent size={24} className="text-emerald-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-white font-bold">{tier.label}</h4>
                          {tier.isDefault && (
                            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-2xl font-mono font-bold text-emerald-400 mt-1">
                          {(tier.rate * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditTier(tier)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
                        title="Edit tier"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteTier(tier.id)}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                        title="Delete tier"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {tier.appliesTo.map((dt) => (
                      <span
                        key={dt}
                        className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded"
                      >
                        {DEAL_TYPE_OPTIONS.find(o => o.value === dt)?.label || dt}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* BONUSES TAB */}
      {activeTab === 'bonuses' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={handleAddBonus}
              className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-bold transition-all"
            >
              <Plus size={14} />
              Add Bonus
            </button>
          </div>

          <div className="grid gap-4">
            {rules.bonuses.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <AlertCircle size={24} className="mx-auto mb-2 opacity-50" />
                <p>No bonus rules configured</p>
              </div>
            ) : (
              rules.bonuses.map((bonus) => (
                <div
                  key={bonus.id}
                  className={`bg-slate-800/30 rounded-xl border border-slate-700/50 p-4 transition-all ${
                    bonus.isActive ? 'hover:bg-slate-800/50' : 'opacity-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        bonus.isActive ? 'bg-purple-500/20' : 'bg-slate-700'
                      }`}>
                        <Gift size={24} className={bonus.isActive ? 'text-purple-400' : 'text-slate-500'} />
                      </div>
                      <div>
                        <h4 className="text-white font-bold">{bonus.label}</h4>
                        <p className="text-sm text-slate-400 mt-1">
                          When <span className="text-slate-300">{CONDITION_FIELD_OPTIONS.find(f => f.value === bonus.condition.field)?.label}</span>
                          {' '}
                          <span className="text-slate-300">{OPERATOR_OPTIONS.find(o => o.value === bonus.condition.operator)?.label}</span>
                          {' '}
                          <span className="text-white font-mono">{bonus.condition.value}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-mono font-bold text-purple-400">
                        {bonus.isPercentage ? `${bonus.amount}%` : `$${bonus.amount}`}
                      </span>
                      <button
                        onClick={() => handleToggleBonus(bonus.id)}
                        className={`p-2 rounded-lg transition-all ${
                          bonus.isActive
                            ? 'text-emerald-400 hover:bg-emerald-500/10'
                            : 'text-slate-500 hover:bg-slate-700'
                        }`}
                        title={bonus.isActive ? 'Disable bonus' : 'Enable bonus'}
                      >
                        {bonus.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                      </button>
                      <button
                        onClick={() => handleEditBonus(bonus)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
                        title="Edit bonus"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteBonus(bonus.id)}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                        title="Delete bonus"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex items-start gap-3">
        <Info size={18} className="text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-300">
          <p className="font-medium mb-1">Commission Calculation</p>
          <p className="text-blue-300/80">
            Base commission is calculated as: <span className="font-mono">Deal Value × Tier Rate</span>.
            Bonuses are added on top when conditions are met.
          </p>
        </div>
      </div>

      {/* Modal for Tier/Bonus Edit */}
      {isModalOpen && (
        <TierBonusModal
          tier={activeTab === 'tiers' ? editingTier : null}
          bonus={activeTab === 'bonuses' ? editingBonus : null}
          mode={activeTab}
          onSaveTier={handleSaveTier}
          onSaveBonus={handleSaveBonus}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}

// ============================================================================
// MODAL COMPONENT
// ============================================================================

interface TierBonusModalProps {
  tier: CommissionTier | null;
  bonus: CommissionBonus | null;
  mode: 'tiers' | 'bonuses';
  onSaveTier: (tier: CommissionTier) => void;
  onSaveBonus: (bonus: CommissionBonus) => void;
  onClose: () => void;
}

function TierBonusModal({ tier, bonus, mode, onSaveTier, onSaveBonus, onClose }: TierBonusModalProps) {
  // Tier form state
  const [tierLabel, setTierLabel] = useState(tier?.label || '');
  const [tierRate, setTierRate] = useState((tier?.rate || 0.05) * 100);
  const [tierAppliesTo, setTierAppliesTo] = useState<DealType[]>(tier?.appliesTo || ['install']);
  const [tierIsDefault, setTierIsDefault] = useState(tier?.isDefault || false);

  // Bonus form state
  const [bonusLabel, setBonusLabel] = useState(bonus?.label || '');
  const [bonusAmount, setBonusAmount] = useState(bonus?.amount || 100);
  const [bonusIsPercentage, setBonusIsPercentage] = useState(bonus?.isPercentage || false);
  const [bonusField, setBonusField] = useState(bonus?.condition.field || 'estimatedBill');
  const [bonusOperator, setBonusOperator] = useState<BonusCondition['operator']>(bonus?.condition.operator || 'gte');
  const [bonusValue, setBonusValue] = useState(bonus?.condition.value || 200);
  const [bonusIsActive, setBonusIsActive] = useState(bonus?.isActive ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'tiers') {
      onSaveTier({
        id: tier?.id || '',
        label: tierLabel,
        rate: tierRate / 100,
        appliesTo: tierAppliesTo,
        isDefault: tierIsDefault,
      });
    } else {
      onSaveBonus({
        id: bonus?.id || '',
        label: bonusLabel,
        amount: bonusAmount,
        isPercentage: bonusIsPercentage,
        condition: {
          field: bonusField,
          operator: bonusOperator,
          value: bonusValue,
        },
        isActive: bonusIsActive,
      });
    }
  };

  const toggleDealType = (dt: DealType) => {
    if (tierAppliesTo.includes(dt)) {
      setTierAppliesTo(tierAppliesTo.filter(t => t !== dt));
    } else {
      setTierAppliesTo([...tierAppliesTo, dt]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl border border-slate-700 w-full max-w-lg">
        <div className="p-6 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white">
            {mode === 'tiers'
              ? tier ? 'Edit Commission Tier' : 'Add Commission Tier'
              : bonus ? 'Edit Bonus Rule' : 'Add Bonus Rule'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {mode === 'tiers' ? (
            <>
              {/* Tier Name */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Tier Name *
                </label>
                <input
                  type="text"
                  value={tierLabel}
                  onChange={(e) => setTierLabel(e.target.value)}
                  placeholder="e.g., Standard Install"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Commission Rate */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Commission Rate (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={tierRate}
                    onChange={(e) => setTierRate(parseFloat(e.target.value) || 0)}
                    min="0"
                    max="100"
                    step="0.1"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                  <Percent size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                </div>
              </div>

              {/* Applies To */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Applies To Deal Types
                </label>
                <div className="flex flex-wrap gap-2">
                  {DEAL_TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleDealType(opt.value)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        tierAppliesTo.includes(opt.value)
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Is Default */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Default Tier</p>
                  <p className="text-slate-500 text-xs">Use when no specific tier matches</p>
                </div>
                <button
                  type="button"
                  onClick={() => setTierIsDefault(!tierIsDefault)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    tierIsDefault ? 'bg-emerald-600' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                      tierIsDefault ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Bonus Name */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Bonus Name *
                </label>
                <input
                  type="text"
                  value={bonusLabel}
                  onChange={(e) => setBonusLabel(e.target.value)}
                  placeholder="e.g., High Bill Bonus"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Bonus Amount */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                      {bonusIsPercentage ? '%' : '$'}
                    </span>
                    <input
                      type="number"
                      value={bonusAmount}
                      onChange={(e) => setBonusAmount(parseFloat(e.target.value) || 0)}
                      min="0"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Type
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setBonusIsPercentage(false)}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        !bonusIsPercentage
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <DollarSign size={14} className="inline mr-1" />
                      Flat
                    </button>
                    <button
                      type="button"
                      onClick={() => setBonusIsPercentage(true)}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        bonusIsPercentage
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Percent size={14} className="inline mr-1" />
                      %
                    </button>
                  </div>
                </div>
              </div>

              {/* Condition */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Condition
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={bonusField}
                    onChange={(e) => setBonusField(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    aria-label="Condition field"
                  >
                    {CONDITION_FIELD_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={bonusOperator}
                    onChange={(e) => setBonusOperator(e.target.value as BonusCondition['operator'])}
                    className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    aria-label="Condition operator"
                  >
                    {OPERATOR_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={bonusValue}
                    onChange={(e) => setBonusValue(parseFloat(e.target.value) || 0)}
                    className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                    aria-label="Condition value"
                  />
                </div>
              </div>

              {/* Is Active */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Active</p>
                  <p className="text-slate-500 text-xs">Enable this bonus rule</p>
                </div>
                <button
                  type="button"
                  onClick={() => setBonusIsActive(!bonusIsActive)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    bonusIsActive ? 'bg-emerald-600' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                      bonusIsActive ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-all"
            >
              <Save size={16} />
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
