// services/customFields.ts
// Custom Fields Configuration - Define custom data fields for leads and projects

import { getActiveCompanyId } from './companyStore';

const CUSTOM_FIELDS_KEY = 'primus_custom_fields';

// Supported field types
export type CustomFieldType = 
  | 'text'
  | 'number'
  | 'date'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'url'
  | 'email'
  | 'phone'
  | 'currency'
  | 'textarea';

// Where the field applies
export type CustomFieldScope = 'lead' | 'project' | 'both';

export interface CustomFieldOption {
  value: string;
  label: string;
  color?: string;
}

export interface CustomField {
  id: string;
  name: string;
  key: string; // Used in data storage (lowercase, underscored)
  type: CustomFieldType;
  scope: CustomFieldScope;
  required: boolean;
  defaultValue?: string | number | boolean;
  placeholder?: string;
  helpText?: string;
  options?: CustomFieldOption[]; // For select/multiselect
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  order: number;
  visible: boolean;
  createdAt: string;
}

export interface CustomFieldsConfig {
  companyId: string;
  fields: CustomField[];
  version: number;
}

// Simple UUID generator
function generateId(): string {
  return 'cf_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
}

// Generate key from name
export function generateFieldKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 32);
}

// Default fields commonly used in solar sales
export const DEFAULT_CUSTOM_FIELDS: CustomField[] = [
  {
    id: 'cf_roof_type',
    name: 'Roof Type',
    key: 'roof_type',
    type: 'select',
    scope: 'lead',
    required: false,
    options: [
      { value: 'asphalt_shingle', label: 'Asphalt Shingle' },
      { value: 'metal', label: 'Metal' },
      { value: 'tile', label: 'Tile' },
      { value: 'flat', label: 'Flat/TPO' },
      { value: 'slate', label: 'Slate' },
      { value: 'wood_shake', label: 'Wood Shake' },
      { value: 'other', label: 'Other' },
    ],
    order: 0,
    visible: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cf_roof_age',
    name: 'Roof Age (years)',
    key: 'roof_age',
    type: 'number',
    scope: 'lead',
    required: false,
    placeholder: 'Enter roof age',
    validation: { min: 0, max: 100 },
    order: 1,
    visible: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cf_hoa',
    name: 'HOA Approval Required',
    key: 'hoa_required',
    type: 'checkbox',
    scope: 'lead',
    required: false,
    defaultValue: false,
    helpText: 'Does this property require HOA approval for solar installation?',
    order: 2,
    visible: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cf_utility_company',
    name: 'Utility Company',
    key: 'utility_company',
    type: 'select',
    scope: 'both',
    required: false,
    options: [
      { value: 'duke_energy', label: 'Duke Energy' },
      { value: 'fpl', label: 'FPL (Florida Power & Light)' },
      { value: 'pge', label: 'PG&E' },
      { value: 'sce', label: 'Southern California Edison' },
      { value: 'sdge', label: 'SDG&E' },
      { value: 'other', label: 'Other' },
    ],
    order: 3,
    visible: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cf_avg_bill',
    name: 'Average Monthly Bill',
    key: 'avg_monthly_bill',
    type: 'currency',
    scope: 'lead',
    required: false,
    placeholder: 'e.g., 250',
    helpText: 'Customer\'s average monthly electricity bill',
    order: 4,
    visible: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cf_system_size',
    name: 'System Size (kW)',
    key: 'system_size_kw',
    type: 'number',
    scope: 'project',
    required: false,
    placeholder: 'e.g., 8.5',
    validation: { min: 0, max: 100 },
    order: 5,
    visible: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cf_panel_count',
    name: 'Number of Panels',
    key: 'panel_count',
    type: 'number',
    scope: 'project',
    required: false,
    placeholder: 'e.g., 24',
    validation: { min: 0, max: 200 },
    order: 6,
    visible: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cf_financing',
    name: 'Financing Type',
    key: 'financing_type',
    type: 'select',
    scope: 'project',
    required: false,
    options: [
      { value: 'cash', label: 'Cash Purchase', color: '#10b981' },
      { value: 'loan', label: 'Solar Loan', color: '#3b82f6' },
      { value: 'lease', label: 'Solar Lease', color: '#f59e0b' },
      { value: 'ppa', label: 'PPA (Power Purchase Agreement)', color: '#8b5cf6' },
    ],
    order: 7,
    visible: true,
    createdAt: new Date().toISOString(),
  },
];

