const rawApiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
const API_URL = (rawApiUrl && rawApiUrl.length > 0 ? rawApiUrl : "http://localhost:3000").replace(/\/+$/, "");
export { API_URL };
