import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { API_URL } from '../config/api';

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

interface UseFetchOptions<T> {
  immediate?: boolean;
  cache?: boolean;
  cacheTime?: number;
  headers?: Record<string, string>;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  auth?: boolean;
}

const globalCache = new Map<string, { data: unknown; expiresAt: number }>();

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (isRefreshing) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        localStorage.removeItem('accessToken');
        return null;
      }

      const data = await res.json();
      localStorage.setItem('accessToken', data.accessToken);
      return data.accessToken;
    } catch {
      localStorage.removeItem('accessToken');
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export function useFetch<T>(endpoint: string, options: UseFetchOptions<T> = {}) {
  const {
    immediate = true,
    cache = true,
    cacheTime = 5 * 60 * 1000,
    headers,
    onSuccess,
    onError,
    auth = true,
  } = options;

  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: immediate,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const cacheKey = useMemo(() => `${API_URL}${endpoint}`, [endpoint]);

  const fetchData = useCallback(async (body?: unknown, method: string = 'GET') => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    if (cache && method === 'GET') {
      const cached = globalCache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        setState({ data: cached.data as T, loading: false, error: null });
        onSuccess?.(cached.data as T);
        return cached.data as T;
      }
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const accessToken = auth ? localStorage.getItem('accessToken') : null;
      
      const res = await fetch(`${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          ...headers,
        },
        credentials: 'include',
        body: body ? JSON.stringify(body) : undefined,
        signal: abortControllerRef.current.signal,
      });

      if (res.status === 401 && auth) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          const retryRes = await fetch(`${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`, {
            method,
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${newToken}`,
              ...headers,
            },
            credentials: 'include',
            body: body ? JSON.stringify(body) : undefined,
            signal: abortControllerRef.current.signal,
          });
          
          if (!retryRes.ok) {
            throw new Error((await retryRes.json().catch(() => ({}))).error || 'Request failed');
          }
          
          const data = await retryRes.json();
          if (cache && method === 'GET') {
            globalCache.set(cacheKey, { data, expiresAt: Date.now() + cacheTime });
          }
          setState({ data, loading: false, error: null });
          onSuccess?.(data);
          return data;
        }
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return null;
      }

      if (!res.ok) {
        throw new Error((await res.json().catch(() => ({}))).error || 'Request failed');
      }

      const data = await res.json();
      
      if (cache && method === 'GET') {
        globalCache.set(cacheKey, { data, expiresAt: Date.now() + cacheTime });
      }

      setState({ data, loading: false, error: null });
      onSuccess?.(data);
      return data;
    } catch (error) {
      if ((error as Error).name === 'AbortError') return null;
      const err = error as Error;
      setState({ data: null, loading: false, error: err });
      onError?.(err);
      return null;
    }
  }, [endpoint, cache, cacheTime, headers, onSuccess, onError, cacheKey, auth]);

  const get = useCallback(() => fetchData(undefined, 'GET'), [fetchData]);
  const post = useCallback((body?: unknown) => fetchData(body, 'POST'), [fetchData]);
  const put = useCallback((body?: unknown) => fetchData(body, 'PUT'), [fetchData]);
  const del = useCallback(() => fetchData(undefined, 'DELETE'), [fetchData]);

  useEffect(() => {
    if (immediate) {
      get();
    }
  }, [immediate, get]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [endpoint]);

  return {
    ...state,
    get,
    post,
    put,
    del,
    refresh: get,
  };
}

export function clearCache(key?: string) {
  if (key) {
    globalCache.delete(`${API_URL}${key.startsWith('/') ? key : `/${key}`}`);
  } else {
    globalCache.clear();
  }
}

export default useFetch;