// Load custom fields configuration
export function loadCustomFields(companyId?: string): CustomFieldsConfig {
  const activeCompany = companyId || getActiveCompanyId();
  const key = `${CUSTOM_FIELDS_KEY}_${activeCompany}`;
  
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Failed to load custom fields:', e);
  }
  
  // Return default config
  return {
    companyId: activeCompany,
    fields: [...DEFAULT_CUSTOM_FIELDS],
    version: 1,
  };
}

// Save custom fields configuration
export function saveCustomFields(companyId: string | undefined, config: CustomFieldsConfig): void {
  const activeCompany = companyId || getActiveCompanyId();
  const key = `${CUSTOM_FIELDS_KEY}_${activeCompany}`;
  
  config.companyId = activeCompany;
  config.version = (config.version || 0) + 1;
  
  localStorage.setItem(key, JSON.stringify(config));
}

// Get fields for a specific scope
export function getFieldsForScope(scope: CustomFieldScope, companyId?: string): CustomField[] {
  const config = loadCustomFields(companyId);
  return config.fields
    .filter(f => f.visible && (f.scope === scope || f.scope === 'both'))
    .sort((a, b) => a.order - b.order);
}

// Get lead-specific fields
export function getLeadFields(companyId?: string): CustomField[] {
  return getFieldsForScope('lead', companyId);
}

// Get project-specific fields
export function getProjectFields(companyId?: string): CustomField[] {
  return getFieldsForScope('project', companyId);
}

// Add a new custom field
export function addCustomField(companyId: string | undefined, field: Omit<CustomField, 'id' | 'createdAt' | 'order'>): CustomField {
  const config = loadCustomFields(companyId);
  
  const newField: CustomField = {
    ...field,
    id: generateId(),
    order: config.fields.length,
    createdAt: new Date().toISOString(),
  };
  
  config.fields.push(newField);
  saveCustomFields(companyId, config);
  
  return newField;
}

// Update an existing custom field
export function updateCustomField(companyId: string | undefined, fieldId: string, updates: Partial<CustomField>): CustomField | null {
  const config = loadCustomFields(companyId);
  const fieldIndex = config.fields.findIndex(f => f.id === fieldId);
  
  if (fieldIndex === -1) return null;
  
  config.fields[fieldIndex] = {
    ...config.fields[fieldIndex],
    ...updates,
    id: fieldId, // Prevent ID changes
  };
  
  saveCustomFields(companyId, config);
  return config.fields[fieldIndex];
}

// Delete a custom field
export function deleteCustomField(companyId: string | undefined, fieldId: string): boolean {
  const config = loadCustomFields(companyId);
  const originalLength = config.fields.length;
  
  config.fields = config.fields.filter(f => f.id !== fieldId);
  
  if (config.fields.length < originalLength) {
    // Reorder remaining fields
    config.fields = config.fields.map((f, idx) => ({ ...f, order: idx }));
    saveCustomFields(companyId, config);
    return true;
  }
  
  return false;
}

// Reorder custom fields
export function reorderCustomFields(companyId: string | undefined, fieldIds: string[]): void {
  const config = loadCustomFields(companyId);
  
  config.fields = config.fields.map(field => {
    const newOrder = fieldIds.indexOf(field.id);
    return {
      ...field,
      order: newOrder >= 0 ? newOrder : field.order + 1000,
    };
  }).sort((a, b) => a.order - b.order);
  
  saveCustomFields(companyId, config);
}

// Reset custom fields to defaults
export function resetCustomFieldsToDefaults(companyId?: string): void {
  const activeCompany = companyId || getActiveCompanyId();
  saveCustomFields(activeCompany, {
    companyId: activeCompany,
    fields: [...DEFAULT_CUSTOM_FIELDS],
    version: 1,
  });
}

// Toggle field visibility
export function toggleFieldVisibility(companyId: string | undefined, fieldId: string): void {
  const config = loadCustomFields(companyId);
  const field = config.fields.find(f => f.id === fieldId);
  
  if (field) {
    field.visible = !field.visible;
    saveCustomFields(companyId, config);
  }
}

