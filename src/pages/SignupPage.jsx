import { useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { navigate, Link } from '../utils/navigation.jsx';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError('ユーザー名を入力してください。');
      return;
    }

    if (password.length < 6) {
      setError('パスワードは6文字以上にしてください。');
      return;
    }

    if (!supabase) {
      setError(
        '.env の Supabase URL と anon key を実際の値に変更してください。',
      );
      return;
    }

    setSubmitting(true);

    let data;
    let signUpError;

    try {
      const result = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });
      data = result.data;
      signUpError = result.error;
    } catch {
      setSubmitting(false);
      setError(
        'Supabaseに接続できません。.env の VITE_SUPABASE_URL と VITE_SUPABASE_ANON_KEY を確認してください。',
      );
      return;
    }

    if (signUpError) {
      setSubmitting(false);
      if (signUpError.message === 'email rate limit exceeded') {
        setError(
          'Supabaseのメール送信制限に達しました。開発中はSupabaseのAuthentication設定でメール確認をOFFにしてください。',
        );
      } else {
        setError(signUpError.message);
      }
      return;
    }

    if (data.session && data.user) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        name,
      });

      if (profileError) {
        setSuccess(
          'ユーザー登録は完了しました。プロフィールはSupabase側のトリガーで作成されます。',
        );
      }
    }

    setSubmitting(false);

    if (data.session) {
      navigate('/');
    } else {
      setSuccess(
        '登録を受け付けました。Supabaseでメール確認が有効な場合は、確認メールのリンクを開いてからログインしてください。',
      );
    }
  }

  return (
    <section className="form-panel">
      <h1>新規登録</h1>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
      <form onSubmit={handleSubmit}>
        <label>
          ユーザー名
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </label>
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
          {submitting ? '登録中...' : '登録する'}
        </button>
      </form>
      <p>
        すでにアカウントをお持ちですか？ <Link href="/login">ログイン</Link>
      </p>
    </section>
  );
}
