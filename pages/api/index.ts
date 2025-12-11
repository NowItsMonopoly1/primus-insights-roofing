/**
 * API Endpoints Index
 * 
 * Central export for all mock API endpoints.
 * Import from here for a unified API experience.
 * 
 * Usage:
 *   import { endpoints } from '../pages/api';
 *   const leads = await endpoints.leads.list();
 *   const project = await endpoints.projects.get('123');
 */

export { leadsEndpoint, handleLeadsRequest } from './leads';
export { projectsEndpoint, handleProjectsRequest } from './projects';
export { commissionsEndpoint, handleCommissionsRequest } from './commissions';
export { companyEndpoint, handleCompanyRequest } from './company';
export { installersEndpoint, handleInstallersRequest } from './installers';
export { repsEndpoint, handleRepsRequest } from './reps';
export { analyticsEndpoint, handleAnalyticsRequest } from './analytics';

// Unified endpoints object
import { leadsEndpoint } from './leads';
import { projectsEndpoint } from './projects';
import { commissionsEndpoint } from './commissions';
import { companyEndpoint } from './company';
import { installersEndpoint } from './installers';
import { repsEndpoint } from './reps';
import { analyticsEndpoint } from './analytics';

export const endpoints = {
  leads: leadsEndpoint,
  projects: projectsEndpoint,
  commissions: commissionsEndpoint,
  company: companyEndpoint,
  installers: installersEndpoint,
  reps: repsEndpoint,
  analytics: analyticsEndpoint
};

export default endpoints;