// Get field by ID
export function getFieldById(fieldId: string, companyId?: string): CustomField | undefined {
  const config = loadCustomFields(companyId);
  return config.fields.find(f => f.id === fieldId);
}

// Get field by key
export function getFieldByKey(key: string, companyId?: string): CustomField | undefined {
  const config = loadCustomFields(companyId);
  return config.fields.find(f => f.key === key);
}

// Validate field value based on field configuration
export function validateFieldValue(field: CustomField, value: any): { valid: boolean; error?: string } {
  // Required check
  if (field.required && (value === undefined || value === null || value === '')) {
    return { valid: false, error: `${field.name} is required` };
  }
  
  // Skip further validation if empty and not required
  if (value === undefined || value === null || value === '') {
    return { valid: true };
  }
  
  // Type-specific validation
  switch (field.type) {
    case 'number':
    case 'currency':
      const numVal = parseFloat(value);
      if (isNaN(numVal)) {
        return { valid: false, error: `${field.name} must be a number` };
      }
      if (field.validation?.min !== undefined && numVal < field.validation.min) {
        return { valid: false, error: `${field.name} must be at least ${field.validation.min}` };
      }
      if (field.validation?.max !== undefined && numVal > field.validation.max) {
        return { valid: false, error: `${field.name} must be at most ${field.validation.max}` };
      }
      break;
      
    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return { valid: false, error: `${field.name} must be a valid email address` };
      }
      break;
      
    case 'phone':
      const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
      if (!phoneRegex.test(value)) {
        return { valid: false, error: `${field.name} must be a valid phone number` };
      }
      break;
      
    case 'url':
      try {
        new URL(value);
      } catch {
        return { valid: false, error: `${field.name} must be a valid URL` };
      }
      break;
      
    case 'select':
      if (field.options && !field.options.some(opt => opt.value === value)) {
        return { valid: false, error: `Invalid option for ${field.name}` };
      }
      break;
      
    case 'text':
    case 'textarea':
      if (field.validation?.pattern) {
        const regex = new RegExp(field.validation.pattern);
        if (!regex.test(value)) {
          return { valid: false, error: field.validation.message || `Invalid format for ${field.name}` };
        }
      }
      break;
  }
  
  return { valid: true };
}

// Get display value for a field (handles select options, etc.)
export function getFieldDisplayValue(field: CustomField, value: any): string {
  if (value === undefined || value === null || value === '') {
    return '—';
  }
  
  switch (field.type) {
    case 'select':
    case 'multiselect':
      if (field.options) {
        if (Array.isArray(value)) {
          return value
            .map(v => field.options?.find(o => o.value === v)?.label || v)
            .join(', ');
        }
        const option = field.options.find(o => o.value === value);
        return option?.label || value;
      }
      return value;
      
    case 'checkbox':
      return value ? 'Yes' : 'No';
      
    case 'currency':
      return `$${parseFloat(value).toLocaleString()}`;
      
    case 'date':
      return new Date(value).toLocaleDateString();
      
    default:
      return String(value);
  }
}

// Export field types for UI rendering
export const FIELD_TYPE_OPTIONS: { value: CustomFieldType; label: string; icon: string }[] = [
  { value: 'text', label: 'Short Text', icon: 'Type' },
  { value: 'textarea', label: 'Long Text', icon: 'AlignLeft' },
  { value: 'number', label: 'Number', icon: 'Hash' },
  { value: 'currency', label: 'Currency', icon: 'DollarSign' },
  { value: 'date', label: 'Date', icon: 'Calendar' },
  { value: 'select', label: 'Dropdown', icon: 'ChevronDown' },
  { value: 'multiselect', label: 'Multi-Select', icon: 'CheckSquare' },
  { value: 'checkbox', label: 'Checkbox', icon: 'ToggleLeft' },
  { value: 'email', label: 'Email', icon: 'Mail' },
  { value: 'phone', label: 'Phone', icon: 'Phone' },
  { value: 'url', label: 'URL', icon: 'Link' },
];

export const SCOPE_OPTIONS: { value: CustomFieldScope; label: string }[] = [
  { value: 'lead', label: 'Leads Only' },
  { value: 'project', label: 'Projects Only' },
  { value: 'both', label: 'Leads & Projects' },
];
