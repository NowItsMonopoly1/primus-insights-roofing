/**
 * Mock API Endpoint: /api/projects
 * 
 * This file provides mock REST endpoint handlers for projects.
 * Designed to mirror a real backend API structure for easy migration.
 */

import { projectsApi, ApiResponse, ProjectFilters } from '../../services/api';
import { Project } from '../../types';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiRequest {
  method: HttpMethod;
  params?: ProjectFilters;
  body?: Partial<Project>;
  id?: string;
  action?: 'updateStage'; // Special actions
}

/**
 * Main request handler - mimics Express/Next.js API route behavior
 */
export async function handleProjectsRequest(request: ApiRequest): Promise<ApiResponse<any>> {
  const { method, params, body, id, action } = request;

  switch (method) {
    case 'GET':
      if (id) {
        return projectsApi.getById(id);
      }
      return projectsApi.getAll(params);

    case 'POST':
      if (!body) {
        return { success: false, error: 'Request body is required', meta: { timestamp: new Date().toISOString() } };
      }
      return projectsApi.create(body as Omit<Project, 'id'>);

    case 'PUT':
    case 'PATCH':
      if (!id) {
        return { success: false, error: 'Project ID is required', meta: { timestamp: new Date().toISOString() } };
      }
      if (!body) {
        return { success: false, error: 'Request body is required', meta: { timestamp: new Date().toISOString() } };
      }
      
      // Handle special stage update action
      if (action === 'updateStage' && body.stage) {
        return projectsApi.updateStage(id, body.stage);
      }
      
      return projectsApi.update(id, body);

    case 'DELETE':
      if (!id) {
        return { success: false, error: 'Project ID is required', meta: { timestamp: new Date().toISOString() } };
      }
      return projectsApi.delete(id);

    default:
      return { success: false, error: `Method ${method} not allowed`, meta: { timestamp: new Date().toISOString() } };
  }
}

/**
 * Convenience methods for common operations
 */
export const projectsEndpoint = {
  // GET /api/projects
  list: (filters?: ProjectFilters) => handleProjectsRequest({ method: 'GET', params: filters }),
  
  // GET /api/projects/:id
  get: (id: string) => handleProjectsRequest({ method: 'GET', id }),
  
  // POST /api/projects
  create: (project: Omit<Project, 'id'>) => handleProjectsRequest({ method: 'POST', body: project }),
  
  // PUT /api/projects/:id
  update: (id: string, updates: Partial<Project>) => handleProjectsRequest({ method: 'PUT', id, body: updates }),
  
  // DELETE /api/projects/:id
  delete: (id: string) => handleProjectsRequest({ method: 'DELETE', id }),
  
  // PATCH /api/projects/:id/stage
  updateStage: (id: string, stage: string) => handleProjectsRequest({ 
    method: 'PATCH', 
    id, 
    action: 'updateStage',
    body: { stage } 
  }),
  
  // Stage-specific shortcuts
  moveToPermit: (id: string) => projectsEndpoint.updateStage(id, 'permit'),
  moveToInstall: (id: string) => projectsEndpoint.updateStage(id, 'install'),
  moveToInspection: (id: string) => projectsEndpoint.updateStage(id, 'inspection'),
  moveToPTO: (id: string) => projectsEndpoint.updateStage(id, 'pto'),
  markComplete: (id: string) => projectsEndpoint.updateStage(id, 'complete'),
  markCancelled: (id: string) => projectsEndpoint.updateStage(id, 'cancelled')
};

export default projectsEndpoint;
