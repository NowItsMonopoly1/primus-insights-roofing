/**
 * CSV Parsing and Generation Utilities
 * Enterprise-grade CSV handling for Primus Home Pro
 * 
 * Supports:
 * - Standard CSV parsing with quoted values
 * - Custom field flattening/unflattening
 * - Export with proper escaping
 * - Download trigger
 */

// =============================================================================
// Types
// =============================================================================

export interface ParseOptions {
  delimiter?: string;
  hasHeader?: boolean;
  trimValues?: boolean;
}

export interface GenerateOptions {
  delimiter?: string;
  includeHeader?: boolean;
  flattenCustomFields?: boolean;
}

// =============================================================================
// CSV Parsing
// =============================================================================

/**
 * Parse CSV text into array of objects
 * First row is treated as headers by default
 */
export function parseCSV(text: string, options: ParseOptions = {}): Record<string, any>[] {
  const {
    delimiter = ',',
    hasHeader = true,
    trimValues = true
  } = options;
  
  const lines = parseCSVLines(text, delimiter);
  
  if (lines.length === 0) return [];
  
  if (!hasHeader) {
    // Return arrays instead of objects
    return lines.map(line => {
      const obj: Record<string, any> = {};
      line.forEach((value, index) => {
        obj[`col${index}`] = trimValues ? value.trim() : value;
      });
      return obj;
    });
  }
  
  // First line is headers
  const headers = lines[0].map(h => trimValues ? h.trim() : h);
  const records: Record<string, any>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i];
    const record: Record<string, any> = {};
    
    headers.forEach((header, index) => {
      let value: any = values[index] || '';
      if (trimValues) value = value.trim();
      
      // Try to parse numbers and booleans
      value = parseValue(value);
      
      // Handle custom fields (format: customField:fieldId)
      if (header.startsWith('customField:')) {
        const fieldId = header.replace('customField:', '');
        if (!record.customFields) record.customFields = {};
        record.customFields[fieldId] = value;
      } else {
        record[header] = value;
      }
    });
    
    records.push(record);
  }
  
  return records;
}

/**
 * Parse CSV lines handling quoted values
 */
function parseCSVLines(text: string, delimiter: string): string[][] {
  const lines: string[][] = [];
  let currentLine: string[] = [];
  let currentValue = '';
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    
    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote
          currentValue += '"';
          i++;
        } else {
          // End of quoted value
          inQuotes = false;
        }
      } else {
        currentValue += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === delimiter) {
        currentLine.push(currentValue);
        currentValue = '';
      } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
        currentLine.push(currentValue);
        if (currentLine.some(v => v !== '')) {
          lines.push(currentLine);
        }
        currentLine = [];
        currentValue = '';
        if (char === '\r') i++;
      } else if (char !== '\r') {
        currentValue += char;
      }
    }
  }
  
  // Push last line
  if (currentValue || currentLine.length > 0) {
    currentLine.push(currentValue);
    if (currentLine.some(v => v !== '')) {
      lines.push(currentLine);
    }
  }
  
  return lines;
}

/**
 * Try to parse a string value to appropriate type
 */
function parseValue(value: string): any {
  if (value === '') return '';
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null') return null;
  if (value === 'undefined') return undefined;
  
  // Check for number
  const num = Number(value);
  if (!isNaN(num) && value.trim() !== '') {
    return num;
  }
  
  return value;
}

// =============================================================================
// CSV Generation
// =============================================================================

/**
 * Convert array of objects to CSV string
 */
export function toCSV(records: Record<string, any>[], options: GenerateOptions = {}): string {
  const {
    delimiter = ',',
    includeHeader = true,
    flattenCustomFields = true
  } = options;
  
  if (records.length === 0) return '';
  
  // Flatten records if needed
  const flatRecords = flattenCustomFields
    ? records.map(flattenRecord)
    : records;
  
  // Collect all unique headers
  const headerSet = new Set<string>();
  flatRecords.forEach(record => {
    Object.keys(record).forEach(key => headerSet.add(key));
  });
  const headers = Array.from(headerSet);
  
  const lines: string[] = [];
  
  // Header row
  if (includeHeader) {
    lines.push(headers.map(escapeCSVValue).join(delimiter));
  }
  
  // Data rows
  flatRecords.forEach(record => {
    const values = headers.map(header => {
      const value = record[header];
      return escapeCSVValue(formatValue(value));
    });
    lines.push(values.join(delimiter));
  });
  
  return lines.join('\n');
}

/**
 * Flatten a record, moving customFields to top-level with prefix
 */
function flattenRecord(record: Record<string, any>): Record<string, any> {
  const flat: Record<string, any> = {};
  
  Object.entries(record).forEach(([key, value]) => {
    if (key === 'customFields' && typeof value === 'object' && value !== null) {
      // Flatten custom fields with prefix
      Object.entries(value).forEach(([fieldId, fieldValue]) => {
        flat[`customField:${fieldId}`] = fieldValue;
      });
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Skip nested objects (or flatten them)
      flat[key] = JSON.stringify(value);
    } else if (Array.isArray(value)) {
      flat[key] = JSON.stringify(value);
    } else {
      flat[key] = value;
    }
  });
  
  return flat;
}

/**
 * Format a value for CSV output
 */
function formatValue(value: any): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value.toString();
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/**
 * Escape a CSV value (wrap in quotes if needed)
 */
