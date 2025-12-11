/**
 * Mock API Endpoint: /api/analytics
 * 
 * This file provides mock REST endpoint handlers for analytics data.
 * Designed to mirror a real backend API structure for easy migration.
 */

import { analyticsApi, ApiResponse } from '../../services/api';

export type HttpMethod = 'GET';

export interface ApiRequest {
  method: HttpMethod;
  action: 'revenue' | 'pipeline' | 'leaderboard';
  params?: {
    dateFrom?: string;
    dateTo?: string;
  };
}

/**
 * Main request handler - mimics Express/Next.js API route behavior
 */
export async function handleAnalyticsRequest(request: ApiRequest): Promise<ApiResponse<any>> {
  const { method, action, params } = request;

  if (method !== 'GET') {
    return { success: false, error: `Method ${method} not allowed`, meta: { timestamp: new Date().toISOString() } };
  }

  switch (action) {
    case 'revenue':
      return analyticsApi.getRevenueSummary(params?.dateFrom, params?.dateTo);
    
    case 'pipeline':
      return analyticsApi.getPipelineSummary();
    
    case 'leaderboard':
      return analyticsApi.getTeamLeaderboard();
    
    default:
      return { success: false, error: 'Invalid analytics action', meta: { timestamp: new Date().toISOString() } };
  }
}

/**
 * Convenience methods for common operations
 */
export const analyticsEndpoint = {
  // GET /api/analytics/revenue
  getRevenue: (dateFrom?: string, dateTo?: string) => handleAnalyticsRequest({ 
    method: 'GET', 
    action: 'revenue',
    params: { dateFrom, dateTo }
  }),
  
  // GET /api/analytics/pipeline
  getPipeline: () => handleAnalyticsRequest({ 
    method: 'GET', 
    action: 'pipeline' 
  }),
  
  // GET /api/analytics/leaderboard
  getLeaderboard: () => handleAnalyticsRequest({ 
    method: 'GET', 
    action: 'leaderboard' 
  }),
  
  // Convenience: Get this month's revenue
  getThisMonthRevenue: () => {
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    return analyticsEndpoint.getRevenue(firstOfMonth);
  },
  
  // Convenience: Get this quarter's revenue
  getThisQuarterRevenue: () => {
    const now = new Date();
    const quarter = Math.floor(now.getMonth() / 3);
    const firstOfQuarter = new Date(now.getFullYear(), quarter * 3, 1).toISOString().split('T')[0];
    return analyticsEndpoint.getRevenue(firstOfQuarter);
  },
  
  // Convenience: Get this year's revenue
  getThisYearRevenue: () => {
    const now = new Date();
    const firstOfYear = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
    return analyticsEndpoint.getRevenue(firstOfYear);
  }
};

export default analyticsEndpoint;
