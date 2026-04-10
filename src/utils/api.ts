import { API_URL } from "../config/api";
import { useUser } from "@clerk/clerk-react";

export const api = async (endpoint: string, options: RequestInit = {}, clerkUserId?: string) => {
  const url = `${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  return fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(clerkUserId ? { 'x-clerk-user-id': clerkUserId } : {}),
      ...options.headers,
    },
  });
};

export function useApi() {
  const { user: clerkUser } = useUser();

  return {
    api: (endpoint: string, options: RequestInit = {}) => 
      api(endpoint, options, clerkUser?.id),
  };
}