/**
 * Mock API Endpoint: /api/commissions
 * 
 * This file provides mock REST endpoint handlers for commissions.
 * Designed to mirror a real backend API structure for easy migration.
 */

import { commissionsApi, Commission, ApiResponse, CommissionFilters } from '../../services/api';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiRequest {
  method: HttpMethod;
  params?: CommissionFilters;
  body?: Partial<Commission>;
  id?: string;
  ids?: string[]; // For bulk operations
  action?: 'approve' | 'markPaid' | 'bulkApprove';
}

/**
 * Main request handler - mimics Express/Next.js API route behavior
 */
export async function handleCommissionsRequest(request: ApiRequest): Promise<ApiResponse<any>> {
  const { method, params, body, id, ids, action } = request;

  switch (method) {
    case 'GET':
      if (id) {
        return commissionsApi.getById(id);
      }
      return commissionsApi.getAll(params);

    case 'POST':
      if (!body) {
        return { success: false, error: 'Request body is required', meta: { timestamp: new Date().toISOString() } };
      }
      return commissionsApi.create(body as Omit<Commission, 'id'>);

    case 'PUT':
    case 'PATCH':
      // Handle bulk approve
      if (action === 'bulkApprove' && ids && ids.length > 0) {
        return commissionsApi.bulkApprove(ids);
      }
      
      if (!id) {
        return { success: false, error: 'Commission ID is required', meta: { timestamp: new Date().toISOString() } };
      }
      
      // Handle single approve
      if (action === 'approve') {
        return commissionsApi.approve(id);
      }
      
      // Handle mark as paid
      if (action === 'markPaid') {
        return commissionsApi.markPaid(id);
      }
      
      return { success: false, error: 'Invalid action', meta: { timestamp: new Date().toISOString() } };

    default:
      return { success: false, error: `Method ${method} not allowed`, meta: { timestamp: new Date().toISOString() } };
  }
}

/**
 * Convenience methods for common operations
 */
export const commissionsEndpoint = {
  // GET /api/commissions
  list: (filters?: CommissionFilters) => handleCommissionsRequest({ method: 'GET', params: filters }),
  
  // GET /api/commissions/:id
  get: (id: string) => handleCommissionsRequest({ method: 'GET', id }),
  
  // POST /api/commissions
  create: (commission: Omit<Commission, 'id'>) => handleCommissionsRequest({ method: 'POST', body: commission }),
  
  // PATCH /api/commissions/:id/approve
  approve: (id: string) => handleCommissionsRequest({ method: 'PATCH', id, action: 'approve' }),
  
  // PATCH /api/commissions/:id/paid
  markPaid: (id: string) => handleCommissionsRequest({ method: 'PATCH', id, action: 'markPaid' }),
  
  // PATCH /api/commissions/bulk-approve
  bulkApprove: (ids: string[]) => handleCommissionsRequest({ method: 'PATCH', ids, action: 'bulkApprove' }),
  
  // Convenience: Get pending commissions
  getPending: () => handleCommissionsRequest({ method: 'GET', params: { status: 'pending' } }),
  
  // Convenience: Get approved commissions
  getApproved: () => handleCommissionsRequest({ method: 'GET', params: { status: 'approved' } }),
  
  // Convenience: Get paid commissions
  getPaid: () => handleCommissionsRequest({ method: 'GET', params: { status: 'paid' } }),
  
  // Convenience: Get commissions by rep
  getByRep: (repId: string) => handleCommissionsRequest({ method: 'GET', params: { repId } })
};

export default commissionsEndpoint;
