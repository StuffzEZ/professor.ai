import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { updateProfile } from 'firebase/auth';
import { getFirebaseAuth } from '../lib/firebase';
import { upsertUserProfile } from '../lib/store';
import { Button } from '../components/ui';
import type { Difficulty, ProviderId } from '../lib/types';
import { DIFFICULTIES } from '../lib/types';

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'name' | 'provider' | 'difficulty'>('name');
  const [displayName, setDisplayName] = useState('');
  const [provider, setProvider] = useState<ProviderId>('professor');
  const [difficulty, setDifficulty] = useState<Difficulty>('intermediate');
  const [saving, setSaving] = useState(false);

  function next() {
    if (step === 'name') setStep('provider');
    else if (step === 'provider') setStep('difficulty');
    else finish();
  }

  async function finish() {
    setSaving(true);
    const auth = getFirebaseAuth();
    const u = auth.currentUser;
    if (!u?.emailVerified) return;
    try {
      if (displayName.trim()) await updateProfile(u, { displayName: displayName.trim() });
      await upsertUserProfile({
        uid: u.uid,
        displayName: displayName.trim() || u.displayName || u.email!.split('@')[0],
        email: u.email!,
        emailVerified: true,
        provider,
        defaultDifficulty: difficulty,
        onboardingComplete: true,
        createdAt: new Date().toISOString(),
        cooldownUntil: Date.now() + 7 * 24 * 60 * 60 * 1000,
      });
      localStorage.setItem('professor.onboarding', '1');
      navigate('/');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-[calc(100dvh-4rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Progress steps */}
        <div className="flex items-center justify-center gap-2">
          {['name', 'provider', 'difficulty'].map((s, i) => (
            <>
              <div
                className={`w-2 h-2 rounded-full ${
                  step === s ? 'bg-accent' : i <= ['name', 'provider', 'difficulty'].indexOf(step) ? 'bg-bg-active' : 'bg-border'
                }`}
              />
              {i < 2 && <div className="w-8 h-px bg-border-subtle" />}
            </>
          ))}
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-text-primary">
            {step === 'name' && 'What should we call you?'}
            {step === 'provider' && 'Choose your AI provider'}
            {step === 'difficulty' && 'Pick a starting difficulty'}
          </h1>
          <p className="text-sm text-text-secondary">
            {step === 'name' && 'Your display name is private.'}
            {step === 'provider' && 'You can change this later in settings.'}
            {step === 'difficulty' && 'We will default to this when generating lessons.'}
          </p>
        </div>

        <div className="card p-6 space-y-4">
          {step === 'name' && (
            <input
              className="input text-center text-lg"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Display name"
              autoFocus
              maxLength={50}
            />
          )}

          {step === 'provider' && (
            <div className="space-y-2">
              {[
                { id: 'professor' as ProviderId, label: 'Professor AI', desc: 'Default — uses Pollinations AI (free, no key needed).' },
                { id: 'pollinations' as ProviderId, label: 'Pollinations AI', desc: 'Free open-source model. No API key.' },
              ].map((p) => (
                <button
                  key={p.id}
                  className={`w-full flex items-start gap-3 p-3 rounded-button border transition-colors text-left ${
                    provider === p.id ? 'border-accent bg-accent/subtle' : 'border-border-subtle hover:border-border-strong'
                  }`}
                  onClick={() => setProvider(p.id)}
                >
                  <div className="flex-1">
                    <span className="font-medium text-text-primary">{p.label}</span>
                    <p className="text-xs text-text-muted mt-0.5">{p.desc}</p>
                  </div>
                  {provider === p.id && <div className="w-4 h-4 rounded-full bg-accent shrink-0" />}
                </button>
              ))}
            </div>
          )}

          {step === 'difficulty' && (
            <div className="grid gap-2">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.value}
                  className={`p-3 rounded-button border text-left transition-colors ${
                    difficulty === d.value ? 'border-accent bg-accent/subtle' : 'border-border-subtle hover:border-border-strong'
                  }`}
                  onClick={() => setDifficulty(d.value)}
                >
                  <span className="font-medium text-text-primary capitalize block">{d.label}</span>
                  <span className="text-xs text-text-muted">{d.description}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <Button
          className="w-full gap-2"
          disabled={saving || (step === 'name' && !displayName.trim())}
          onClick={next}
        >
          {step === 'difficulty' ? 'Start Learning' : 'Continue'}
          <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  );
}