import useFetch from './useFetch';
import { clearCache } from './useFetch';
import { API_URL } from '../config/api';

export interface User {
  id: string;
  email: string;
  username: string;
  role: 'admin' | 'voter';
  isVerified: boolean;
  createdAt?: string;
}

interface UsersResponse {
  success: boolean;
  data: User[];
}

interface UserResponse {
  success: boolean;
  user: User;
}

export function useUsers() {
  const { data, loading, error, post, put, del, refresh } = useFetch<UsersResponse>('/users');

  const users = data?.data || [];

  const createUser = async (userData: { email: string; password: string; role?: 'admin' | 'voter' }) => {
    const result = await post(userData);
    clearCache('/users');
    return result;
  };

  const updateUser = async (_id: string, updates: Partial<User>) => {
    const result = await put(updates);
    clearCache('/users');
    return result;
  };

  const deleteUser = async (_id: string) => {
    const result = await del();
    clearCache('/users');
    return result;
  };

  return {
    users,
    loading,
    error,
    refresh,
    createUser,
    updateUser,
    deleteUser,
  };
}

export function useUser(id: string) {
  const { data, loading, error, put, refresh } = useFetch<UserResponse>(`/users/${id}`, {
    immediate: !!id,
  });

  const user = data?.user;

  const updateUser = async (updates: Partial<User>) => {
    const result = await put(updates);
    clearCache(`/users/${id}`);
    clearCache('/users');
    return result;
  };

  return {
    user,
    loading,
    error,
    refresh,
    updateUser,
  };
}

export function useCurrentUser() {
  const { data, loading, error, refresh } = useFetch<UserResponse>('/auth/me');

  const user = data?.user;

  const logout = async () => {
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    clearCache('/auth/me');
  };

  return {
    user,
    loading,
    error,
    refresh,
    logout,
  };
}