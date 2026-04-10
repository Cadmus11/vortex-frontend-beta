import { useUser, useClerk, UserButton, SignIn, SignUp, RedirectToSignIn, RedirectToSignUp } from '@clerk/clerk-react';
import { useCallback, useEffect, useState } from 'react';
import { API_URL } from "../config/api";

export type User = {
  id: string;
  clerkId: string;
  email: string;
  username: string;
  role: "admin" | "voter";
  isVerified?: boolean;
};

export type AuthContextType = {
  user: User | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  signup: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
  isSyncing: boolean;
  isSignedIn: boolean;
  UserButton: typeof UserButton;
  SignIn: typeof SignIn;
  SignUp: typeof SignUp;
  RedirectToSignIn: typeof RedirectToSignIn;
  RedirectToSignUp: typeof RedirectToSignUp;
};

export { UserButton, SignIn, SignUp, RedirectToSignIn, RedirectToSignUp };

export function useAuth() {
  const { isSignedIn, user: clerkUser, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [backendUser, setBackendUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const login = useCallback(async () => {
    // Clerk handles login via SignIn component
  }, []);

  const logout = useCallback(async () => {
    setBackendUser(null);
    await signOut({ redirectUrl: '/login' });
  }, [signOut]);

  const signup = useCallback(async () => {
    // Clerk handles signup via SignUp component
  }, []);

  const syncWithBackend = useCallback(async (forceRefresh = false) => {
    if (!clerkUser || !clerkUser.id) return;

    if (!forceRefresh && isSyncing) return;

    setIsSyncing(true);
    try {
      const primaryEmail = clerkUser.primaryEmailAddress?.emailAddress 
        || clerkUser.emailAddresses?.[0]?.emailAddress 
        || '';

      const userRes = await fetch(`${API_URL}/auth/clerk-sync`, {
        credentials: "include",
        headers: { 
          'x-clerk-user-id': clerkUser.id,
          'x-clerk-user-email': primaryEmail,
        },
      });
      
      if (userRes.ok) {
        const userData = await userRes.json();
        if (userData.success && userData.user) {
          setBackendUser(userData.user);
        }
      } else {
        console.error('Failed to sync user:', userRes.status);
      }
    } catch (error) {
      console.error('Failed to sync with backend:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [clerkUser, isSyncing]);

  const refreshUser = useCallback(async () => {
    await syncWithBackend(true);
  }, [syncWithBackend]);

  useEffect(() => {
    if (clerkUser?.id) {
      syncWithBackend();
    } else {
      setBackendUser(null);
    }
  }, [clerkUser?.id, syncWithBackend]);

  const mappedUser = (() => {
    if (!clerkUser) return null;

    const primaryEmail = clerkUser.primaryEmailAddress?.emailAddress 
      || clerkUser.emailAddresses?.[0]?.emailAddress 
      || '';

    const role = backendUser?.role || (clerkUser.publicMetadata?.role as 'admin' | 'voter' | undefined) || 'voter';

    const emailVerified = clerkUser.primaryEmailAddress?.verification?.status === 'verified'
      || clerkUser.emailAddresses?.[0]?.verification?.status === 'verified'
      || false;

    const isVerified = backendUser?.isVerified ?? emailVerified;

    return {
      id: backendUser?.id || clerkUser.id,
      clerkId: clerkUser.id,
      email: primaryEmail,
      username: backendUser?.username || clerkUser.username || primaryEmail.split('@')[0],
      role: role as 'admin' | 'voter',
      isVerified,
    };
  })();

  return {
    user: mappedUser,
    login,
    logout,
    signup,
    refreshUser,
    isLoading: !isLoaded || isSyncing,
    isSyncing,
    isSignedIn: isSignedIn || false,
    UserButton,
    SignIn,
    SignUp,
    RedirectToSignIn,
    RedirectToSignUp,
  };
}
