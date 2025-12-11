/**
 * Mock API Endpoint: /api/installers
 * 
 * This file provides mock REST endpoint handlers for installers.
 * Designed to mirror a real backend API structure for easy migration.
 */

import { installersApi, ApiResponse } from '../../services/api';
import { Installer } from '../../types';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiRequest {
  method: HttpMethod;
  id?: string;
  action?: 'getPerformance';
}

/**
 * Main request handler - mimics Express/Next.js API route behavior
 */
export async function handleInstallersRequest(request: ApiRequest): Promise<ApiResponse<any>> {
  const { method, id, action } = request;

  switch (method) {
    case 'GET':
      if (id && action === 'getPerformance') {
        return installersApi.getPerformance(id);
      }
      if (id) {
        return installersApi.getById(id);
      }
      return installersApi.getAll();

    default:
      return { success: false, error: `Method ${method} not allowed`, meta: { timestamp: new Date().toISOString() } };
  }
}

/**
 * Convenience methods for common operations
 */
export const installersEndpoint = {
  // GET /api/installers
  list: () => handleInstallersRequest({ method: 'GET' }),
  
  // GET /api/installers/:id
  get: (id: string) => handleInstallersRequest({ method: 'GET', id }),
  
  // GET /api/installers/:id/performance
  getPerformance: (id: string) => handleInstallersRequest({ 
    method: 'GET', 
    id, 
    action: 'getPerformance' 
  })
};

export default installersEndpoint;
