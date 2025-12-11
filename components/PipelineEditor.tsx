// components/PipelineEditor.tsx
// Pipeline Stage Editor - Customize project stages per company

import React, { useState, useEffect } from 'react';
import {
  GripVertical,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Check,
  Edit2,
  X,
  ArrowUp,
  ArrowDown,
  Palette,
} from 'lucide-react';
import {
  loadPipeline,
  savePipeline,
  resetPipelineToDefaults,
  PipelineStage,
  DEFAULT_PIPELINE_STAGES,
} from '../services/pipelineConfig';
import { getActiveCompanyId } from '../services/companyStore';

const STAGE_COLORS = [
  { id: 'blue', label: 'Blue', class: 'bg-blue-500' },
  { id: 'purple', label: 'Purple', class: 'bg-purple-500' },
  { id: 'amber', label: 'Amber', class: 'bg-amber-500' },
  { id: 'orange', label: 'Orange', class: 'bg-orange-500' },
  { id: 'cyan', label: 'Cyan', class: 'bg-cyan-500' },
  { id: 'emerald', label: 'Emerald', class: 'bg-emerald-500' },
  { id: 'red', label: 'Red', class: 'bg-red-500' },
  { id: 'pink', label: 'Pink', class: 'bg-pink-500' },
];

export default function PipelineEditor() {
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [newStageName, setNewStageName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState<string | null>(null);

  const companyId = getActiveCompanyId();

  useEffect(() => {
    const loaded = loadPipeline(companyId);
    setStages(loaded);
  }, [companyId]);

  const handleSave = () => {
    savePipeline(companyId, stages);
    setIsSaved(true);
    setHasChanges(false);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleResetDefaults = () => {
    if (confirm('Reset pipeline to default stages? This will remove any custom stages.')) {
      resetPipelineToDefaults(companyId);
      setStages([...DEFAULT_PIPELINE_STAGES]);
      setHasChanges(true);
    }
  };

  const handleAddStage = () => {
    if (!newStageName.trim()) return;
    
    const newId = newStageName.toUpperCase().replace(/\s+/g, '_');
    const newStage: PipelineStage = {
      id: newId,
      name: newStageName.trim(),
      order: stages.length,
      color: 'blue',
    };
    
    setStages([...stages, newStage]);
    setNewStageName('');
    setShowAddForm(false);
    setHasChanges(true);
  };

  const handleRemoveStage = (stageId: string) => {
    if (stages.length <= 2) {
      alert('Pipeline must have at least 2 stages');
      return;
    }
    if (confirm('Remove this stage? Projects in this stage may need to be updated.')) {
      const updated = stages.filter(s => s.id !== stageId);
      updated.forEach((s, i) => { s.order = i; });
      setStages(updated);
      setHasChanges(true);
    }
  };

  const handleStartEdit = (stage: PipelineStage) => {
    setEditingId(stage.id);
    setEditName(stage.name);
  };

  const handleSaveEdit = () => {
    if (!editName.trim() || !editingId) return;
    
    setStages(stages.map(s => 
      s.id === editingId ? { ...s, name: editName.trim() } : s
    ));
    setEditingId(null);
    setEditName('');
    setHasChanges(true);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newStages = [...stages];
    [newStages[index - 1], newStages[index]] = [newStages[index], newStages[index - 1]];
    newStages.forEach((s, i) => { s.order = i; });
    setStages(newStages);
    setHasChanges(true);
  };

  const handleMoveDown = (index: number) => {
    if (index === stages.length - 1) return;
    const newStages = [...stages];
    [newStages[index], newStages[index + 1]] = [newStages[index + 1], newStages[index]];
    newStages.forEach((s, i) => { s.order = i; });
    setStages(newStages);
    setHasChanges(true);
  };

  const handleColorChange = (stageId: string, color: string) => {
    setStages(stages.map(s => 
      s.id === stageId ? { ...s, color } : s
    ));
    setColorPickerOpen(null);
    setHasChanges(true);
  };

  const getColorClass = (color?: string) => {
    const colorObj = STAGE_COLORS.find(c => c.id === color);
    return colorObj?.class || 'bg-blue-500';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-white">Pipeline Stages</h3>
          <p className="text-sm text-slate-400 mt-1">
            Customize the project pipeline stages for your workflow
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

      {/* Stages List */}
      <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700/50 bg-slate-800/50">
          <div className="grid grid-cols-12 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <div className="col-span-1">Order</div>
            <div className="col-span-1">Color</div>
            <div className="col-span-6">Stage Name</div>
            <div className="col-span-2">Stage ID</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
        </div>
        
        <div className="divide-y divide-slate-700/50">
          {stages.sort((a, b) => a.order - b.order).map((stage, index) => (
            <div
              key={stage.id}
              className="px-4 py-3 hover:bg-slate-800/30 transition-colors"
            >
              <div className="grid grid-cols-12 items-center gap-2">
                {/* Order & Move Buttons */}
                <div className="col-span-1 flex items-center gap-1">
                  <div className="flex flex-col">
                    <button
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="p-0.5 text-slate-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move up"
                      aria-label="Move up"
                    >
                      <ArrowUp size={12} />
                    </button>
                    <button
                      onClick={() => handleMoveDown(index)}
                      disabled={index === stages.length - 1}
                      className="p-0.5 text-slate-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move down"
                      aria-label="Move down"
                    >
                      <ArrowDown size={12} />
                    </button>
                  </div>
                  <span className="text-slate-500 text-sm font-mono">{index + 1}</span>
                </div>

                {/* Color Picker */}
                <div className="col-span-1 relative">
                  <button
                    onClick={() => setColorPickerOpen(colorPickerOpen === stage.id ? null : stage.id)}
                    className={`w-6 h-6 rounded ${getColorClass(stage.color)} hover:ring-2 hover:ring-white/30 transition-all`}
                    title="Change color"
                    aria-label="Change color"
                  />
                  {colorPickerOpen === stage.id && (
                    <div className="absolute top-8 left-0 z-10 bg-slate-900 border border-slate-700 rounded-lg p-2 shadow-xl grid grid-cols-4 gap-1">
                      {STAGE_COLORS.map(color => (
                        <button
                          key={color.id}
                          onClick={() => handleColorChange(stage.id, color.id)}
                          className={`w-6 h-6 rounded ${color.class} hover:ring-2 hover:ring-white/50 transition-all ${
                            stage.color === color.id ? 'ring-2 ring-white' : ''
                          }`}
                          title={color.label}
                          aria-label={color.label}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Stage Name */}
                <div className="col-span-6">
                  {editingId === stage.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-solar-orange"
                        autoFocus
                        aria-label="Stage name"
                      />
                      <button
                        onClick={handleSaveEdit}
                        className="p-1 text-emerald-400 hover:text-emerald-300"
                        title="Save"
                        aria-label="Save"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="p-1 text-slate-400 hover:text-white"
                        title="Cancel"
                        aria-label="Cancel"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <span className="text-white font-medium">{stage.name}</span>
                  )}
                </div>

                {/* Stage ID */}
                <div className="col-span-2">
                  <span className="text-slate-500 text-xs font-mono bg-slate-800 px-2 py-1 rounded">
                    {stage.id}
                  </span>
                </div>

                {/* Actions */}
                <div className="col-span-2 flex justify-end gap-1">
                  <button
                    onClick={() => handleStartEdit(stage)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                    title="Edit name"
                    aria-label="Edit name"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleRemoveStage(stage.id)}
                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded transition-colors"
                    title="Remove stage"
                    aria-label="Remove stage"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add New Stage */}
      {showAddForm ? (
        <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-4">
          <h4 className="text-sm font-bold text-white mb-3">Add New Stage</h4>
          <div className="flex gap-3">
            <input
              type="text"
              value={newStageName}
              onChange={(e) => setNewStageName(e.target.value)}
              placeholder="Stage name (e.g., 'Final Review')"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-solar-orange"
              aria-label="New stage name"
              autoFocus
            />
            <button
              onClick={handleAddStage}
              disabled={!newStageName.trim()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Stage
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewStageName('');
              }}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-700 hover:border-slate-600 rounded-xl text-slate-400 hover:text-white transition-all"
        >
          <Plus size={18} />
          Add New Stage
        </button>
      )}

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <p className="text-sm text-blue-300">
          <strong>Note:</strong> Changes to pipeline stages may affect existing projects. 
          Projects in removed stages will need to be manually updated to a new stage.
        </p>
      </div>
    </div>
  );
}
