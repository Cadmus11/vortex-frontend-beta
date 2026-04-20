import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { API_URL } from '@/config/api';

export interface User {
  id: string;
  email: string;
  username: string;
  role: 'admin' | 'voter';
  isVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, role?: 'admin' | 'voter') => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_REFRESH_INTERVAL = 13 * 60 * 1000; // 13 minutes

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const intervalIdRef = useRef<number | null>(null);

  // Refresh token
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        setUser(null);
        setAccessToken(null);
        localStorage.removeItem('accessToken');
        return false;
      }

      const data = await response.json();
      if (data.success && data.accessToken) {
        setAccessToken(data.accessToken);
        localStorage.setItem('accessToken', data.accessToken);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('accessToken');
      return false;
    }
  }, []);

  // Fetch current user
  const fetchCurrentUser = useCallback(async (token: string): Promise<User | null> => {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        return data.success && data.user ? data.user : null;
      }

      if (response.status === 401) {
        const refreshed = await refreshToken();
        if (refreshed) {
          const newToken = localStorage.getItem('accessToken');
          if (newToken) {
            return fetchCurrentUser(newToken); // recursive but safe now
          }
        }
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch user:', error);
      return null;
    }
  }, [refreshToken]);

  // Initialize auth (runs once)
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      const storedToken = localStorage.getItem('accessToken');

      let currentUser = null;

      if (storedToken) {
        setAccessToken(storedToken);
        currentUser = await fetchCurrentUser(storedToken);
      } else {
        const refreshed = await refreshToken();
        if (refreshed) {
          const newToken = localStorage.getItem('accessToken');
          if (newToken) {
            currentUser = await fetchCurrentUser(newToken);
          }
        }
      }

      if (mounted) {
        if (currentUser) {
          setUser(currentUser);
        } else {
          setUser(null);
          setAccessToken(null);
          localStorage.removeItem('accessToken');
        }
        setIsLoading(false);
      }
    };

    initAuth();

    return () => { mounted = false; };
  }, [fetchCurrentUser, refreshToken]);

  // Token refresh interval
  useEffect(() => {
    if (!user || !accessToken) {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
      return;
    }

    const id = window.setInterval(() => {
      refreshToken();
    }, TOKEN_REFRESH_INTERVAL);

    intervalIdRef.current = id;

    return () => clearInterval(id);
  }, [user, accessToken, refreshToken]);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Login failed');

      setUser(data.user);
      setAccessToken(data.accessToken);
      localStorage.setItem('accessToken', data.accessToken);
      return true;
    } catch (err) {
      console.error(err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, role: 'admin' | 'voter' = 'voter') => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, role }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Registration failed');

      setUser(data.user);
      setAccessToken(data.accessToken);
      localStorage.setItem('accessToken', data.accessToken);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch (e) {
      console.error(e);
    } finally {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('accessToken');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        isAuthenticated: !!user && !!accessToken,
        login,
        register,
        logout,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}