const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';
import { getToken, setTokens, clearTokens, getRefreshToken } from '@/shared/utils/auth';
import { clearSessionStorage } from '@/shared/utils/storage';

const REQUEST_TIMEOUT = 30_000;

interface RequestConfig extends RequestInit {
  params?: Record<string, string>;
  _isRetry?: boolean;
}

/** Typed API error that preserves HTTP status for 401/403/404 handling. */
export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}

export function isForbiddenError(err: unknown): boolean {
  if (isApiError(err)) return err.status === 403;
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    return msg.includes('permission') || msg.includes('forbidden') || msg.includes('403');
  }
  return false;
}

export function isNotFoundError(err: unknown): boolean {
  if (isApiError(err)) return err.status === 404;
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    return msg.includes('not found') || msg.includes('404');
  }
  return false;
}

/**
 * Parse error response body from DRF.
 * DRF returns structured JSON errors like:
 *   { "detail": "Invalid credentials." }
 *   { "email": ["This field is required."] }
 */
async function parseErrorBody(res: Response): Promise<{ message: string; body: unknown }> {
  try {
    const body = await res.json();
    if (typeof body === 'string') return { message: body, body };
    if (body?.detail) {
      const detail = Array.isArray(body.detail) ? body.detail.join(', ') : String(body.detail);
      return { message: detail, body };
    }
    const fieldErrors = Object.entries(body)
      .map(([key, val]) => {
        const msgs = Array.isArray(val) ? val.join(', ') : String(val);
        return `${key}: ${msgs}`;
      })
      .join('; ');
    return { message: fieldErrors || `API Error: ${res.status}`, body };
  } catch {
    return { message: `API Error: ${res.status} ${res.statusText}`, body: null };
  }
}

function forceLogout(): void {
  clearTokens();
  clearSessionStorage();
  window.dispatchEvent(new CustomEvent('auth:logout'));
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

async function handleTokenRefresh<T>(retryRequest: () => Promise<T>): Promise<T> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    forceLogout();
    throw new ApiError(401, 'Session expired');
  }

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
        setTokens(data.access, data.refresh);
        onRefreshed(data.access);
      } else {
        forceLogout();
        onRefreshed('');
      }
    } catch {
      forceLogout();
      onRefreshed('');
    } finally {
      isRefreshing = false;
    }
  }

  return new Promise<T>((resolve, reject) => {
    subscribeTokenRefresh((newToken) => {
      if (newToken) {
        retryRequest().then(resolve).catch(reject);
      } else {
        reject(new ApiError(401, 'Session expired'));
      }
    });
  });
}

async function request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
  const { params, _isRetry, ...init } = config;
  const urlStr = `${BASE_URL}${endpoint}`;
  const url = urlStr.startsWith('http') ? new URL(urlStr) : new URL(urlStr, window.location.origin);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const token = getToken();
  const headers: Record<string, string> = { ...init.headers as Record<string, string> };

  if (!(init.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!init.signal) {
    init.signal = AbortSignal.timeout(REQUEST_TIMEOUT);
  }

  const res = await fetch(url.toString(), {
    ...init,
    headers,
  });

  // Only refresh+retry on 401 — never on 403/404
  if (res.status === 401 && !_isRetry && token) {
    if (getRefreshToken()) {
      return handleTokenRefresh(() => {
        config._isRetry = true;
        return request<T>(endpoint, config);
      });
    }
    forceLogout();
    throw new ApiError(401, 'Session expired');
  }

  if (!res.ok) {
    const { message, body } = await parseErrorBody(res);
    throw new ApiError(res.status, message, body);
  }

  if (res.status === 204) return undefined as T;

  return res.json();
}

async function requestBlob(endpoint: string, config: RequestConfig = {}): Promise<Blob> {
  const { params, _isRetry, ...init } = config;
  const urlStr = `${BASE_URL}${endpoint}`;
  const url = urlStr.startsWith('http') ? new URL(urlStr) : new URL(urlStr, window.location.origin);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const token = getToken();
  const headers: Record<string, string> = { ...init.headers as Record<string, string> };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!init.signal) {
    init.signal = AbortSignal.timeout(REQUEST_TIMEOUT);
  }

  const res = await fetch(url.toString(), {
    ...init,
    headers,
  });

  if (res.status === 401 && !_isRetry && token) {
    if (getRefreshToken()) {
      return handleTokenRefresh(() => {
        config._isRetry = true;
        return requestBlob(endpoint, config);
      });
    }
    forceLogout();
    throw new ApiError(401, 'Session expired');
  }

  if (!res.ok) {
    const { message, body } = await parseErrorBody(res);
    throw new ApiError(res.status, message, body);
  }

  return res.blob();
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
  downloadBlob: (endpoint: string, config?: RequestConfig) =>
    requestBlob(endpoint, { ...config, method: 'GET' }),
};
