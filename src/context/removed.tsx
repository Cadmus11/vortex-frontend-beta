import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
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

const TOKEN_REFRESH_INTERVAL = 13 * 60 * 1000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshIntervalId, setRefreshIntervalId] = useState<number | null>(null);

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

  const fetchCurrentUser = useCallback(async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          const refreshed = await refreshToken();
          if (refreshed) {
            const storedToken = localStorage.getItem('accessToken');
            if (storedToken) {
              return fetchCurrentUser(storedToken);
            }
          }
        }
        return null;
      }

      const data = await response.json();
      if (data.success && data.user) {
        return data.user;
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch current user:', error);
      return null;
    }
  }, [refreshToken]);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('accessToken');
      
      if (storedToken) {
        setAccessToken(storedToken);
        const currentUser = await fetchCurrentUser(storedToken);
        if (currentUser) {
          setUser(currentUser);
        } else {
          localStorage.removeItem('accessToken');
          setAccessToken(null);
        }
      } else {
        const refreshed = await refreshToken();
        if (refreshed) {
          const newToken = localStorage.getItem('accessToken');
          if (newToken) {
            const currentUser = await fetchCurrentUser(newToken);
            if (currentUser) {
              setUser(currentUser);
            }
          }
        }
      }
      
      setIsLoading(false);
    };

    initAuth();
  }, [fetchCurrentUser, refreshToken]);

  useEffect(() => {
    if (user && accessToken) {
      if (refreshIntervalId) {
        clearInterval(refreshIntervalId);
      }
      
      const intervalId = window.setInterval(() => {
        refreshToken();
      }, TOKEN_REFRESH_INTERVAL);
      
      setRefreshIntervalId(intervalId);
      
      return () => {
        if (intervalId) {
          clearInterval(intervalId);
        }
      };
    }
  }, [user, accessToken, refreshToken, refreshIntervalId]);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Login failed');
      }

      setUser(data.user);
      setAccessToken(data.accessToken);
      localStorage.setItem('accessToken', data.accessToken);
      return true;
    } catch {
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, role: 'admin' | 'voter' = 'voter') => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password, role }),
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Registration failed');
      }

      setUser(data.user);
      setAccessToken(data.accessToken);
      localStorage.setItem('accessToken', data.accessToken);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      if (refreshIntervalId) {
        clearInterval(refreshIntervalId);
        setRefreshIntervalId(null);
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
