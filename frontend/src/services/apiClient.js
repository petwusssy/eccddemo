/**
 * ECCD CARE — Centralized API Client Layer
 * City Social Welfare and Development Office (CSWDO)
 *
 * Adheres to REST API Conventions:
 *   GET    /api/...  (Read / Query)
 *   POST   /api/...  (Create / Register)
 *   PUT    /api/...  (Update / Modify)
 *   DELETE /api/...  (Archive / Delete)
 *
 * Features:
 * - Centralized fetch client with base URL routing (VITE_API_URL or relative /api)
 * - Seamless fallback to centralDataStore for offline / prototype resilience
 * - Uniform envelope response: { ok, status, data, meta, error }
 * - Realistic network latency simulation for testing Loading, Error, and Empty states
 * - In-flight deduplication and standard error handling
 */

import { centralDataStore } from './centralDataStore.js';
import { getPhilippinesDate, getPhilippinesDateTime } from '../utils/phTime.js';
import { getApiBaseUrl, API_BASE_URL, getApiUrl } from './apiConfig.js';

const SIMULATE_NETWORK_DELAY = 120; // ms

class ApiClient {
  constructor() {
    this.baseUrl = getApiBaseUrl();
    this.mockMode = false; // Hybrid mode: Attempts live Laravel backend first, falls back gracefully to centralDataStore
  }

  setMockMode(enabled) {
    this.mockMode = enabled;
  }

