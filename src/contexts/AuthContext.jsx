import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 起動時に既存セッションを取得
    auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    // 認証状態の変化（ログイン/ログアウト）を購読
    const { data: sub } = auth.onAuthStateChange((newSession) => {
      setSession(newSession);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const value = {
    session,
    user: session?.user ?? null,
    loading,
    signUp: auth.signUp,
    signIn: auth.signIn,
    signOut: auth.signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
