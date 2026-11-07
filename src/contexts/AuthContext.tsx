import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import type { User } from '@supabase/supabase-js';
import { hasSupabaseEnv, supabase } from '../lib/supabase';
import type { ProfileSummary } from '../types/models';
import { getErrorMessage } from '../utils/errors';

export interface AuthContextValue {
  hasSupabaseEnv: boolean;
  authError: string;
  loading: boolean;
  profile: ProfileSummary | null;
  setProfile: Dispatch<SetStateAction<ProfileSummary | null>>;
  user: User | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const AUTH_TIMEOUT_MS = 8000;

function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      window.setTimeout(
        () => reject(new Error('Supabaseへの接続がタイムアウトしました。')),
        ms,
      );
    }),
  ]);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      if (!supabase) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await withTimeout(
          supabase.auth.getUser(),
          AUTH_TIMEOUT_MS,
        );

        if (!cancelled) {
          setUser(data.user || null);
          setAuthError('');
        }
      } catch (error) {
        if (!cancelled) {
          setUser(null);
          setAuthError(
            getErrorMessage(
              error,
              'Supabaseへの接続に失敗しました。.env の設定を確認してください。',
            ),
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadUser();

    if (!supabase) return undefined;

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      if (!supabase || !user) {
        setProfile(null);
        return;
      }

      const { data } = await withTimeout(
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        AUTH_TIMEOUT_MS,
      );

      if (!cancelled) setProfile(data || null);
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      hasSupabaseEnv,
      authError,
      loading,
      profile,
      setProfile,
      user,
    }),
    [authError, loading, profile, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
