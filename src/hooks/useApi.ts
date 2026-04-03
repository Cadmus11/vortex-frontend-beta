import { API_URL } from "../config/api";

interface ApiError {
  message: string;
  status?: number;
}

export function useApi() {
  const request = async <T = unknown>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> => {
    const url = `${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    
    try {
      const res = await fetch(url, {
        ...options,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Request failed" }));
        const error = new Error(errorData.message || "API Error") as Error & ApiError;
        error.status = res.status;
        throw error;
      }

      return res.json();
    } catch (error) {
      if ((error as Error).name === "TypeError" && (error as Error).message.includes("fetch")) {
        throw new Error("Network error. Please check your connection.");
      }
      throw error;
    }
  };

  const get = <T = unknown>(endpoint: string, options?: RequestInit) => 
    request<T>(endpoint, { ...options, method: "GET" });

  const post = <T = unknown>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });

  const put = <T = unknown>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });

  const del = <T = unknown>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: "DELETE" });

  return { request, get, post, put, del };
}
