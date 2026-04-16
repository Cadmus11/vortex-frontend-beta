import '@testing-library/jest-dom'
import { vi } from 'vitest'

global.fetch = global.fetch || vi.fn()

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    accessToken: null,
    isLoading: false,
    isAuthenticated: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refreshToken: vi.fn(),
  }),
}))
