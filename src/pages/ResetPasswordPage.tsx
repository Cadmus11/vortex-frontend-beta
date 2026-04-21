import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, ArrowLeft, Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { token } = useParams();
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setIsValidToken(false);
        setIsVerifying(false);
        return;
      }

      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/auth/reset-password/verify/${token}`
        );
        const data = await res.json();
        setIsValidToken(res.ok && data.success);
      } catch {
        setIsValidToken(false);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/auth/reset-password`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, newPassword }),
        }
      );

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(true);
      } else {
        setError(data.error || 'Failed to reset password');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Verifying token...</p>
        </div>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <div className="w-full max-w-md text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-destructive/10">
              <XCircle className="h-6 w-6 text-destructive" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2">Invalid Link</h1>
          <p className="text-muted-foreground mb-6">
            This password reset link is invalid or has expired.
          </p>
          <Button onClick={() => navigate('/forgot-password')}>
            Request New Link
          </Button>
          <div className="mt-6">
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <div className="w-full max-w-md text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-green-500/10">
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2">Password Reset</h1>
          <p className="text-muted-foreground mb-6">
            Your password has been reset successfully.
          </p>
          <Button onClick={() => navigate('/login')}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <span className="text-2xl font-bold tracking-tight">Vortex</span>
          </div>
          <h1 className="text-2xl font-bold">New Password</h1>
          <p className="text-muted-foreground mt-2">
            Enter your new password below
          </p>
        </div>

        <div className="bg-card rounded-2xl shadow-lg border p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                'Reset Password'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
