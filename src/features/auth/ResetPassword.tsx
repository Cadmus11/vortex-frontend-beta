import React, { useEffect, useState } from 'react';

export default function ResetPassword() {
  const query = new URLSearchParams(window.location.search);
  const tokenFromQuery = query.get('token') || '';

  const [token, setToken] = useState<string>(tokenFromQuery);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const API_BASE = typeof (import.meta.env as any).VITE_API_URL === 'string' ? (import.meta.env as any).VITE_API_URL : '/api';

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setMessage('Token is required');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data?.message ?? 'Password updated');
      } else {
        setMessage(data?.error ?? 'Failed to update password');
      }
    } catch (err) {
      setMessage('Error updating password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950">
      <div className="w-full max-w-md bg-zinc-900 border-zinc-800 p-6 rounded shadow-xl">
        <h2 className="text-2xl text-center text-zinc-100 mb-4">Reset Password</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="w-full px-3 py-2 rounded bg-zinc-800 text-zinc-100 border border-zinc-700"
            required
          />
          <input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 rounded bg-zinc-800 text-zinc-100 border border-zinc-700"
            required
          />
          <button type="submit" className="w-full py-2 rounded bg-green-500 text-white" disabled={loading}>
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
        {message && <p className="mt-4 text-sm text-zinc-300 text-center">{message}</p>}
      </div>
    </div>
  );
}
