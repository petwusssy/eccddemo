/**
 * ECCD CARE — Centralized API Services Layer
 * City Social Welfare and Development Office (CSWDO)
 *
 * Exposes standardized REST service functions across all 14 entities:
 * 1.  userApi
 * 2.  roleApi
 * 3.  workerApi
 * 4.  barangayApi
 * 5.  dayCareCenterApi
 * 6.  mappingActivityApi
 * 7.  householdApi
 * 8.  childApi (ECCD Child ID persistent master)
 * 9.  enrollmentApi
 * 10. healthMonitoringApi
 * 11. developmentAssessmentApi
 * 12. followUpApi
 * 13. auditLogApi
 * 14. resourceApi
 *
 * Adheres to REST Conventions:
 * - GET    /api/...
 * - POST   /api/...
 * - PUT    /api/.../:id
 * - DELETE /api/.../:id
 *
 * Core rule: Child ID is never duplicated when enrollment, health monitoring,
 * or developmental assessment occurs.
 */

import { apiClient } from './apiClient.js';

// 1. User API
export const userApi = {
  getAll: (params) => apiClient.get('/api/users', params),
  getById: (id) => apiClient.get(`/api/users/${id}`),
  create: (data) => apiClient.post('/api/users', data),
  update: (id, data) => apiClient.put(`/api/users/${id}`, data),
  delete: (id) => apiClient.delete(`/api/users/${id}`),
};

// 2. Role API
export const roleApi = {
  getAll: () => apiClient.get('/api/governance/roles'),
  getById: (id) => apiClient.get(`/api/governance/roles/${id}`),
};

// 3. Worker API
export const workerApi = {
  getAll: (params) => apiClient.get('/api/workers', params),
  getById: (id) => apiClient.get(`/api/workers/${id}`),
  create: (data) => apiClient.post('/api/workers', data),
  update: (id, data) => apiClient.put(`/api/workers/${id}`, data),
  delete: (id) => apiClient.delete(`/api/workers/${id}`),
};

// 4. Barangay API
export const barangayApi = {
  getAll: (params) => apiClient.get('/api/barangays', params),
  getById: (id) => apiClient.get(`/api/barangays/${id}`),
  create: (data) => apiClient.post('/api/barangays', data),
  update: (id, data) => apiClient.put(`/api/barangays/${id}`, data),
  delete: (id) => apiClient.delete(`/api/barangays/${id}`),
};

// 5. Day Care Center API
export const dayCareCenterApi = {
  getAll: (params) => apiClient.get('/api/centers', params),
  getById: (id) => apiClient.get(`/api/centers/${id}`),
  create: (data) => apiClient.post('/api/centers', data),
  update: (id, data) => apiClient.put(`/api/centers/${id}`, data),
  delete: (id) => apiClient.delete(`/api/centers/${id}`),
};

// 6. Mapping Activity API
export const mappingActivityApi = {
  getAll: (params) => apiClient.get('/api/mapping/activities', params),
  getById: (id) => apiClient.get(`/api/mapping/activities/${id}`),
  create: (data) => apiClient.post('/api/mapping/activities', data),
  assignWorkers: (id, workers, barangay) =>
    apiClient.post(`/api/mapping/activities/${id}/assignments`, { workers, barangay }),
  update: (id, data) => apiClient.put(`/api/mapping/activities/${id}`, data),
  delete: (id) => apiClient.delete(`/api/mapping/activities/${id}`),
};

// 7. Household API
export const householdApi = {
  getAll: (params) => apiClient.get('/api/households', params),
  getById: (id) => apiClient.get(`/api/households/${id}`),
  create: (data) => apiClient.post('/api/households', data),
  update: (id, data) => apiClient.put(`/api/households/${id}`, data),
  delete: (id) => apiClient.delete(`/api/households/${id}`),
};

