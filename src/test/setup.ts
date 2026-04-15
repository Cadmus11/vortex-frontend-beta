import '@testing-library/jest-dom'
import { vi } from 'vitest'

global.fetch = global.fetch || vi.fn()

vi.mock('@clerk/clerk-react', () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  useUser: () => ({
    isSignedIn: false,
    user: null,
    isLoaded: true,
  }),
  useClerk: () => ({
    signOut: vi.fn(),
  }),
  UserButton: () => null,
  SignIn: () => null,
  SignUp: () => null,
  RedirectToSignIn: () => null,
  RedirectToSignUp: () => null,
}))
