import { useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { navigate, Link } from '../utils/navigation.jsx';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

    navigate('/');
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
        アカウントをお持ちでない方は <Link href="/signup">新規登録</Link>
      </p>
    </section>
  );
}
