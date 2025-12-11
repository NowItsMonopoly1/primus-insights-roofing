/**
 * Mock API Endpoint: /api/company
 * 
 * This file provides mock REST endpoint handlers for company data.
 * Designed to mirror a real backend API structure for easy migration.
 */

import { companyApi, ApiResponse } from '../../services/api';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH';

export interface ApiRequest {
  method: HttpMethod;
  companyId?: string;
  body?: any;
  action?: 'getCurrent' | 'getAll' | 'getSettings' | 'updateSettings';
}

/**
 * Main request handler - mimics Express/Next.js API route behavior
 */
export async function handleCompanyRequest(request: ApiRequest): Promise<ApiResponse<any>> {
  const { method, companyId, body, action } = request;

  switch (method) {
    case 'GET':
      if (action === 'getAll') {
        return companyApi.getAll();
      }
      if (action === 'getSettings' && companyId) {
        return companyApi.getSettings(companyId);
      }
      // Default: get current company
      return companyApi.getCurrent();

    case 'PUT':
    case 'PATCH':
      if (action === 'updateSettings' && companyId && body) {
        return companyApi.updateSettings(companyId, body);
      }
      return { success: false, error: 'Invalid request', meta: { timestamp: new Date().toISOString() } };

    default:
      return { success: false, error: `Method ${method} not allowed`, meta: { timestamp: new Date().toISOString() } };
  }
}

/**
 * Convenience methods for common operations
 */
export const companyEndpoint = {
  // GET /api/company/current
  getCurrent: () => handleCompanyRequest({ method: 'GET', action: 'getCurrent' }),
  
  // GET /api/company/all
  getAll: () => handleCompanyRequest({ method: 'GET', action: 'getAll' }),
  
  // GET /api/company/:id/settings
  getSettings: (companyId: string) => handleCompanyRequest({ 
    method: 'GET', 
    action: 'getSettings', 
    companyId 
  }),
  
  // PUT /api/company/:id/settings
  updateSettings: (companyId: string, settings: any) => handleCompanyRequest({ 
    method: 'PUT', 
    action: 'updateSettings', 
    companyId, 
    body: settings 
  })
};

export default companyEndpoint;
