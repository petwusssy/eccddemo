/**
 * ECCD CARE — API Environment Configuration & Dynamic Base URL Resolver
 * City Social Welfare and Development Office (CSWDO)
 *
 * Provides a single source of truth for the API base URL:
 * - Dynamically evaluates import.meta.env.VITE_API_URL
 * - Points directly to live Render backend: https://eccd-backend-cpal.onrender.com
 * - Eliminates hardcoded relative paths (e.g. '/api/...') to prevent 404 errors on Vercel deployments
 * - Normalizes endpoints, stripping redundant '/api' or trailing slashes
 */

/**
 * Get the configured dynamic API base URL.
 * Priority:
 * 1. User runtime setting in localStorage (custom server override)
 * 2. Vite build-time env VITE_API_URL
 * 3. Default Render Production API URL: https://eccd-backend-cpal.onrender.com
 * @returns {string} Normalized base URL without trailing slash
 */
export const DEFAULT_PRODUCTION_API_URL = 'https://eccd-backend-cpal.onrender.com';
export const DEFAULT_PRODUCTION_TUNNEL_URL = DEFAULT_PRODUCTION_API_URL;

export function getApiBaseUrl() {
  if (typeof window !== 'undefined' && window.localStorage) {
    const customUrl = window.localStorage.getItem('eccd_backend_api_url');
    if (customUrl && typeof customUrl === 'string' && customUrl.trim() !== '') {
      const clean = customUrl.trim().replace(/\/+$/, '');
      // Automatically purge stale tunnels or localhosts
      if (clean.includes('ngrok') || clean.includes('loca.lt') || clean.includes('127.0.0.1') || clean.includes('localhost')) {
        window.localStorage.removeItem('eccd_backend_api_url');
      } else {
        return clean;
      }
    }
  }

  const envUrl =
    typeof import.meta !== 'undefined' &&
    import.meta.env &&
    import.meta.env.VITE_API_URL;

  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    return envUrl.trim().replace(/\/+$/, '');
  }

  return DEFAULT_PRODUCTION_API_URL;
}

export function setCustomApiUrl(url) {
  if (typeof window !== 'undefined' && window.localStorage) {
    if (url && typeof url === 'string' && url.trim() !== '') {
      window.localStorage.setItem('eccd_backend_api_url', url.trim().replace(/\/+$/, ''));
    } else {
      window.localStorage.removeItem('eccd_backend_api_url');
    }
    window.dispatchEvent(new CustomEvent('eccd:api-url-changed', { detail: { url: getApiBaseUrl() } }));
  }
}

export function clearCustomApiUrl() {
  setCustomApiUrl('');
}

export function isUsingLocalhostOnRemote() {
  return false;
}

export const API_BASE_URL = getApiBaseUrl();

/**
 * Resolves an API endpoint against the dynamic API Base URL.
 * Guarantees that:
 * 1. The result is always an absolute URL pointing to the live backend (or local dev)
 * 2. No double-slashes or redundant '/api/api/...' paths are formed
 * 3. Query parameters can be passed safely as an object or already within the endpoint string
 *
 * @param {string} endpoint - API path (e.g. '/api/children', '/resources', '/upload-s3')
 * @param {Record<string, any>|null} [params] - Optional query parameters
 * @returns {string} Fully qualified dynamic URL
 */
export function getApiUrl(endpoint = '', params = null) {
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  let url;
  if (baseUrl.endsWith('/api') && cleanEndpoint.startsWith('/api/')) {
    // Avoid baseUrl (/api) + cleanEndpoint (/api/foo) -> /api/api/foo
    url = `${baseUrl}${cleanEndpoint.substring(4)}`;
  } else if (!baseUrl.endsWith('/api') && !cleanEndpoint.startsWith('/api/') && cleanEndpoint !== '/api') {
    // If backend route is defined in Laravel routes/api.php and endpoint didn't include '/api'
    url = `${baseUrl}/api${cleanEndpoint}`;
  } else {
    url = `${baseUrl}${cleanEndpoint}`;
  }

  if (params && typeof params === 'object') {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, val);
      }
    });
    const qs = searchParams.toString();
    if (qs) {
      url += (url.includes('?') ? '&' : '?') + qs;
    }
  }

  return url;
}

let currentBackendConnected = true;
let inFlightHealthCheck = null;
let lastHealthCheckTime = 0;
const HEALTH_CACHE_TTL = 30000; // 30 seconds cache

/**
 * Actively tests connectivity to backend endpoint with short timeout
 * Uses in-flight deduplication and 30-second TTL cache to prevent request flooding
 */
export async function checkBackendHealth(testUrl = null, force = false) {
  const base = testUrl ? testUrl.trim().replace(/\/+$/, '') : getApiBaseUrl();
  const now = Date.now();

  // If using default url and not forced, return cached status if still fresh
  if (!testUrl && !force && (now - lastHealthCheckTime < HEALTH_CACHE_TTL)) {
    return currentBackendConnected;
  }

  // If an in-flight check is already pending for default URL, reuse the promise
  if (!testUrl && inFlightHealthCheck) {
    return inFlightHealthCheck;
  }

  const checkPromise = (async () => {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(`${base}/api/dashboard/summary`, {
        headers: {
          Accept: 'application/json',
        },
        signal: controller.signal,
      });
      clearTimeout(timer);
      const ok = res.ok;
      if (!testUrl) {
        lastHealthCheckTime = Date.now();
        setBackendConnected(ok);
      }
      return ok;
    } catch {
      if (!testUrl) {
        lastHealthCheckTime = Date.now();
        setBackendConnected(false);
      }
      return false;
    } finally {
      if (!testUrl) {
        inFlightHealthCheck = null;
      }
    }
  })();

  if (!testUrl) {
    inFlightHealthCheck = checkPromise;
  }

  return checkPromise;
}

export function isBackendConnected() {
  return currentBackendConnected;
}

export function setBackendConnected(connected) {
  if (currentBackendConnected !== connected) {
    currentBackendConnected = connected;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('eccd:backend-status', {
          detail: { connected, url: getApiBaseUrl() },
        })
      );
    }
  }
}

export default {
  DEFAULT_PRODUCTION_TUNNEL_URL,
  getApiBaseUrl,
  API_BASE_URL,
  getApiUrl,
  setCustomApiUrl,
  clearCustomApiUrl,
  isUsingLocalhostOnRemote,
  checkBackendHealth,
  isBackendConnected,
  setBackendConnected,
};
