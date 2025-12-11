// components/CustomFieldRenderer.tsx
// Renders custom fields dynamically based on field configuration

import React from 'react';
import {
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
  HelpCircle,
} from 'lucide-react';
import {
  CustomField,
  CustomFieldType,
  getFieldDisplayValue,
} from '../services/customFields';

interface CustomFieldRendererProps {
  field: CustomField;
  value: any;
  onChange: (fieldKey: string, value: any) => void;
  disabled?: boolean;
  error?: string;
}

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

export default function CustomFieldRenderer({
  field,
  value,
  onChange,
  disabled = false,
  error,
}: CustomFieldRendererProps) {
  const handleChange = (newValue: any) => {
    onChange(field.key, newValue);
  };

  const baseInputClass = `w-full bg-slate-950 border rounded-lg px-3 py-2.5 text-slate-200 focus:outline-none focus:border-solar-orange focus:ring-1 focus:ring-solar-orange transition-all disabled:opacity-50 ${
    error ? 'border-red-500' : 'border-slate-800'
  }`;

  const renderField = () => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'url':
        return (
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              {FIELD_ICONS[field.type]}
            </span>
            <input
              type={field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : 'text'}
              value={value || ''}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={field.placeholder}
              disabled={disabled}
              className={`${baseInputClass} pl-10`}
              aria-label={field.name}
            />
          </div>
        );

      case 'number':
        return (
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              <Hash size={16} />
            </span>
            <input
              type="number"
              value={value || ''}
              onChange={(e) => handleChange(e.target.value ? parseFloat(e.target.value) : '')}
              placeholder={field.placeholder}
              disabled={disabled}
              min={field.validation?.min}
              max={field.validation?.max}
              className={`${baseInputClass} pl-10 font-mono`}
              aria-label={field.name}
            />
          </div>
        );

      case 'currency':
        return (
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              <DollarSign size={16} />
            </span>
            <input
              type="number"
              value={value || ''}
              onChange={(e) => handleChange(e.target.value ? parseFloat(e.target.value) : '')}
              placeholder={field.placeholder}
              disabled={disabled}
              min={0}
              step="0.01"
              className={`${baseInputClass} pl-10 font-mono`}
              aria-label={field.name}
            />
          </div>
        );

      case 'date':
        return (
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              <Calendar size={16} />
            </span>
            <input
              type="date"
              value={value || ''}
              onChange={(e) => handleChange(e.target.value)}
              disabled={disabled}
              className={`${baseInputClass} pl-10`}
              aria-label={field.name}
            />
          </div>
        );

      case 'textarea':
        return (
          <div className="relative">
            <span className="absolute left-3 top-3 text-slate-500">
              <AlignLeft size={16} />
            </span>
            <textarea
              value={value || ''}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={field.placeholder}
              disabled={disabled}
              rows={3}
              className={`${baseInputClass} pl-10 resize-none`}
              aria-label={field.name}
            />
          </div>
        );

      case 'select':
        return (
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
              <ChevronDown size={16} />
            </span>
            <select
              value={value || ''}
              onChange={(e) => handleChange(e.target.value)}
              disabled={disabled}
              className={`${baseInputClass} pl-10 cursor-pointer appearance-none`}
              aria-label={field.name}
            >
              <option value="">Select {field.name}...</option>
              {field.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
            />
          </div>
        );

      case 'multiselect':
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1">
              {field.options?.map((opt) => {
                const isSelected = selectedValues.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        handleChange(selectedValues.filter((v: string) => v !== opt.value));
                      } else {
                        handleChange([...selectedValues, opt.value]);
                      }
                    }}
                    disabled={disabled}
                    className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-solar-orange text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    } disabled:opacity-50`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 'checkbox':
        return (
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => !disabled && handleChange(!value)}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all cursor-pointer ${
                value
                  ? 'bg-solar-orange border-solar-orange'
                  : 'bg-slate-950 border-slate-700 hover:border-slate-600'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {value && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className="text-sm text-slate-300">{field.helpText || field.name}</span>
          </label>
        );

      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled}
            className={baseInputClass}
            aria-label={field.name}
          />
        );
    }
  };

  // Checkbox doesn't need the standard label wrapper
  if (field.type === 'checkbox') {
    return (
      <div className="space-y-1">
        {renderField()}
        {error && <p className="text-red-400 text-xs">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
        {field.name}
        {field.required && <span className="text-red-400">*</span>}
        {field.helpText && (
          <span className="relative group">
            <HelpCircle size={12} className="text-slate-600 cursor-help" />
            <span className="absolute left-0 bottom-full mb-1 px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
              {field.helpText}
            </span>
          </span>
        )}
      </label>
      {renderField()}
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  );
}

// Read-only display component for showing custom field values
interface CustomFieldDisplayProps {
  field: CustomField;
  value: any;
}

export function CustomFieldDisplay({ field, value }: CustomFieldDisplayProps) {
  const displayValue = getFieldDisplayValue(field, value);

  if (field.type === 'checkbox') {
    return (
      <div className="flex items-center gap-2">
        <span className="text-slate-500 text-sm">{field.name}:</span>
        <span className={value ? 'text-emerald-400' : 'text-slate-500'}>
          {displayValue}
        </span>
      </div>
    );
  }

  if (field.type === 'select' && field.options) {
    const option = field.options.find(o => o.value === value);
    return (
      <div className="flex items-center justify-between">
        <span className="text-slate-500 text-sm">{field.name}</span>
        {option ? (
          <span
            className="px-2 py-0.5 rounded text-xs font-medium"
            style={{
              backgroundColor: option.color ? `${option.color}20` : 'rgb(51 65 85)',
              color: option.color || 'rgb(148 163 184)',
            }}
          >
            {option.label}
          </span>
        ) : (
          <span className="text-slate-500">—</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500 text-sm">{field.name}</span>
      <span className="text-white text-sm">{displayValue}</span>
    </div>
  );
}
