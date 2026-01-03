import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { ArrowLeft, Mail, Lock } from 'lucide-react';
import { auth } from '@/integrations/firebase/client';
import { confirmPasswordReset, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';

const emailSchema = z.string().trim().email({ message: "Invalid email address" }).max(255);
const passwordSchema = z.string().min(6, { message: "Password must be at least 6 characters" }).max(72);

type AuthMode = 'login' | 'signup' | 'otp-request' | 'forgot-password' | 'new-password';

const RESEND_COOLDOWN = 60; // seconds

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [resendCooldown, setResendCooldown] = useState(0);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const cooldownRef = useRef<NodeJS.Timeout | null>(null);

  const { user, signInWithGoogle, signInWithEmail, signUpWithEmail, signInWithOtp, resetPassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Basic SEO for /auth
  useEffect(() => {
    document.title = 'Sign in | Habit Tracker';

    const description = 'Sign in to your habit tracker to manage habits, reminders, and daily schedule.';

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', description);

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.href = `${window.location.origin}/auth`;
  }, []);

  // Handle redirect back from password recovery links (and show backend error messages nicely)
  useEffect(() => {
    const modeParam = searchParams.get('mode');
    const error = searchParams.get('error_description') ?? searchParams.get('error');
    if (error) {
      toast({
        title: 'Authentication link error',
        description: decodeURIComponent(error),
        variant: 'destructive',
      });
    }

    // Firebase password reset links include ?mode=resetPassword&oobCode=...
    const isRecovery = modeParam === 'reset' || modeParam === 'resetPassword' || !!searchParams.get('oobCode');
    if (isRecovery) {
      setMode('new-password');
      toast({
        title: 'Set a new password',
        description: 'Enter your new password to finish resetting your account.',
      });
    }
  }, [searchParams, toast]);

  // Handle Firebase email-link sign-in when user opens their email link
  useEffect(() => {
    const run = async () => {
      const modeParam = searchParams.get('mode');
      if (modeParam !== 'emailLink') return;
      if (!isSignInWithEmailLink(auth, window.location.href)) return;

      const storedEmail = window.localStorage.getItem('habitex_emailLinkSignInEmail') || '';
      if (!storedEmail) {
        toast({
          title: 'Missing email',
          description: 'Please enter your email again to finish signing in.',
          variant: 'destructive',
        });
        setMode('otp-request');
        return;
      }

      setLoading(true);
      try {
        await signInWithEmailLink(auth, storedEmail, window.location.href);
        window.localStorage.removeItem('habitex_emailLinkSignInEmail');
        toast({
          title: 'Signed in',
          description: 'You are now signed in.',
        });
      } catch (e) {
        toast({
          title: 'Sign in failed',
          description: (e as Error).message,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [searchParams, toast]);

  // Redirect if already logged in (except during recovery)
  useEffect(() => {
    const modeParam = searchParams.get('mode');
    const typeParam = searchParams.get('type');
    const isRecovery = typeParam === 'recovery' || modeParam === 'reset' || modeParam === 'recovery';

    if (user && !isRecovery && mode !== 'new-password') {
      navigate('/');
    }
  }, [user, navigate, searchParams, mode]);

  // Cleanup cooldown timer on unmount
  useEffect(() => {
    return () => {
      if (cooldownRef.current) {
        clearInterval(cooldownRef.current);
      }
    };
  }, []);

  const startResendCooldown = () => {
    setResendCooldown(RESEND_COOLDOWN);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) {
            clearInterval(cooldownRef.current);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const validateEmail = () => {
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setErrors({ email: result.error.errors[0].message });
      return false;
    }
    setErrors({});
    return true;
  };

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }
    
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOtpRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail()) return;

    setLoading(true);
    const { error } = await signInWithOtp(email);
    setLoading(false);

    if (error) {
      toast({
        title: 'Failed to send link',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Link sent!',
        description: 'Check your email for a sign-in link. Open it in the same browser.',
      });
      startResendCooldown();
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;

    setLoading(true);
    const { error } = await signInWithOtp(email);
    setLoading(false);

    if (error) {
      toast({
        title: 'Failed to resend link',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Link resent!',
        description: 'Check your email for the newest sign-in link.',
      });
      startResendCooldown();
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      if (mode === 'login') {
        const { error } = await signInWithEmail(email, password);
        if (error) {
          toast({
            title: 'Login failed',
            description: error.message,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Welcome back!',
            description: 'You have successfully logged in.',
          });
        }
      } else if (mode === 'signup') {
        const { error } = await signUpWithEmail(email, password);
        if (error) {
          toast({
            title: 'Sign up failed',
            description: error.message,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Account created!',
            description: 'You can now start tracking your habits.',
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail()) return;

    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);

    if (error) {
      toast({
        title: 'Failed to send reset link',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Reset link sent!',
        description: 'Check your email for a password reset link.',
      });
    }
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    const passwordResult = passwordSchema.safeParse(newPassword);
    if (!passwordResult.success) {
      setErrors({ password: passwordResult.error.errors[0].message });
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrors({ password: 'Passwords do not match' });
      return;
    }

    setErrors({});
    setLoading(true);

    const oobCode = searchParams.get('oobCode');
    if (!oobCode) {
      setLoading(false);
      toast({
        title: 'Missing reset code',
        description: 'Please open the password reset link from your email again.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      toast({
        title: 'Password updated!',
        description: 'Your password has been successfully changed. Please sign in again.',
      });
      navigate('/auth');
    } catch (error) {
      toast({
        title: 'Failed to update password',
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      toast({
        title: 'Sign in failed',
        description: error.message,
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  const renderOtpRequest = () => (
    <form onSubmit={handleOtpRequest} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10"
            disabled={loading}
          />
        </div>
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email}</p>
        )}
      </div>

      <Button type="submit" className="w-full h-11" disabled={loading}>
        {loading ? 'Sending link...' : 'Send sign-in link'}
      </Button>

      <button
        type="button"
        onClick={handleResendCode}
        disabled={loading || resendCooldown > 0}
        className="w-full text-sm text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend link'}
      </button>
    </form>
  );

  // Magic-link sign-in does not require entering a code in-app.
  // Users will be signed in automatically after opening the email link.

  const renderPasswordAuth = () => (
    <form onSubmit={handleEmailAuth} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10"
            disabled={loading}
          />
        </div>
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email}</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-sm">Password</Label>
          {mode === 'login' && (
            <button
              type="button"
              onClick={() => setMode('forgot-password')}
              className="text-xs text-primary hover:underline"
            >
              Forgot password?
            </button>
          )}
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10"
            disabled={loading}
          />
        </div>
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password}</p>
        )}
      </div>

      <Button type="submit" className="w-full h-11" disabled={loading}>
        {loading ? 'Please wait...' : (mode === 'login' ? 'Sign in' : 'Create account')}
      </Button>
    </form>
  );

  const renderForgotPassword = () => (
    <form onSubmit={handleForgotPassword} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10"
            disabled={loading}
          />
        </div>
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email}</p>
        )}
      </div>

      <Button type="submit" className="w-full h-11" disabled={loading}>
        {loading ? 'Sending link...' : 'Send reset link'}
      </Button>

      <button
        type="button"
        onClick={() => setMode('login')}
        className="w-full text-sm text-muted-foreground hover:text-foreground"
      >
        Back to sign in
      </button>
    </form>
  );

  // Password recovery uses an email link. After opening it, this page switches to "new-password" mode automatically.

  const renderNewPassword = () => (
    <form onSubmit={handleSetNewPassword} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="newPassword" className="text-sm">New Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="newPassword"
            type="password"
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="pl-10"
            disabled={loading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-sm">Confirm Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="pl-10"
            disabled={loading}
          />
        </div>
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password}</p>
        )}
      </div>

      <Button type="submit" className="w-full h-11" disabled={loading}>
        {loading ? 'Updating...' : 'Set new password'}
      </Button>
    </form>
  );

  const getHeaderText = () => {
    switch (mode) {
      case 'otp-request':
        return 'Email link sign-in';
      case 'forgot-password':
        return 'Reset password';
      case 'new-password':
        return 'New password';
      case 'login':
      case 'signup':
      default:
        return 'Welcome';
    }
  };

  const getSubheaderText = () => {
    switch (mode) {
      case 'otp-request':
        return 'We’ll email you a sign-in link';
      case 'login':
        return 'Sign in with your email and password';
      case 'signup':
        return 'Create an account with email and password';
      case 'forgot-password':
        return 'Enter your email to receive a password reset link';
      case 'new-password':
        return 'Create a new password for your account';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to app
        </Button>

        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="font-display text-3xl text-foreground">
            {getHeaderText()}
          </h1>
          <p className="text-muted-foreground text-sm">
            {getSubheaderText()}
          </p>
        </div>

        {/* Google Sign In - only show on initial screens */}
        {(mode === 'otp-request' || mode === 'login' || mode === 'signup') && (
          <>
            <Button
              onClick={handleGoogleSignIn}
              disabled={loading}
              variant="outline"
              className="w-full gap-2 h-11"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">or</span>
              </div>
            </div>
          </>
        )}

        {/* Auth Form based on mode */}
        {mode === 'otp-request' && renderOtpRequest()}
        {(mode === 'login' || mode === 'signup') && renderPasswordAuth()}
        {mode === 'forgot-password' && renderForgotPassword()}
        {mode === 'new-password' && renderNewPassword()}

        {/* Mode toggles */}
        {mode !== 'forgot-password' && mode !== 'new-password' && (
          <div className="space-y-3 text-center">
            {mode === 'otp-request' && (
              <p className="text-sm text-muted-foreground">
                Prefer password?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-primary hover:underline font-medium"
                >
                  Sign in with password
                </button>
              </p>
            )}

            {mode === 'login' && (
              <>
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className="text-primary hover:underline font-medium"
                  >
                    Sign up
                  </button>
                </p>
                <p className="text-sm text-muted-foreground">
                  Or{' '}
                  <button
                    type="button"
                    onClick={() => setMode('otp-request')}
                    className="text-primary hover:underline font-medium"
                  >
                    sign in with email link
                  </button>
                </p>
              </>
            )}

            {mode === 'signup' && (
              <>
                <p className="text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-primary hover:underline font-medium"
                  >
                    Sign in
                  </button>
                </p>
                <p className="text-sm text-muted-foreground">
                  Or{' '}
                  <button
                    type="button"
                    onClick={() => setMode('otp-request')}
                    className="text-primary hover:underline font-medium"
                  >
                    sign in with email link
                  </button>
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;