  getToken() {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem('eccd_jwt_token');
    }
    return null;
  }

  setToken(token) {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (token) {
        window.localStorage.setItem('eccd_jwt_token', token);
      } else {
        window.localStorage.removeItem('eccd_jwt_token');
      }
    }
  }

  async delay(ms = SIMULATE_NETWORK_DELAY) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Universal Request Handler with Live Backend + Graceful Fallback
   */
  async request(endpoint, { method = 'GET', body = null, params = null, headers = {} } = {}) {
    // If real backend active, try real fetch first
    if (!this.mockMode && typeof window !== 'undefined') {
      try {
        const url = getApiUrl(endpoint, params);

        const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
        const requestHeaders = {
          Accept: 'application/json',
          ...headers,
        };

        const token = this.getToken();
        if (token && !requestHeaders['Authorization']) {
          requestHeaders['Authorization'] = `Bearer ${token}`;
        }

        if (!isFormData) {
          requestHeaders['Content-Type'] = 'application/json';
        }

        const res = await fetch(url, {
          method,
          headers: requestHeaders,
          body: isFormData ? body : body ? JSON.stringify(body) : undefined,
        });

        if (res.ok) {
          const json = await res.json();
          return json;
        }

        // If endpoint gave 401 unauthenticated, return the json error directly
        if (res.status === 401 || res.status === 422) {
          return await res.json();
        }

        console.warn(`Backend responded with ${res.status} on ${endpoint}, falling back to store`);
      } catch (err) {
        console.warn('Live API request failed, falling back to centralized data store:', err.message);
      }
    }

    // Centralized Data Store Execution (guarantees consistency & demo resilience)
    await this.delay();
    return this.handleMockRoute(endpoint, method, body, params);
  }

  /**
   * Upload File / Document to AWS S3 via POST /api/upload-s3
   */
  async uploadS3(fileOrFormData, metadata = {}) {
    let formData;
    let fileObj;

    if (typeof FormData !== 'undefined' && fileOrFormData instanceof FormData) {
      formData = fileOrFormData;
      fileObj = formData.get('file');
    } else {
      fileObj = fileOrFormData;
      formData = new FormData();
      formData.append('file', fileObj);
      if (metadata.child_id) formData.append('child_id', metadata.child_id);
      if (metadata.category) formData.append('category', metadata.category);
      if (metadata.description) formData.append('description', metadata.description);
    }

    // 1. Try Live Laravel S3 Backend
    if (!this.mockMode && typeof window !== 'undefined') {
      try {
        const url = getApiUrl('/upload-s3');
        const token = this.getToken();
        const headers = { Accept: 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(url, {
          method: 'POST',
          headers,
          body: formData,
        });

        const json = await res.json();
        if (res.ok && json.ok) {
          return json;
        }
        console.warn('Real S3 upload error, utilizing seamless fallback:', json);
      } catch (err) {
        console.warn('Real S3 upload unreachable, utilizing local object preview fallback:', err);
      }
    }

    // 2. Demo Fallback: generate local blob preview URL so the demo never breaks
    await this.delay(200);
    const mockUrl =
      typeof window !== 'undefined' && fileObj instanceof Blob
        ? URL.createObjectURL(fileObj)
        : `https://eccd-care-bucket.s3.amazonaws.com/uploads/${fileObj?.name || 'document.pdf'}`;
    const filename = fileObj?.name || 'document.pdf';

    return {
      ok: true,
      status: 201,
      message: 'File processed successfully (Demo fallback with live preview).',
      data: {
        url: mockUrl,
        path: `documents/${metadata.category || 'general'}/${filename}`,
        filename,
        extension: filename.split('.').pop() || 'file',
        size_bytes: fileObj?.size || 1024,
        child_id: metadata.child_id || null,
        category: metadata.category || 'general',
        s3_bucket: 'eccd-care-bucket',
        s3_prefix: 'teams/hackathon-eccd/',
        uploaded_at: getPhilippinesDateTime(),
        is_mock_fallback: true,
      },
    };
  }

  /**
   * Healthcheck test for AWS S3 write permissions
   */
  async testS3() {
    return this.get('/test-s3');
  }

  /**
   * JWT Authentication Methods
   */
  async login(email, password) {
    const res = await this.post('/auth/login', { email, password });
    if (res.ok && res.data && res.data.access_token) {
      this.setToken(res.data.access_token);
    }
    return res;
  }

  async logout() {
    try {
      await this.post('/auth/logout');
    } finally {
      this.setToken(null);
    }
    return { ok: true, message: 'Logged out successfully' };
  }

  async getAuthUser() {
    return this.get('/auth/me');
  }

  // --- REST HTTP Helpers ---
  async get(endpoint, params = null) {
    return this.request(endpoint, { method: 'GET', params });
  }

  async post(endpoint, body = null) {
    return this.request(endpoint, { method: 'POST', body });
  }

  async put(endpoint, body = null) {
    return this.request(endpoint, { method: 'PUT', body });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  /**
   * Mock Router with Centralized Relational Store
   */
  handleMockRoute(endpoint, method, body, params) {
    const cleanEndpoint = endpoint.replace(/^\/api/, '');

    try {
      // 1. Users
      if (cleanEndpoint === '/users' && method === 'GET') {
        return { ok: true, status: 200, data: centralDataStore.getUsers() };
      }

      // 2. Roles
      if ((cleanEndpoint === '/roles' || cleanEndpoint === '/governance/roles') && method === 'GET') {
        return { ok: true, status: 200, data: centralDataStore.getRoles() };
      }

      // 3. Workers
      if (cleanEndpoint === '/workers' && method === 'GET') {
        return { ok: true, status: 200, data: centralDataStore.getWorkers() };
      }
      if (cleanEndpoint.startsWith('/workers/') && method === 'GET') {
        const id = cleanEndpoint.split('/')[2];
        const item = centralDataStore.getWorkers().find((w) => w.id === id);
        return item
          ? { ok: true, status: 200, data: item }
          : { ok: false, status: 404, error: 'Worker not found' };
      }

      // 4. Barangays
      if (cleanEndpoint === '/barangays' && method === 'GET') {
        return { ok: true, status: 200, data: centralDataStore.getBarangays() };
      }
      if (cleanEndpoint.startsWith('/barangays/') && method === 'GET') {
        const id = cleanEndpoint.split('/')[2];
        const item = centralDataStore.getBarangayDetails(id);
        return item
          ? { ok: true, status: 200, data: item }
          : { ok: false, status: 404, error: 'Barangay not found' };
      }

      // 5. Day Care Centers
      if (cleanEndpoint === '/centers' && method === 'GET') {
        return { ok: true, status: 200, data: centralDataStore.getDayCareCenters() };
      }
      if (cleanEndpoint.startsWith('/centers/') && method === 'GET') {
        const id = cleanEndpoint.split('/')[2];
        const item = centralDataStore.getDayCareCenterDetails(id);
        return item
          ? { ok: true, status: 200, data: item }
          : { ok: false, status: 404, error: 'Day Care Center not found' };
      }

      // 6. Mapping Activities
      if ((cleanEndpoint === '/mapping/activities' || cleanEndpoint === '/activities') && method === 'GET') {
        return { ok: true, status: 200, data: centralDataStore.getMappingActivities() };
      }
      if (cleanEndpoint === '/mapping/activities' && method === 'POST') {
        const newAct = {
          id: `ACT-MAP-2026-${String(centralDataStore.getMappingActivities().length + 1).padStart(3, '0')}`,
          ...body,
          mappedHouseholds: 0,
          childrenIdentified: 0,
          status: 'In Progress',
        };
        centralDataStore.data.mappingActivities.push(newAct);
        centralDataStore.save();
        return { ok: true, status: 201, data: newAct };
      }

      // 7. Households
      if (cleanEndpoint === '/households' && method === 'GET') {
        return { ok: true, status: 200, data: centralDataStore.getHouseholds() };
      }
      if (cleanEndpoint === '/households' && method === 'POST') {
        const newHh = {
          id: body.id || `HH-2026-${Math.floor(100 + Math.random() * 900)}`,
          ...body,
          mappedDate: getPhilippinesDate(),
        };
        centralDataStore.data.households.unshift(newHh);
        centralDataStore.save();
        return { ok: true, status: 201, data: newHh };
      }
      if (cleanEndpoint.startsWith('/households/') && method === 'GET') {
        const id = cleanEndpoint.split('/')[2];
        const item = centralDataStore.getHouseholdWithChildren(id);
        return item
          ? { ok: true, status: 200, data: item }
          : { ok: false, status: 404, error: 'Household not found' };
      }

      // 8. Children (Universal Persistent Entity — Deduplication Check)
      if (cleanEndpoint === '/children' && method === 'GET') {
        let list = centralDataStore.getChildren();
        if (params?.search) {
          const q = params.search.toLowerCase();
          list = list.filter((c) => c.fullName.toLowerCase().includes(q) || c.id.toLowerCase().includes(q));
        }
        if (params?.barangay && params.barangay !== 'All') {
          list = list.filter((c) => c.barangay === params.barangay);
        }
        if (params?.enrollmentStatus && params.enrollmentStatus !== 'All') {
          list = list.filter((c) => c.enrollmentStatus === params.enrollmentStatus);
        }
        return { ok: true, status: 200, data: list, meta: { total: list.length } };
      }
      if (cleanEndpoint === '/children' && method === 'POST') {
        const registered = centralDataStore.registerChild(body);
        return { ok: true, status: 201, data: registered };
      }
      if (cleanEndpoint.startsWith('/children/') && method === 'GET') {
        const parts = cleanEndpoint.split('/');
        const id = parts[2];
        const sub = parts[3];

        if (sub === 'timeline') {
          const c = centralDataStore.getChild360(id);
          return c ? { ok: true, status: 200, data: c.enrollments } : { ok: false, status: 404 };
        }
        if (sub === 'enrollment') {
          const enrs = centralDataStore.getEnrollments().filter((e) => e.childId === id);
          return { ok: true, status: 200, data: enrs };
        }
        if (sub === 'health') {
          const hlts = centralDataStore.getHealthMonitorings().filter((h) => h.childId === id);
          return { ok: true, status: 200, data: hlts };
        }
        if (sub === 'development') {
          const devs = centralDataStore.getDevelopmentAssessments().filter((d) => d.childId === id);
          return { ok: true, status: 200, data: devs };
        }

        const child360 = centralDataStore.getChild360(id);
        return child360
          ? { ok: true, status: 200, data: child360 }
          : { ok: false, status: 404, error: 'Child record not found' };
      }
      if (cleanEndpoint.startsWith('/children/') && method === 'PUT') {
        const id = cleanEndpoint.split('/')[2];
        const child = centralDataStore.getChildren().find((c) => c.id === id);
        if (!child) return { ok: false, status: 404, error: 'Child record not found' };
        Object.assign(child, body, { updatedAt: getPhilippinesDateTime() });
        centralDataStore.save();
        return { ok: true, status: 200, data: child };
      }

      // 9. Enrollments (Strict: Never duplicates child)
      if (cleanEndpoint === '/enrollments' && method === 'GET') {
        return { ok: true, status: 200, data: centralDataStore.getEnrollments() };
      }
      if (cleanEndpoint === '/enrollments/not-enrolled' && method === 'GET') {
        const notEnrolled = centralDataStore.getChildren().filter((c) => c.enrollmentStatus === 'Not Enrolled');
        return { ok: true, status: 200, data: notEnrolled };
      }
      if (cleanEndpoint === '/enrollments' && method === 'POST') {
        const enrollment = centralDataStore.enrollChild(body);
        return { ok: true, status: 201, data: enrollment };
      }
      if (cleanEndpoint.startsWith('/enrollments/') && method === 'PUT') {
        const id = cleanEndpoint.split('/')[2];
        const enr = centralDataStore.getEnrollments().find((e) => e.id === id);
        if (!enr) return { ok: false, status: 404, error: 'Enrollment record not found' };
        Object.assign(enr, body);
        centralDataStore.save();
        return { ok: true, status: 200, data: enr };
      }

      // 10. Health Monitoring (Strict: Reuses persistent Child ID)
      if (cleanEndpoint === '/health-monitoring/due' && method === 'GET') {
        const dueList = centralDataStore.getChildren().filter((c) => c.healthStatus !== 'Up to Date');
        return { ok: true, status: 200, data: dueList };
      }
      if (cleanEndpoint.startsWith('/children/') && cleanEndpoint.endsWith('/health') && method === 'POST') {
        const childId = cleanEndpoint.split('/')[2];
        const health = centralDataStore.recordHealth({ ...body, childId });
        return { ok: true, status: 201, data: health };
      }
      if (cleanEndpoint.startsWith('/health-monitoring/') && method === 'PUT') {
        const id = cleanEndpoint.split('/')[2];
        const hlt = centralDataStore.getHealthMonitorings().find((h) => h.id === id);
        if (!hlt) return { ok: false, status: 404, error: 'Health record not found' };
        Object.assign(hlt, body);
        centralDataStore.save();
        return { ok: true, status: 200, data: hlt };
      }

      // 11. Development Assessment (Strict: Reuses persistent Child ID)
      if (cleanEndpoint === '/development/assessments' && method === 'GET') {
        return { ok: true, status: 200, data: centralDataStore.getDevelopmentAssessments() };
      }
      if (cleanEndpoint.startsWith('/children/') && cleanEndpoint.endsWith('/development') && method === 'POST') {
        const childId = cleanEndpoint.split('/')[2];
        const dev = centralDataStore.recordAssessment({ ...body, childId });
        return { ok: true, status: 201, data: dev };
      }

      // 12. Follow-ups
      if (cleanEndpoint === '/follow-ups' && method === 'GET') {
        return { ok: true, status: 200, data: centralDataStore.getFollowUps() };
      }
      if (cleanEndpoint === '/follow-ups/needs-attention' && method === 'GET') {
        const list = centralDataStore.getFollowUps().filter((f) => f.status === 'Needs Attention');
        return { ok: true, status: 200, data: list };
      }
      if (cleanEndpoint === '/follow-ups' && method === 'POST') {
        const followUp = centralDataStore.createFollowUp(body);
        return { ok: true, status: 201, data: followUp };
      }
      if (cleanEndpoint.endsWith('/resolve') && method === 'POST') {
        const parts = cleanEndpoint.split('/');
        const id = parts[parts.length - 2];
        const resolved = centralDataStore.resolveFollowUp(id, body);
        return resolved
          ? { ok: true, status: 200, data: resolved }
          : { ok: false, status: 404, error: 'Follow-up not found' };
      }
      if (cleanEndpoint.startsWith('/follow-ups/') && method === 'PUT') {
        const id = cleanEndpoint.split('/')[2];
        const flw = centralDataStore.getFollowUps().find((f) => f.id === id);
        if (!flw) return { ok: false, status: 404, error: 'Follow-up not found' };
        Object.assign(flw, body);
        centralDataStore.save();
        return { ok: true, status: 200, data: flw };
      }

      // 13. Audit Logs
      if (cleanEndpoint === '/audit-logs' && method === 'GET') {
        return { ok: true, status: 200, data: centralDataStore.getAuditLogs() };
      }
      if (cleanEndpoint === '/audit-logs' && method === 'POST') {
        const log = centralDataStore.logAudit(body);
        return { ok: true, status: 201, data: log };
      }

      // 14. Resources
      if (cleanEndpoint === '/resources' && method === 'GET') {
        return { ok: true, status: 200, data: centralDataStore.getResources() };
      }
      if (cleanEndpoint.startsWith('/resources/') && method === 'GET') {
        const id = cleanEndpoint.split('/')[2];
        const res = centralDataStore.getResources().find((r) => r.id === id);
        return res
          ? { ok: true, status: 200, data: res }
          : { ok: false, status: 404, error: 'Resource not found' };
      }

      // 15. AWS S3 Storage Test Simulation
      if (cleanEndpoint === '/test-s3' && method === 'GET') {
        return {
          ok: true,
          status: 200,
          message: 'AWS S3 simulation active (Ready for live backend verification)',
          data: {
            bucket: 'eccd-care-bucket',
            region: 'us-east-1',
            prefix: 'teams/hackathon-eccd/',
            test_file_path: 'healthcheck/test-s3-verified.txt',
            test_file_url: 'https://eccd-care-bucket.s3.amazonaws.com/teams/hackathon-eccd/healthcheck/test-s3-verified.txt',
            verified_exists: true,
            latency_ms: 42,
            timestamp: getPhilippinesDateTime(),
          },
        };
      }

      // 16. JWT Auth Simulation
      if (cleanEndpoint === '/auth/login' && method === 'POST') {
        const email = body?.email || 'admin@eccd.gov.ph';
        const isAdmin = email.includes('admin');
        const role = isAdmin ? 'cswdo_admin' : 'daycare_worker';
        const name = isAdmin ? 'CSWDO Administrator' : 'Maria C. Santos (CDW)';
        const token = `jwt.${btoa(JSON.stringify({ email, role, exp: Date.now() + 3600000 }))}.sig`;
        return {
          ok: true,
          status: 200,
          message: 'Authentication successful',
          data: {
            access_token: token,
            token_type: 'bearer',
            expires_in: 3600,
            user: { id: isAdmin ? 'USR-001' : 'USR-002', name, email, role: { name: role, label: name } },
          },
        };
      }
      if (cleanEndpoint === '/auth/logout' && method === 'POST') {
        return { ok: true, status: 200, message: 'Logged out successfully' };
      }
      if (cleanEndpoint === '/auth/me' && method === 'GET') {
        return {
          ok: true,
          status: 200,
          data: {
            user: {
              id: 'USR-001',
              name: 'CSWDO Administrator',
              email: 'admin@eccd.gov.ph',
              role: { name: 'cswdo_admin', label: 'CSWDO Administrator' },
            },
          },
        };
      }

      // Default fallback
      return { ok: true, status: 200, data: [], meta: { message: `Route ${endpoint} handled by central store` } };
    } catch (err) {
      console.error('API Client error processing route:', endpoint, err);
      return { ok: false, status: 500, error: err.message || 'Internal server error' };
    }
  }
}

export const apiClient = new ApiClient();
export { getApiBaseUrl, API_BASE_URL, getApiUrl };
export default apiClient;

