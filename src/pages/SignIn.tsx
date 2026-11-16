import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Circle, Github } from 'lucide-react';
import { getFirebaseAuth } from '../lib/firebase';
import { upsertUserProfile, isDisposableEmail } from '../lib/store';
import type { ProviderId, Difficulty } from '../lib/types';
import toast from 'react-hot-toast';
import { signInWithPopup, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';

const PROVIDERS = [
  { id: 'google' as const, label: 'Google', icon: Circle },
  { id: 'github' as const, label: 'GitHub', icon: Github },
] as const;

export default function SignIn() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

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
        cooldownUntil: Date.now() + 7 * 24 * 60 * 60 * 1000,
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

  return (
    <div className="min-h-[calc(100dvh-4rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-text-primary">Welcome to Professor AI</h1>
          <p className="text-sm text-text-secondary">
            Sign in to create and track your learning journeys.
          </p>
        </div>

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
        </div>

        <p className="text-xs text-text-muted text-center">
          By signing in you agree to our terms and confirm you're over 13 years old.
        </p>
      </div>
    </div>
  );
}