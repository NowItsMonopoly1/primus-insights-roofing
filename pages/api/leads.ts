/**
 * Mock API Endpoint: /api/leads
 * 
 * This file provides mock REST endpoint handlers for leads.
 * Designed to mirror a real backend API structure for easy migration.
 * 
 * Usage in components:
 *   import { handleLeadsRequest } from '../pages/api/leads';
 *   const result = await handleLeadsRequest('GET', { status: 'new' });
 */

import { leadsApi, ApiResponse, LeadFilters } from '../../services/api';
import { Lead } from '../../types';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiRequest {
  method: HttpMethod;
  params?: LeadFilters;
  body?: Partial<Lead>;
  id?: string;
  ids?: string[]; // For bulk operations
}

/**
 * Main request handler - mimics Express/Next.js API route behavior
 */
export async function handleLeadsRequest(request: ApiRequest): Promise<ApiResponse<any>> {
  const { method, params, body, id, ids } = request;

  switch (method) {
    case 'GET':
      if (id) {
        return leadsApi.getById(id);
      }
      return leadsApi.getAll(params);

    case 'POST':
      if (!body) {
        return { success: false, error: 'Request body is required', meta: { timestamp: new Date().toISOString() } };
      }
      return leadsApi.create(body as Omit<Lead, 'id' | 'createdAt'>);

    case 'PUT':
    case 'PATCH':
      if (ids && ids.length > 0 && body) {
        // Bulk update
        return leadsApi.bulkUpdate(ids, body);
      }
      if (!id) {
        return { success: false, error: 'Lead ID is required', meta: { timestamp: new Date().toISOString() } };
      }
      if (!body) {
        return { success: false, error: 'Request body is required', meta: { timestamp: new Date().toISOString() } };
      }
      return leadsApi.update(id, body);

    case 'DELETE':
      if (!id) {
        return { success: false, error: 'Lead ID is required', meta: { timestamp: new Date().toISOString() } };
      }
      return leadsApi.delete(id);

    default:
      return { success: false, error: `Method ${method} not allowed`, meta: { timestamp: new Date().toISOString() } };
  }
}

/**
 * Convenience methods for common operations
 */
export const leadsEndpoint = {
  // GET /api/leads
  list: (filters?: LeadFilters) => handleLeadsRequest({ method: 'GET', params: filters }),
  
  // GET /api/leads/:id
  get: (id: string) => handleLeadsRequest({ method: 'GET', id }),
  
  // POST /api/leads
  create: (lead: Omit<Lead, 'id' | 'createdAt'>) => handleLeadsRequest({ method: 'POST', body: lead }),
  
  // PUT /api/leads/:id
  update: (id: string, updates: Partial<Lead>) => handleLeadsRequest({ method: 'PUT', id, body: updates }),
  
  // DELETE /api/leads/:id
  delete: (id: string) => handleLeadsRequest({ method: 'DELETE', id }),
  
  // PATCH /api/leads/bulk
  bulkUpdate: (ids: string[], updates: Partial<Lead>) => handleLeadsRequest({ method: 'PATCH', ids, body: updates }),
  
  // Specific status updates
  markAsContacted: (id: string) => handleLeadsRequest({ method: 'PUT', id, body: { status: 'contacted' } }),
  markAsQualified: (id: string) => handleLeadsRequest({ method: 'PUT', id, body: { status: 'qualified' } }),
  markAsClosed: (id: string) => handleLeadsRequest({ method: 'PUT', id, body: { status: 'closed' } }),
  markAsLost: (id: string) => handleLeadsRequest({ method: 'PUT', id, body: { status: 'lost' } })
};

export default leadsEndpoint;
