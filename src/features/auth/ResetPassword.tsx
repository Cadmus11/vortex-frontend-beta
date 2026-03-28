import { useState } from 'react';
import { Eye, EyeClosed } from 'lucide-react';
import { ArrowLeftCircle } from 'lucide-react';
import { useNavigate } from 'react-router';

const getEnvVar = (key: string, fallback: string): string => {
  const val = (import.meta.env as Record<string, string>)[key];
  return typeof val === 'string' ? val : fallback;
};

export default function ResetPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [visibility, setVisibility] = useState<boolean>(false);

  const API_BASE = getEnvVar('VITE_API_URL', '/api');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (!email) {
      setMessage('Email is required');
      return;
    }
    if (!password || password.length < 8) {
      setMessage('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/update-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, confirmPassword }),
      });
      const data = await res.json() as { message?: string; error?: string };
      if (res.ok) {
        setMessage(data?.message ?? 'Password updated. You can now log in with your new password.');
      } else {
        setMessage(data?.error ?? 'Failed to update password');
      }
    } catch {
      setMessage('Error updating password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950">
      <div className="w-full max-w-md bg-zinc-900 border-zinc-800 p-6 rounded shadow-xl">
        <div onClick={() => navigate(-1)} className="flex gap-2 text-sm mb-4 items-center justify-start capitalize cursor-pointer text-zinc-50/80">
          <ArrowLeftCircle className="h-4 w-4" />
          previous page
        </div>
        <h2 className="text-xl text-center text-zinc-100 mb-4">Update Password</h2>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-3 py-2 rounded bg-zinc-800 text-sm text-zinc-100 border border-zinc-700"
            required
          />
          <div className="flex justify-center items-center gap-4">
            <input
              type={visibility ? 'text' : 'password'}
              placeholder="New password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded bg-zinc-800 text-sm text-zinc-100 border border-zinc-700"
              required
            />
            <span className="ring-1 h-8 ring-slate-50/20 rounded-sm w-8 flex justify-center items-center p-2 cursor-pointer" onClick={() => setVisibility(!visibility)}>
              {visibility ? <EyeClosed /> : <Eye />}
            </span>
          </div>

          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 rounded bg-zinc-800 text-sm text-zinc-100 border border-zinc-700"
            required
          />

          <p className="ml-6">
            <li className={`${password.length > 7 ? 'text-emerald-400' : 'text-red-500'} text-xs`}>Password must be at least 8 characters</li>
          </p>

          <button type="submit" className="w-full py-2 rounded bg-slate-50 text-slate-950 text-sm cursor-pointer" disabled={loading}>
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
        {message && <p className="mt-4 text-sm text-zinc-300 text-center">{message}</p>}
      </div>
    </div>
  );
}
