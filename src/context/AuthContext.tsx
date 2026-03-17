// src/context/AuthContext.tsx
import { googleLogout } from '@react-oauth/google'; // if using @react-oauth/google
import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useReducer,
} from 'react';
  
  // ────────────────────────────────────────────────
  // Types
  // ────────────────────────────────────────────────
  
  interface User {
    id: string;
    email: string;
    name?: string;
    picture?: string;
    role?: 'user' | 'admin';
    // add any other fields your backend returns
  }
  
  interface AuthState {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    error: string | null;
  }
  
  type AuthAction =
    | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
    | { type: 'LOGIN_FAILURE'; payload: string }
    | { type: 'LOGOUT' }
    | { type: 'SET_LOADING'; payload: boolean };
  
  interface AuthContextValue extends AuthState {
    login: (email: string, password: string) => Promise<void>;
    loginWithGoogle: (credential: string) => Promise<void>; // Google ID token
    logout: () => void;
    refreshToken?: () => Promise<void>; // optional – if you implement refresh
  }
  
  // ────────────────────────────────────────────────
  // Reducer
  // ────────────────────────────────────────────────
  
  const initialState: AuthState = {
    user: null,
    token: null,
    isLoading: true, // start as loading → check token on mount
    error: null,
  };
  
  function authReducer(state: AuthState, action: AuthAction): AuthState {
    switch (action.type) {
      case 'LOGIN_SUCCESS':
        return {
          ...state,
          user: action.payload.user,
          token: action.payload.token,
          isLoading: false,
          error: null,
        };
      case 'LOGIN_FAILURE':
        return {
          ...state,
          isLoading: false,
          error: action.payload,
        };
      case 'LOGOUT':
        return {
          ...initialState,
          isLoading: false,
        };
      case 'SET_LOADING':
        return {
          ...state,
          isLoading: action.payload,
        };
      default:
        return state;
    }
  }
  
  // ────────────────────────────────────────────────
  // Context
  // ────────────────────────────────────────────────
  
  const AuthContext = createContext<AuthContextValue | undefined>(undefined);
  
  interface AuthProviderProps {
    children: ReactNode;
  }
  
  export function AuthProvider({ children }: AuthProviderProps) {
    const [state, dispatch] = useReducer(authReducer, initialState);
  
    // Load user from localStorage on mount
    useEffect(() => {
      const loadAuth = () => {
        try {
          const storedToken = localStorage.getItem('token');
          const storedUser = localStorage.getItem('user');
  
          if (storedToken && storedUser) {
            const user = JSON.parse(storedUser) as User;
            dispatch({
              type: 'LOGIN_SUCCESS',
              payload: { user, token: storedToken },
            });
          } else {
            dispatch({ type: 'SET_LOADING', payload: false });
          }
        } catch (err) {
          console.error('Failed to parse stored auth data', err);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      };
  
      loadAuth();
    }, []);
  
    // Save to localStorage when auth changes
    useEffect(() => {
      if (state.token && state.user) {
        localStorage.setItem('token', state.token);
        localStorage.setItem('user', JSON.stringify(state.user));
      } else if (!state.isLoading) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }, [state.token, state.user, state.isLoading]);
  
    const login = useCallback(async (email: string, password: string) => {
      dispatch({ type: 'SET_LOADING', payload: true });
  
      try {
        // Replace with your real API call
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
  
        if (!res.ok) throw new Error('Login failed');
  
        const data = await res.json();
        const { user, token } = data;
  
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user, token },
        });
      } catch (err: any) {
        dispatch({
          type: 'LOGIN_FAILURE',
          payload: err.message || 'Something went wrong',
        });
      }
    }, []);
  
    const loginWithGoogle = useCallback(async (credential: string) => {
      dispatch({ type: 'SET_LOADING', payload: true });
  
      try {
        // Replace with your real backend endpoint
        // credential = Google ID token from @react-oauth/google
        const res = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken: credential }),
        });
  
        if (!res.ok) throw new Error('Google login failed');
  
        const data = await res.json();
        const { user, token } = data;
  
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user, token },
        });
      } catch (err: any) {
        dispatch({
          type: 'LOGIN_FAILURE',
          payload: err.message || 'Google login failed',
        });
      }
    }, []);
  
    const logout = useCallback(() => {
      // If using @react-oauth/google
      googleLogout();
  
      dispatch({ type: 'LOGOUT' });
    }, []);
  
    const value: AuthContextValue = {
      ...state,
      login,
      loginWithGoogle,
      logout,
    };
  
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
  }
  
  // ────────────────────────────────────────────────
  // Hook
  // ────────────────────────────────────────────────
  
  export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
      throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
  }