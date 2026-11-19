import { useState } from 'react';
import { Check, LogOut, X } from 'lucide-react';
import { useApp } from '../context';
import { ProviderId, CustomEndpoint, Difficulty } from '../lib/types';
import { Button, Input } from '../components/ui';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { getFirebaseAuth } from '../lib/firebase';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { settings, setSettings, user } = useApp();
  const [customEndpoint, setCustomEndpoint] = useState<{ baseUrl: string; apiKey: string; model: string }>({
    baseUrl: settings.customEndpoint?.baseUrl ?? '',
    apiKey: settings.customEndpoint?.apiKey ?? '',
    model: settings.customEndpoint?.model ?? '',
  });

  async function saveProvider(provider: ProviderId) {
    if (provider === 'custom' && !customEndpoint.baseUrl) {
      toast.error('Please enter a custom endpoint URL.');
      return;
    }
    setSettings({
      ...settings,
      provider,
      customEndpoint:
        provider === 'custom'
          ? ({
              baseUrl: customEndpoint.baseUrl,
              apiKey: customEndpoint.apiKey,
              model: customEndpoint.model || 'gpt-4o-mini',
            } as CustomEndpoint)
          : null,
    });
    toast.success(`Switched to ${providerLabel(provider)}.`);
  }

  async function signOut() {
    try {
      await getFirebaseAuth().signOut();
      toast.success('Signed out');
      navigate('/');
    } catch (err) {
      toast.error('Sign out failed');
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-text-primary">Settings</h1>
        <p className="text-sm text-text-secondary mt-1">Configure your AI provider and preferences.</p>
      </header>

      {/* AI Provider */}
      <section className="card space-y-4">
        <h2 className="font-medium text-text-primary">AI Provider</h2>
        <p className="text-sm text-text-muted">Choose how lessons are generated. Your choice can be changed anytime.</p>
        <div className="space-y-2">
          {[
            { id: 'professor' as ProviderId, label: 'Professor AI', desc: 'Default provider. Uses Pollinations AI when no dedicated endpoint is configured.' },
            { id: 'pollinations' as ProviderId, label: 'Pollinations AI', desc: 'Free, open-source, no API key required.' },
            { id: 'custom' as ProviderId, label: 'Custom endpoint', desc: 'Connect any OpenAI-compatible API (Azure, Groq, etc.).' },
          ].map((p) => (
            <button
              key={p.id}
              className={`w-full flex items-start gap-3 p-3 rounded-button border transition-colors text-left ${
                settings.provider === p.id
                  ? 'border-accent bg-accent/subtle'
                  : 'border-border-subtle hover:border-border-strong'
              }`}
              onClick={() => saveProvider(p.id)}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-text-primary">{p.label}</span>
                  {settings.provider === p.id && (
                    <span className="badge bg-accent text-white">Active</span>
                  )}
                </div>
                <p className="text-xs text-text-muted mt-0.5">{p.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Custom endpoint form */}
        {settings.provider === 'custom' && (
          <div className="space-y-3 pl-1 pt-2 border-t border-border-subtle">
            <div>
              <label className="label">Base URL</label>
              <Input
                value={customEndpoint.baseUrl}
                onChange={(e) => setCustomEndpoint({ ...customEndpoint, baseUrl: e.target.value })}
                placeholder="https://api.openai.com/v1"
              />
            </div>
            <div>
              <label className="label">API Key</label>
              <Input
                value={customEndpoint.apiKey}
                onChange={(e) => setCustomEndpoint({ ...customEndpoint, apiKey: e.target.value })}
                placeholder="sk-..."
                type="password"
                autoComplete="off"
              />
            </div>
            <div>
              <label className="label">Model</label>
              <Input
                value={customEndpoint.model}
                onChange={(e) => setCustomEndpoint({ ...customEndpoint, model: e.target.value })}
                placeholder="gpt-4o-mini"
              />
            </div>
          </div>
        )}
      </section>

      {/* Default difficulty */}
      <section className="card space-y-4">
        <h2 className="font-medium text-text-primary">Default Difficulty</h2>
        <p className="text-sm text-text-muted">Used when generating new lessons without explicitly choosing.</p>
        <div className="grid grid-cols-3 gap-2">
          {(['beginner', 'intermediate', 'advanced'] as Difficulty[]).map((d) => (
            <button
              key={d}
              className={`px-3 py-2 rounded-button border text-sm font-medium transition-colors text-center capitalize ${
                settings.defaultDifficulty === d
                  ? 'border-accent bg-accent/subtle text-accent'
                  : 'border-border-subtle text-text-secondary hover:border-border-strong'
              }`}
              onClick={() => setSettings({ ...settings, defaultDifficulty: d })}
            >
              {d}
            </button>
          ))}
        </div>
      </section>

      {/* Account info */}
      {user && (
        <section className="card space-y-4">
          <h2 className="font-medium text-text-primary">Account</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-muted">Email</span>
              <span className="text-text-primary">{user.email ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Verified</span>
              <span className={`flex items-center gap-1 ${user.emailVerified ? 'text-success' : 'text-warning'}`}>
                {user.emailVerified ? <Check size={14} aria-hidden="true" /> : <X size={14} aria-hidden="true" />}
                {user.emailVerified ? 'Verified' : 'Not verified'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Display name</span>
              <span className="text-text-primary">{user.displayName ?? '—'}</span>
            </div>
          </div>
          {!user.emailVerified && (
            <p className="text-xs text-warning">
              Please verify your email before generating lessons or publishing publicly.
            </p>
          )}
        </section>
      )}

      {/* Quota info */}
      <section className="card space-y-3">
              <h2 className="font-medium text-text-primary">Quotas (free tier)</h2>
              <ul className="text-sm text-text-muted space-y-1 list-disc list-inside">
                <li>{5} generations per day (established accounts)</li>
                <li>{2} generations per day (accounts &lt;7 days old)</li>
                <li>{10} public publishes per 30 days</li>
                <li>Minimum {30}s gap between generations</li>
              </ul>
              <p className="text-xs text-text-muted">
                These limits are enforced both client-side and in Firestore security rules.
              </p>
            </section>

            <div className="flex justify-between items-center pt-2">
              <Button variant="secondary" onClick={() => window.history.back()} className="flex-1 mr-2">
                Done
              </Button>
              <Button variant="ghost" onClick={signOut} className="flex-1 ml-2 text-danger hover:bg-danger/10">
                <LogOut size={16} /> Sign Out
              </Button>
            </div>
          </div>
        );
      }

      function providerLabel(id: ProviderId): string {
        return { professor: 'Professor AI', pollinations: 'Pollinations AI', custom: 'Custom endpoint' }[id];
      }