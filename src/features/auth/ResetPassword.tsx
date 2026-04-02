import { useState } from 'react';
import { Eye, EyeClosed, ArrowLeftCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { API_URL } from '../../config/api';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [visibility, setVisibility] = useState<boolean>(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setIsSuccess(false);

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
      const res = await fetch(`${API_URL}/auth/update-password`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, confirmPassword }),
      });
      const text = await res.text();
      if (!text) {
        setMessage('Empty response from server');
        return;
      }
      const data = JSON.parse(text) as { message?: string; error?: string };
      if (res.ok) {
        setIsSuccess(true);
        setMessage(data?.message ?? 'Password updated. You can now log in with your new password.');
      } else {
        setIsSuccess(false);
        setMessage(data?.error ?? 'Failed to update password');
      }
    } catch {
      setIsSuccess(false);
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

          <button type="submit" className="w-full py-2 rounded bg-slate-50 text-slate-950 text-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Password'
            )}
          </button>
        </form>
        {message && (
          <p className={`mt-4 text-sm text-center p-2 rounded ${isSuccess ? 'bg-green-500/10 border border-green-500/50 text-green-500' : 'bg-red-500/10 border border-red-500/50 text-red-500'}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
