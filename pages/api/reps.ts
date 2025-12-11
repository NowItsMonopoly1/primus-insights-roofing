/**
 * Mock API Endpoint: /api/reps
 * 
 * This file provides mock REST endpoint handlers for sales reps.
 * Designed to mirror a real backend API structure for easy migration.
 */

import { repsApi, ApiResponse } from '../../services/api';
import { Rep } from '../../types';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiRequest {
  method: HttpMethod;
  id?: string;
  action?: 'getStats';
}

/**
 * Main request handler - mimics Express/Next.js API route behavior
 */
export async function handleRepsRequest(request: ApiRequest): Promise<ApiResponse<any>> {
  const { method, id, action } = request;

  switch (method) {
    case 'GET':
      if (id && action === 'getStats') {
        return repsApi.getStats(id);
      }
      if (id) {
        return repsApi.getById(id);
      }
      return repsApi.getAll();

    default:
      return { success: false, error: `Method ${method} not allowed`, meta: { timestamp: new Date().toISOString() } };
  }
}

/**
 * Convenience methods for common operations
 */
export const repsEndpoint = {
  // GET /api/reps
  list: () => handleRepsRequest({ method: 'GET' }),
  
  // GET /api/reps/:id
  get: (id: string) => handleRepsRequest({ method: 'GET', id }),
  
  // GET /api/reps/:id/stats
  getStats: (id: string) => handleRepsRequest({ 
    method: 'GET', 
    id, 
    action: 'getStats' 
  })
};

export default repsEndpoint;
