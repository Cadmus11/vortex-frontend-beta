import { useUser, useClerk, UserButton, SignIn, SignUp, RedirectToSignIn, RedirectToSignUp } from '@clerk/clerk-react';
import { useCallback, useEffect, useState } from 'react';
import { API_URL } from "../config/api";

export type User = {
  id: string;
  clerkId: string;
  email: string;
  role: "admin" | "voter";
  isVerified?: boolean;
};

export type AuthContextType = {
  user: User | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  signup: () => Promise<void>;
  isLoading: boolean;
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
    await signOut();
  }, [signOut]);

  const signup = useCallback(async () => {
    // Clerk handles signup via SignUp component
  }, []);

  const syncWithBackend = useCallback(async () => {
    if (!clerkUser || !clerkUser.id) return;

    setIsSyncing(true);
    try {
      const response = await fetch(`${API_URL}/auth/clerk-webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'user.updated',
          data: {
            id: clerkUser.id,
            email_addresses: clerkUser.emailAddresses.map(e => ({
              id: e.id,
              email_address: e.emailAddress,
            })),
            public_metadata: { role: backendUser?.role || 'voter' },
          },
        }),
      });

      if (response.ok) {
        const userRes = await fetch(`${API_URL}/auth/clerk-sync`, {
          headers: { 'x-clerk-user-id': clerkUser.id },
        });
        if (userRes.ok) {
          const data = await userRes.json();
          setBackendUser(data.user);
        }
      }
    } catch (error) {
      console.error('Failed to sync with backend:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [clerkUser, backendUser?.role]);

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

    const role = backendUser?.role || 'voter';

    const emailVerified = clerkUser.primaryEmailAddress?.verification?.status === 'verified'
      || clerkUser.emailAddresses?.[0]?.verification?.status === 'verified'
      || false;

    return {
      id: backendUser?.id || clerkUser.id,
      clerkId: clerkUser.id,
      email: primaryEmail,
      role: role as 'admin' | 'voter',
      isVerified: emailVerified,
    };
  })();

  return {
    user: mappedUser,
    login,
    logout,
    signup,
    isLoading: !isLoaded || isSyncing,
    isSignedIn: isSignedIn || false,
    UserButton,
    SignIn,
    SignUp,
    RedirectToSignIn,
    RedirectToSignUp,
  };
}
