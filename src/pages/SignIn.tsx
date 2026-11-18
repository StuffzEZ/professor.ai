import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Circle, Github, Mail, Lock } from 'lucide-react';
import { getFirebaseAuth } from '../lib/firebase';
import { upsertUserProfile, isDisposableEmail } from '../lib/store';
import type { ProviderId, Difficulty } from '../lib/types';
import toast from 'react-hot-toast';
import {
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithEmailAndPassword,
} from 'firebase/auth';

const PROVIDERS = [
  { id: 'google' as const, label: 'Google', icon: Circle },
  { id: 'github' as const, label: 'GitHub', icon: Github },
] as const;

export default function SignIn() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleProvider(providerId: string) {
    setLoading(true);
    try {
      const auth = getFirebaseAuth();
      let provider;
      if (providerId === 'google') {
        provider = new GoogleAuthProvider();
      } else if (providerId === 'github') {
        provider = new GithubAuthProvider();
      }
      if (!provider) throw new Error('Unknown provider');
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      if (!user.emailVerified) {
        toast.error('Please verify your email before continuing.');
        return;
      }
      if (isDisposableEmail(user.email!)) {
        toast.error('Disposable email addresses are not allowed.');
        return;
      }
      await upsertUserProfile({
        uid: user.uid,
        displayName: user.displayName ?? user.email!.split('@')[0],
        email: user.email!,
        emailVerified: true,
        provider: 'professor' as ProviderId,
        defaultDifficulty: 'intermediate' as Difficulty,
        onboardingComplete: false,
        createdAt: new Date().toISOString(),
        cooldownUntil: new Date().getTime() + 7 * 24 * 60 * 60 * 1000,
      });
      navigate('/onboarding');
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      if (e?.code !== 'auth/popup-closed-by-user') {
        toast.error(e?.message ?? 'Sign-in failed');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const auth = getFirebaseAuth();
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = result.user;
      if (!user.emailVerified) {
        toast.error('Please verify your email before continuing.');
        return;
      }
      if (isDisposableEmail(user.email!)) {
        toast.error('Disposable email addresses are not allowed.');
        return;
      }
      await upsertUserProfile({
        uid: user.uid,
        displayName: user.displayName ?? user.email!.split('@')[0],
        email: user.email!,
        emailVerified: true,
        provider: 'professor' as ProviderId,
        defaultDifficulty: 'intermediate' as Difficulty,
        onboardingComplete: false,
        createdAt: new Date().toISOString(),
        cooldownUntil: new Date().getTime() + 7 * 24 * 60 * 60 * 1000,
      });
      navigate('/onboarding');
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      toast.error(e?.message ?? 'Sign-in failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100dvh-4rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-text-primary">Welcome to Professor AI</h1>
          <p className="text-sm text-text-secondary">
            Sign in to create and track your learning journeys.
          </p>
        </div>

        {showEmailForm ? (
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="email" className="text-sm text-text-secondary">
                Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  id="email"
                  type="email"
                  className="input pl-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label htmlFor="password" className="text-sm text-text-secondary">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  id="password"
                  type="password"
                  className="input pl-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
            <button
              type="button"
              className="text-xs text-text-muted hover:text-text-secondary transition-colors"
              onClick={() => setShowEmailForm(false)}
            >
              ← Back to other options
            </button>
          </form>
        ) : (
          <div className="space-y-3">
            {PROVIDERS.map((p) => (
              <button
                key={p.id}
                className="btn btn-secondary w-full gap-3"
                onClick={() => handleProvider(p.id)}
                disabled={loading}
              >
                <p.icon size={18} />
                Continue with {p.label}
              </button>
            ))}
            <button
              className="btn btn-secondary w-full gap-3"
              onClick={() => setShowEmailForm(true)}
              disabled={loading}
            >
              <Mail size={18} />
              Continue with Email
            </button>
          </div>
        )}

        <p className="text-xs text-text-muted text-center">
          By signing in you agree to our terms and confirm you're over 13 years old.
        </p>
      </div>
    </div>
  );
}