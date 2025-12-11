import { Lead, LeadStatus } from '../types';

interface FilterOptions {
  filter: LeadStatus | 'ALL';
  searchTerm: string;
  highValueOnly: boolean;
  priorityFilter: 'all' | 'high' | 'medium' | 'low';
  repFilter: string;
}

export type SortField = 'name' | 'estimatedBill' | 'status' | 'createdAt' | 'aiScore';
export type SortDirection = 'asc' | 'desc';

// Status workflow order for sorting
const STATUS_ORDER: Record<LeadStatus, number> = {
  'NEW': 0,
  'QUALIFIED': 1,
  'PROPOSAL_SENT': 2,
  'CLOSED_WON': 3,
  'CLOSED_LOST': 4
};

/**
 * Apply all filters to leads array
 * Pure function - does not mutate input
 */
export function applyFilters(leads: Lead[], options: FilterOptions): Lead[] {
  const { filter, searchTerm, highValueOnly, priorityFilter, repFilter } = options;
  
  return leads.filter((lead) => {
    // Status filter (existing logic preserved)
    const statusMatch = filter === 'ALL' ? true : lead.status === filter;
    if (!statusMatch) return false;

    // Search filter (existing logic preserved - name + address)
    const searchLower = searchTerm.toLowerCase();
    const searchMatch = searchTerm === '' || 
      lead.name.toLowerCase().includes(searchLower) ||
      lead.address.toLowerCase().includes(searchLower);
    if (!searchMatch) return false;

    // High Value filter ($200+)
    if (highValueOnly) {
      const bill = lead.estimatedBill ?? 0;
      if (bill < 200) return false;
    }

    // Priority filter (AI priority)
    if (priorityFilter !== 'all') {
      const leadPriority = lead.priority ?? 'low';
      if (leadPriority !== priorityFilter) return false;
    }

    // Rep filter (future-safe - if lead has assignedRep field)
    if (repFilter !== 'all') {
      const leadRep = (lead as any).assignedRep ?? '';
      if (leadRep !== repFilter) return false;
    }

    return true;
  });
}

/**
 * Apply sorting to leads array
 * Pure function - does not mutate input
 */
export function applySorting(leads: Lead[], sortField: SortField, sortDirection: SortDirection): Lead[] {
  const sorted = [...leads];
  
  sorted.sort((a, b) => {
    let comparison = 0;
    
    switch (sortField) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
        
      case 'estimatedBill':
        const billA = a.estimatedBill ?? 0;
        const billB = b.estimatedBill ?? 0;
        comparison = billA - billB;
        break;
        
      case 'status':
        const orderA = STATUS_ORDER[a.status] ?? 99;
        const orderB = STATUS_ORDER[b.status] ?? 99;
        comparison = orderA - orderB;
        break;
        
      case 'createdAt':
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        comparison = dateA - dateB;
        break;
        
      case 'aiScore':
        const scoreA = a.aiScore ?? 0;
        const scoreB = b.aiScore ?? 0;
        comparison = scoreA - scoreB;
        break;
        
      default:
        comparison = 0;
    }
    
    // Reverse for descending order
    return sortDirection === 'asc' ? comparison : -comparison;
  });
  
  return sorted;
}

/**
 * Get unique reps from leads (for future rep filter dropdown)
 */
export function getUniqueReps(leads: Lead[]): string[] {
  const reps = new Set<string>();
  leads.forEach((lead) => {
    const rep = (lead as any).assignedRep;
    if (rep) reps.add(rep);
  });
  return Array.from(reps).sort();
}
