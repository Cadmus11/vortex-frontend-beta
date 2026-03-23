export const API_URL = import.meta.env.VITE_API_URL;

// Fallback base for local development if env var isn't set
const API_BASE =
  typeof API_URL === "string" && API_URL
    ? API_URL
    : "/api";

export const loginWithEmail = async (data: {
  email: string;
  password: string;
}) => {
  const res = await fetch(`${API_BASE}/auth/sign-in`, {
    method: "POST",
    credentials: 'include',

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("Login failed");
  }

  return res.json();
};

export const registerUser = async (data: {
  email: string;
  admissionNumber: string;
  password: string;
}) => {
  const res = await fetch(`${API_BASE}/auth/sign-up`, {
    method: "POST",
    credentials: 'include',

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("Register failed");
  }

  return res.json();
};

