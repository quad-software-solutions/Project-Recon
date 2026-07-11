const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

interface RequestConfig extends RequestInit {
  params?: Record<string, string>;
  _isRetry?: boolean;
}

/**
 * Parse error response body from DRF.
 * DRF returns structured JSON errors like:
 *   { "detail": "Invalid credentials." }
 *   { "email": ["This field is required."] }
 */
async function parseErrorBody(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (typeof body === 'string') return body;
    if (body.detail) return body.detail;
    // Collect field-level errors
    const fieldErrors = Object.entries(body)
      .map(([key, val]) => {
        const msgs = Array.isArray(val) ? val.join(', ') : String(val);
        return `${key}: ${msgs}`;
      })
      .join('; ');
    return fieldErrors || `API Error: ${res.status}`;
  } catch {
    return `API Error: ${res.status} ${res.statusText}`;
  }
}

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

async function request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
  const { params, _isRetry, ...init } = config;
  const urlStr = `${BASE_URL}${endpoint}`;
  const url = urlStr.startsWith('http') ? new URL(urlStr) : new URL(urlStr, window.location.origin);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  let token = localStorage.getItem('access_token');
  const isFormData = init.body instanceof FormData;
  const headers: Record<string, string> = isFormData
    ? { ...init.headers as Record<string, string> }
    : { 'Content-Type': 'application/json', ...init.headers as Record<string, string> };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url.toString(), {
    ...init,
    headers,
  });

  if (res.status === 401 && !_isRetry && token) {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const refreshUrl = new URL(`${BASE_URL}/accounts/token/refresh/`, window.location.origin);
          const refreshRes = await fetch(refreshUrl.toString(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh: refreshToken }),
          });

          if (refreshRes.ok) {
            const data = await refreshRes.json();
            localStorage.setItem('access_token', data.access);
            if (data.refresh) {
              localStorage.setItem('refresh_token', data.refresh);
            }
            onRefreshed(data.access);
          } else {
            // Refresh failed, user needs to login again
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('ethio_robotics_user');
            window.dispatchEvent(new CustomEvent('auth:logout'));
          }
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        } finally {
          isRefreshing = false;
        }
      }

      // Wait for refresh to complete and retry
      return new Promise<T>((resolve, reject) => {
        subscribeTokenRefresh((newToken) => {
          // Retry the original request
          config._isRetry = true;
          // The retry will pick up the new token automatically because we don't pass headers with Authorization directly here
          request<T>(endpoint, config).then(resolve).catch(reject);
        });
      });
    }
  }

  if (!res.ok) {
    const message = await parseErrorBody(res);
    throw new Error(message);
  }

  // Handle 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json();
}

export const http = {
  get: <T>(endpoint: string, config?: RequestConfig) =>
    request<T>(endpoint, { ...config, method: 'GET' }),
  post: <T>(endpoint: string, body: unknown, config?: RequestConfig) =>
    request<T>(endpoint, { ...config, method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body) }),
  put: <T>(endpoint: string, body: unknown, config?: RequestConfig) =>
    request<T>(endpoint, { ...config, method: 'PUT', body: body instanceof FormData ? body : JSON.stringify(body) }),
  patch: <T>(endpoint: string, body: unknown, config?: RequestConfig) =>
    request<T>(endpoint, { ...config, method: 'PATCH', body: body instanceof FormData ? body : JSON.stringify(body) }),
  delete: <T>(endpoint: string, config?: RequestConfig) =>
    request<T>(endpoint, { ...config, method: 'DELETE' }),
};