function escapeCSVValue(value: string): string {
  // Check if value needs quoting
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    // Escape quotes by doubling them
    const escaped = value.replace(/"/g, '""');
    return `"${escaped}"`;
  }
  return value;
}

// =============================================================================
// Download Helper
// =============================================================================

/**
 * Trigger a CSV file download in the browser
 */
export function downloadCSV(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

// =============================================================================
// Validation Helpers
// =============================================================================

/**
 * Validate that required columns exist in parsed CSV
 */
export function validateColumns(
  records: Record<string, any>[],
  requiredColumns: string[]
): { valid: boolean; missing: string[] } {
  if (records.length === 0) {
    return { valid: false, missing: requiredColumns };
  }
  
  const presentColumns = new Set(Object.keys(records[0]));
  const missing = requiredColumns.filter(col => !presentColumns.has(col));
  
  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * Get column mapping suggestions based on CSV headers
 */
export function suggestColumnMapping(
  csvHeaders: string[],
  targetFields: { name: string; aliases: string[] }[]
): Record<string, string> {
  const mapping: Record<string, string> = {};
  
  csvHeaders.forEach(header => {
    const lowerHeader = header.toLowerCase().replace(/[_\s-]/g, '');
    
    for (const field of targetFields) {
      const fieldLower = field.name.toLowerCase().replace(/[_\s-]/g, '');
      const aliasesLower = field.aliases.map(a => a.toLowerCase().replace(/[_\s-]/g, ''));
      
      if (lowerHeader === fieldLower || aliasesLower.includes(lowerHeader)) {
        mapping[header] = field.name;
        break;
      }
    }
  });
  
  return mapping;
}

// =============================================================================
// Entity-Specific Helpers
// =============================================================================

/**
 * Lead field definitions for import mapping
 */
export const LEAD_FIELDS = [
  { name: 'name', aliases: ['customer', 'customername', 'fullname', 'leadname'] },
  { name: 'address', aliases: ['location', 'street', 'streetaddress'] },
  { name: 'email', aliases: ['emailaddress', 'mail'] },
  { name: 'phone', aliases: ['phonenumber', 'telephone', 'mobile'] },
  { name: 'estimatedBill', aliases: ['bill', 'electricbill', 'monthlybill', 'avgbill'] },
  { name: 'status', aliases: ['leadstatus', 'state'] },
  { name: 'notes', aliases: ['comments', 'description', 'note'] },
  { name: 'assignedTo', aliases: ['rep', 'salesrep', 'assignee', 'owner'] },
  { name: 'priority', aliases: ['importance', 'urgency'] },
  { name: 'age', aliases: ['roofage', 'roofyear', 'yearsold'] }
];

/**
 * Project field definitions for import mapping
 */
export const PROJECT_FIELDS = [
  { name: 'customerName', aliases: ['customer', 'name', 'client'] },
  { name: 'address', aliases: ['location', 'street', 'siteaddress'] },
  { name: 'contractValue', aliases: ['value', 'amount', 'price', 'total'] },
  { name: 'systemSize', aliases: ['size', 'kw', 'kilowatts', 'capacity'] },
  { name: 'stage', aliases: ['status', 'projectstage', 'phase'] },
  { name: 'installerId', aliases: ['installer', 'crew', 'team'] },
  { name: 'repId', aliases: ['rep', 'salesrep', 'salesperson'] },
  { name: 'contractDate', aliases: ['signdate', 'startdate', 'closedate'] },
  { name: 'installDate', aliases: ['scheduled', 'installationdate'] }
];

/**
 * Rep field definitions for import mapping
 */
export const REP_FIELDS = [
  { name: 'name', aliases: ['fullname', 'repname', 'salesrep'] },
  { name: 'email', aliases: ['emailaddress', 'mail'] },
  { name: 'phone', aliases: ['phonenumber', 'mobile'] },
  { name: 'teamId', aliases: ['team', 'group'] },
  { name: 'role', aliases: ['position', 'title'] },
  { name: 'hireDate', aliases: ['startdate', 'joindate'] }
];

/**
 * Installer field definitions for import mapping
 */
export const INSTALLER_FIELDS = [
  { name: 'name', aliases: ['installername', 'crewname', 'company'] },
  { name: 'phone', aliases: ['phonenumber', 'mobile', 'contact'] },
  { name: 'email', aliases: ['emailaddress', 'mail'] },
  { name: 'licenseNumber', aliases: ['license', 'contractorlicense'] },
  { name: 'rating', aliases: ['score', 'stars'] },
  { name: 'isActive', aliases: ['active', 'status', 'enabled'] }
];

/**
 * Get headers for export based on entity type
 */
export function getExportHeaders(entityType: 'lead' | 'project' | 'rep' | 'installer'): string[] {
  switch (entityType) {
    case 'lead':
      return ['id', 'name', 'address', 'email', 'phone', 'estimatedBill', 'status', 'priority', 'assignedTo', 'notes', 'createdAt'];
    case 'project':
      return ['id', 'customerName', 'address', 'contractValue', 'systemSize', 'stage', 'repId', 'installerId', 'contractDate', 'installDate'];
    case 'rep':
      return ['id', 'name', 'email', 'phone', 'role', 'teamId', 'hireDate', 'isActive'];
    case 'installer':
      return ['id', 'name', 'phone', 'email', 'licenseNumber', 'rating', 'isActive'];
    default:
      return [];
  }
}