// 8. Child API (Persistent ECCD Child ID Master)
export const childApi = {
  getAll: (params) => apiClient.get('/api/children', params),
  getById: (id) => apiClient.get(`/api/children/${id}`),
  create: (data) => apiClient.post('/api/children', data),
  update: (id, data) => apiClient.put(`/api/children/${id}`, data),
  delete: (id) => apiClient.delete(`/api/children/${id}`),
  search: (query, birthDate) => apiClient.get('/api/children/search', { q: query, birthDate }),
  getTimeline: (id) => apiClient.get(`/api/children/${id}/timeline`),
  getHousehold: (id) => apiClient.get(`/api/children/${id}/household`),
  getStatus: (id) => apiClient.get(`/api/children/${id}/status`),
};

// 9. Enrollment API (Strict: Never duplicates child record)
export const enrollmentApi = {
  getAll: (params) => apiClient.get('/api/enrollments', params),
  getNotEnrolled: (params) => apiClient.get('/api/enrollments/not-enrolled', params),
  create: (data) => apiClient.post('/api/enrollments', data),
  getById: (id) => apiClient.get(`/api/enrollments/${id}`),
  getByChildId: (childId) => apiClient.get(`/api/children/${childId}/enrollment`),
  update: (id, data) => apiClient.put(`/api/enrollments/${id}`, data),
  delete: (id) => apiClient.delete(`/api/enrollments/${id}`),
};

// 10. Health Monitoring API (Strict: Reuses child ID)
export const healthMonitoringApi = {
  getDue: (params) => apiClient.get('/api/health-monitoring/due', params),
  getByChildId: (childId) => apiClient.get(`/api/children/${childId}/health`),
  record: (childId, data) => apiClient.post(`/api/children/${childId}/health`, data),
  update: (id, data) => apiClient.put(`/api/health-monitoring/${id}`, data),
  delete: (id) => apiClient.delete(`/api/health-monitoring/${id}`),
};

// 11. Development Assessment API (Strict: Reuses child ID)
export const developmentAssessmentApi = {
  getAll: (params) => apiClient.get('/api/development/assessments', params),
  getByChildId: (childId) => apiClient.get(`/api/children/${childId}/development`),
  record: (childId, data) => apiClient.post(`/api/children/${childId}/development`, data),
  getReference: () => apiClient.get('/api/development/reference'),
  update: (id, data) => apiClient.put(`/api/development/assessments/${id}`, data),
  delete: (id) => apiClient.delete(`/api/development/assessments/${id}`),
};

// 12. Follow-Up API
export const followUpApi = {
  getAll: (params) => apiClient.get('/api/follow-ups', params),
  getNeedsAttention: (params) => apiClient.get('/api/follow-ups/needs-attention', params),
  create: (data) => apiClient.post('/api/follow-ups', data),
  getById: (id) => apiClient.get(`/api/follow-ups/${id}`),
  update: (id, data) => apiClient.put(`/api/follow-ups/${id}`, data),
  resolve: (id, data) => apiClient.post(`/api/follow-ups/${id}/resolve`, data),
  delete: (id) => apiClient.delete(`/api/follow-ups/${id}`),
};

// 13. Audit Log API
export const auditLogApi = {
  getAll: (params) => apiClient.get('/api/audit-logs', params),
  create: (data) => apiClient.post('/api/audit-logs', data),
};

// 14. Resource API
export const resourceApi = {
  getAll: (params) => apiClient.get('/api/resources', params),
  getById: (id) => apiClient.get(`/api/resources/${id}`),
  create: (data) => apiClient.post('/api/resources', data),
  update: (id, data) => apiClient.put(`/api/resources/${id}`, data),
  delete: (id) => apiClient.delete(`/api/resources/${id}`),
};

// Unified Export
export const eccdApi = {
  user: userApi,
  role: roleApi,
  worker: workerApi,
  barangay: barangayApi,
  dayCareCenter: dayCareCenterApi,
  mappingActivity: mappingActivityApi,
  household: householdApi,
  child: childApi,
  enrollment: enrollmentApi,
  healthMonitoring: healthMonitoringApi,
  developmentAssessment: developmentAssessmentApi,
  followUp: followUpApi,
  auditLog: auditLogApi,
  resource: resourceApi,
};

export default eccdApi;
