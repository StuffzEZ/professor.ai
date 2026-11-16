/**
 * Root React entry point — providers only (no UI logic here).
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { User } from 'firebase/auth';
import type { Settings } from '../lib/types';
import { isFirebaseConfigured } from '../lib/config';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 10_000, retry: false, refetchOnWindowFocus: false },
  },
});

interface AuthState {
  user: User | null;
  loading: boolean;
}

interface AppContextValue extends AuthState {
  settings: Settings;
  setSettings: (s: Settings) => void;
}

const Ctx = createContext<AppContextValue | null>(null);

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem('professor.settings');
    if (!raw) return { provider: 'professor', defaultDifficulty: 'intermediate', customEndpoint: null };
    return JSON.parse(raw) as Settings;
  } catch {
    return { provider: 'professor', defaultDifficulty: 'intermediate', customEndpoint: null };
  }
}

function saveSettings(s: Settings): void {
  localStorage.setItem('professor.settings', JSON.stringify(s));
}

interface Props {
  children: ReactNode;
  initialUser: User | null;
}

export function AppProvider({ children, initialUser }: Props) {
  const [user] = useState<User | null>(initialUser);
  const [loading] = useState(!isFirebaseConfigured);
  const [settings, setSettings] = useState<Settings>(loadSettings);

  const updateSettings = useCallback((s: Settings) => {
    setSettings(s);
    saveSettings(s);
  }, []);

  return (
    <Ctx.Provider value={{ user, loading, settings, setSettings: updateSettings }}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </Ctx.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}

export function useIsSignedIn(): boolean {
  return Boolean(useApp().user);
}