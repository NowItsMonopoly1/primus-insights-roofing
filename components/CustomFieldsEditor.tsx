// components/CustomFieldsEditor.tsx
// Custom Fields Editor - Create and manage custom data fields for leads/projects

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  Save,
  X,
  GripVertical,
  Type,
  Hash,
  Calendar,
  ChevronDown,
  CheckSquare,
  ToggleLeft,
  Mail,
  Phone,
  Link,
  DollarSign,
  AlignLeft,
  RotateCcw,
  Info,
  AlertCircle,
} from 'lucide-react';
import {
  loadCustomFields,
  saveCustomFields,
  addCustomField,
  updateCustomField,
  deleteCustomField,
  toggleFieldVisibility,
  resetCustomFieldsToDefaults,
  CustomField,
  CustomFieldType,
  CustomFieldScope,
  CustomFieldOption,
  FIELD_TYPE_OPTIONS,
  SCOPE_OPTIONS,
  generateFieldKey,
} from '../services/customFields';
import { getActiveCompanyId } from '../services/companyStore';

// Icon component mapping
const FIELD_ICONS: Record<CustomFieldType, React.ReactNode> = {
  text: <Type size={16} />,
  textarea: <AlignLeft size={16} />,
  number: <Hash size={16} />,
  currency: <DollarSign size={16} />,
  date: <Calendar size={16} />,
  select: <ChevronDown size={16} />,
  multiselect: <CheckSquare size={16} />,
  checkbox: <ToggleLeft size={16} />,
  email: <Mail size={16} />,
  phone: <Phone size={16} />,
  url: <Link size={16} />,
};

interface FieldFormData {
  name: string;
  type: CustomFieldType;
  scope: CustomFieldScope;
  required: boolean;
  placeholder: string;
  helpText: string;
  options: CustomFieldOption[];
}

const defaultFormData: FieldFormData = {
  name: '',
  type: 'text',
  scope: 'lead',
  required: false,
  placeholder: '',
  helpText: '',
  options: [],
};

