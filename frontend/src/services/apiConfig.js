/**
 * ECCD CARE — API Environment Configuration & Dynamic Base URL Resolver
 * City Social Welfare and Development Office (CSWDO)
 *
 * Provides a single source of truth for the API base URL:
 * - Dynamically evaluates import.meta.env.VITE_API_URL
 * - Graceful fallback to 'http://127.0.0.1:8000'
 * - Eliminates hardcoded relative paths (e.g. '/api/...') to prevent 404 errors on Vercel deployments
 * - Normalizes endpoints, stripping redundant '/api' or trailing slashes
 */

/**
 * Get the configured dynamic API base URL.
 * Priority:
 * 1. User runtime setting in localStorage (enables phone/Vercel to point to laptop IP or tunnel)
 * 2. Vite build-time env VITE_API_URL
 * 3. Localhost fallback http://127.0.0.1:8000
 * @returns {string} Normalized base URL without trailing slash
 */
export function getApiBaseUrl() {
  if (typeof window !== 'undefined' && window.localStorage) {
    const customUrl = window.localStorage.getItem('eccd_backend_api_url');
    if (customUrl && typeof customUrl === 'string' && customUrl.trim() !== '') {
      return customUrl.trim().replace(/\/+$/, '');
    }
  }

  const envUrl =
    typeof import.meta !== 'undefined' &&
    import.meta.env &&
    import.meta.env.VITE_API_URL;

  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    return envUrl.trim().replace(/\/+$/, '');
  }

  // If running in browser on a mobile device or LAN host (e.g. 192.168.x.x)
  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname;
    const isRemote = host !== 'localhost' && host !== '127.0.0.1';
    if (isRemote) {
      // In dev mode, Vite runs on this host (e.g. port 5173) and proxies /api directly to the Laravel backend (127.0.0.1:8000).
      // Using window.location.origin guarantees mobile phones make API requests to http://192.168.x.x:5173/api/...
      // which Vite dev server seamlessly forwards to Laravel!
      return window.location.origin;
    }
  }

  return 'http://127.0.0.1:8000';
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
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  const isRemote = host !== 'localhost' && host !== '127.0.0.1';
  const currentBase = getApiBaseUrl();
  const pointsToLocalhost = currentBase.includes('127.0.0.1') || currentBase.includes('localhost');
  return isRemote && pointsToLocalhost;
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

export default {
  getApiBaseUrl,
  API_BASE_URL,
  getApiUrl,
  setCustomApiUrl,
  clearCustomApiUrl,
  isUsingLocalhostOnRemote,
};
