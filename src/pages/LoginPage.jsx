import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';
import {
  getAuthHref,
  getAuthReturnPath,
  Link,
  navigate,
} from '../utils/navigation.jsx';

export default function LoginPage() {
  const { profile, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const returnTo = getAuthReturnPath();
  const accountName =
    profile?.name || user?.user_metadata?.name || user?.email || 'ユーザー';

  async function handleLogout() {
    setError('');
    setSubmitting(true);

    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
    } catch (signOutError) {
      setError(signOutError.message || 'ログアウトに失敗しました。');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    if (!supabase) {
      setError(
        '.env の Supabase URL と anon key を実際の値に変更してください。',
      );
      setSubmitting(false);
      return;
    }

    let signInError;

    try {
      const result = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      signInError = result.error;
    } catch {
      setSubmitting(false);
      setError(
        'Supabaseに接続できません。.env の VITE_SUPABASE_URL と VITE_SUPABASE_ANON_KEY を確認してください。',
      );
      return;
    }

    setSubmitting(false);

    if (signInError) {
      setError('メールアドレスまたはパスワードが違います。');
      return;
    }

    navigate(returnTo);
  }

  if (user) {
    return (
      <section className="form-panel">
        <h1>ログイン</h1>
        {error && <p className="error">{error}</p>}
        <p>
          現在アカウント「{accountName}」でログイン中です。ログアウトしますか？
        </p>
        <div className="actions">
          <button type="button" onClick={handleLogout} disabled={submitting}>
            {submitting ? 'ログアウト中...' : 'ログアウト'}
          </button>
          <button type="button" onClick={() => navigate('/')}>
            サイトへ戻る
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="form-panel">
      <h1>ログイン</h1>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <label>
          メールアドレス
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label>
          パスワード
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        <button type="submit" disabled={submitting}>
          {submitting ? 'ログイン中...' : 'ログイン'}
        </button>
      </form>
      <p>
        アカウントをお持ちでない方は{' '}
        <Link href={getAuthHref('/signup', returnTo)}>新規登録</Link>
      </p>
    </section>
  );
}