export default function CustomFieldsEditor() {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [formData, setFormData] = useState<FieldFormData>(defaultFormData);
  const [newOption, setNewOption] = useState('');
  const [filterScope, setFilterScope] = useState<'all' | CustomFieldScope>('all');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const companyId = getActiveCompanyId();

  useEffect(() => {
    const config = loadCustomFields(companyId);
    setFields(config.fields);
  }, [companyId]);

  const filteredFields = filterScope === 'all'
    ? fields
    : fields.filter(f => f.scope === filterScope || f.scope === 'both');

  const handleAddField = () => {
    setEditingField(null);
    setFormData(defaultFormData);
    setErrors({});
    setIsModalOpen(true);
  };

  const handleEditField = (field: CustomField) => {
    setEditingField(field);
    setFormData({
      name: field.name,
      type: field.type,
      scope: field.scope,
      required: field.required,
      placeholder: field.placeholder || '',
      helpText: field.helpText || '',
      options: field.options || [],
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleDeleteField = (fieldId: string) => {
    const field = fields.find(f => f.id === fieldId);
    if (confirm(`Delete field "${field?.name}"? This will remove it from all records.`)) {
      deleteCustomField(companyId, fieldId);
      setFields(prev => prev.filter(f => f.id !== fieldId));
    }
  };

  const handleToggleVisibility = (fieldId: string) => {
    toggleFieldVisibility(companyId, fieldId);
    setFields(prev => prev.map(f =>
      f.id === fieldId ? { ...f, visible: !f.visible } : f
    ));
  };

  const handleResetDefaults = () => {
    if (confirm('Reset all custom fields to defaults? Your custom fields will be lost.')) {
      resetCustomFieldsToDefaults(companyId);
      const config = loadCustomFields(companyId);
      setFields(config.fields);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Field name is required';
    }

    if ((formData.type === 'select' || formData.type === 'multiselect') && formData.options.length === 0) {
      newErrors.options = 'At least one option is required for dropdown fields';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveField = () => {
    if (!validateForm()) return;

    if (editingField) {
      // Update existing field
      updateCustomField(companyId, editingField.id, {
        name: formData.name,
        key: generateFieldKey(formData.name),
        type: formData.type,
        scope: formData.scope,
        required: formData.required,
        placeholder: formData.placeholder || undefined,
        helpText: formData.helpText || undefined,
        options: formData.options.length > 0 ? formData.options : undefined,
      });
    } else {
      // Add new field
      addCustomField(companyId, {
        name: formData.name,
        key: generateFieldKey(formData.name),
        type: formData.type,
        scope: formData.scope,
        required: formData.required,
        visible: true,
        placeholder: formData.placeholder || undefined,
        helpText: formData.helpText || undefined,
        options: formData.options.length > 0 ? formData.options : undefined,
      });
    }

    // Refresh fields list
    const config = loadCustomFields(companyId);
    setFields(config.fields);
    setIsModalOpen(false);
  };

  const handleAddOption = () => {
    if (!newOption.trim()) return;
    
    const optionValue = newOption.toLowerCase().replace(/\s+/g, '_');
    if (formData.options.some(o => o.value === optionValue)) {
      setErrors(prev => ({ ...prev, options: 'Option already exists' }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      options: [...prev.options, { value: optionValue, label: newOption.trim() }],
    }));
    setNewOption('');
    setErrors(prev => ({ ...prev, options: '' }));
  };

  const handleRemoveOption = (value: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter(o => o.value !== value),
    }));
  };

  const getScopeLabel = (scope: CustomFieldScope): string => {
    switch (scope) {
      case 'lead': return 'Leads';
      case 'project': return 'Projects';
      case 'both': return 'Both';
    }
  };

  const getScopeBadgeColor = (scope: CustomFieldScope): string => {
    switch (scope) {
      case 'lead': return 'bg-blue-500/20 text-blue-400';
      case 'project': return 'bg-purple-500/20 text-purple-400';
      case 'both': return 'bg-emerald-500/20 text-emerald-400';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-white">Custom Fields</h3>
          <p className="text-sm text-slate-400 mt-1">
            Add custom data fields to capture additional information on leads and projects
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
            onClick={handleAddField}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold transition-all"
          >
            <Plus size={16} />
            Add Field
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['all', 'lead', 'project', 'both'] as const).map((scope) => (
          <button
            key={scope}
            onClick={() => setFilterScope(scope)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              filterScope === scope
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {scope === 'all' ? 'All Fields' : getScopeLabel(scope)}
            <span className="ml-2 text-xs opacity-60">
              ({scope === 'all' ? fields.length : fields.filter(f => f.scope === scope || (scope === 'both' && f.scope === 'both')).length})
            </span>
          </button>
        ))}
      </div>

      {/* Fields List */}
      <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700/50 bg-slate-800/50">
          <div className="grid grid-cols-12 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <div className="col-span-1"></div>
            <div className="col-span-3">Field Name</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-2">Applies To</div>
            <div className="col-span-2">Required</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
        </div>

        <div className="divide-y divide-slate-700/50">
          {filteredFields.length === 0 ? (
            <div className="px-4 py-8 text-center text-slate-500">
              <AlertCircle size={24} className="mx-auto mb-2 opacity-50" />
              <p>No custom fields found</p>
              <button
                onClick={handleAddField}
                className="mt-2 text-blue-400 hover:text-blue-300 text-sm"
              >
                Create your first field
              </button>
            </div>
          ) : (
            filteredFields.sort((a, b) => a.order - b.order).map((field) => (
              <div
                key={field.id}
                className={`px-4 py-3 hover:bg-slate-800/30 transition-colors ${
                  !field.visible ? 'opacity-50' : ''
                }`}
              >
                <div className="grid grid-cols-12 items-center gap-4">
                  {/* Drag Handle */}
                  <div className="col-span-1">
                    <GripVertical size={16} className="text-slate-600 cursor-grab" />
                  </div>

                  {/* Field Name */}
                  <div className="col-span-3">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">
                        {FIELD_ICONS[field.type]}
                      </span>
                      <div>
                        <p className="text-white font-medium">{field.name}</p>
                        <p className="text-slate-500 text-xs font-mono">{field.key}</p>
                      </div>
                    </div>
                  </div>

                  {/* Type */}
                  <div className="col-span-2">
                    <span className="text-slate-400 text-sm">
                      {FIELD_TYPE_OPTIONS.find(t => t.value === field.type)?.label || field.type}
                    </span>
                  </div>

                  {/* Scope */}
                  <div className="col-span-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getScopeBadgeColor(field.scope)}`}>
                      {getScopeLabel(field.scope)}
                    </span>
                  </div>

                  {/* Required */}
                  <div className="col-span-2">
                    {field.required ? (
                      <span className="text-amber-400 text-xs">Required</span>
                    ) : (
                      <span className="text-slate-500 text-xs">Optional</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleToggleVisibility(field.id)}
                      className={`p-1.5 rounded transition-all ${
                        field.visible
                          ? 'text-slate-400 hover:text-white hover:bg-slate-700'
                          : 'text-slate-600 hover:text-white hover:bg-slate-700'
                      }`}
                      title={field.visible ? 'Hide field' : 'Show field'}
                    >
                      {field.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                    <button
                      onClick={() => handleEditField(field)}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-all"
                      title="Edit field"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteField(field.id)}
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-all"
                      title="Delete field"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex items-start gap-3">
        <Info size={18} className="text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-300">
          <p className="font-medium mb-1">Custom Fields Tips</p>
          <ul className="list-disc list-inside text-blue-300/80 space-y-1">
            <li>Fields will appear in lead and project forms based on their scope</li>
            <li>Hidden fields still retain their data, they just won't show in forms</li>
            <li>The field key is used internally - changing names won't affect stored data</li>
          </ul>
        </div>
      </div>

      {/* Add/Edit Field Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">
                  {editingField ? 'Edit Field' : 'Add Custom Field'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Field Name */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Field Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Roof Condition"
                  className={`w-full bg-slate-950 border rounded-lg px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none transition-all ${
                    errors.name ? 'border-red-500' : 'border-slate-700 focus:border-blue-500'
                  }`}
                />
                {formData.name && (
                  <p className="text-slate-500 text-xs mt-1">
                    Key: <span className="font-mono">{generateFieldKey(formData.name)}</span>
                  </p>
                )}
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
              </div>

              {/* Field Type */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Field Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as CustomFieldType }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  {FIELD_TYPE_OPTIONS.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Scope */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Applies To
                </label>
                <div className="flex gap-2">
                  {SCOPE_OPTIONS.map((scope) => (
                    <button
                      key={scope.value}
                      onClick={() => setFormData(prev => ({ ...prev, scope: scope.value }))}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        formData.scope === scope.value
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {scope.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Options (for select/multiselect) */}
              {(formData.type === 'select' || formData.type === 'multiselect') && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Options *
                  </label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newOption}
                        onChange={(e) => setNewOption(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddOption()}
                        placeholder="Add option..."
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                      />
                      <button
                        onClick={handleAddOption}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    {errors.options && <p className="text-red-400 text-xs">{errors.options}</p>}
                    {formData.options.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.options.map((option) => (
                          <div
                            key={option.value}
                            className="flex items-center gap-1 px-2 py-1 bg-slate-800 rounded text-sm"
                          >
                            <span className="text-white">{option.label}</span>
                            <button
                              onClick={() => handleRemoveOption(option.value)}
                              className="text-slate-400 hover:text-red-400"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Placeholder */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Placeholder Text
                </label>
                <input
                  type="text"
                  value={formData.placeholder}
                  onChange={(e) => setFormData(prev => ({ ...prev, placeholder: e.target.value }))}
                  placeholder="e.g., Enter roof condition..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Help Text */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Help Text
                </label>
                <input
                  type="text"
                  value={formData.helpText}
                  onChange={(e) => setFormData(prev => ({ ...prev, helpText: e.target.value }))}
                  placeholder="Hint shown below the field..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Required Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Required Field</p>
                  <p className="text-slate-500 text-xs">Users must fill out this field</p>
                </div>
                <button
                  onClick={() => setFormData(prev => ({ ...prev, required: !prev.required }))}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    formData.required ? 'bg-emerald-600' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                      formData.required ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="p-6 border-t border-slate-800 flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveField}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-all"
              >
                <Save size={16} />
                {editingField ? 'Update Field' : 'Create Field'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
