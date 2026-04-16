import { API_URL } from "../config/api";

export const api = async (endpoint: string, options: RequestInit = {}, accessToken?: string | null) => {
  const url = `${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  return fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
  });
};

export function useApi() {
  return {
    api: (endpoint: string, options: RequestInit = {}) => 
      api(endpoint, options, localStorage.getItem('accessToken')),
  };
}