import React, { useState } from "react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [token, setToken] = useState<string | null>(null);

  const API_BASE = typeof (import.meta.env as any).VITE_API_URL === 'string' ? (import.meta.env as any).VITE_API_URL : '/api';

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data?.message ?? 'Check your email for reset instructions');
        if (data?.token) setToken(data.token);
      } else {
        setMessage(data?.error ?? 'Failed to send reset link');
      }
    } catch (err) {
      setMessage("Error sending reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950">
      <div className="w-full max-w-md bg-zinc-900 border-zinc-800 p-6 rounded shadow-xl">
        <h2 className="text-2xl text-center text-zinc-100 mb-4">Forgot Password</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 rounded bg-zinc-800 text-zinc-100 border border-zinc-700"
            required
          />
          <button type="submit" className="w-full py-2 rounded bg-green-500 text-white" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        {message && <p className="mt-4 text-sm text-zinc-300 text-center">{message}</p>}
        {token && (
          <p className="mt-2 text-xs text-zinc-400 text-center">Demo token: <code className="bg-zinc-800 p-1 rounded">{token}</code></p>
        )}
      </div>
    </div>
  );
}
