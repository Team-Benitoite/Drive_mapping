import { useState, type FormEvent } from 'react';
import type { AuthError, AuthResponse } from '@supabase/supabase-js';
import HelpTip from '../components/HelpTip';
import { supabase } from '../lib/supabase';
import {
  getAuthHref,
  getAuthReturnPath,
  Link,
  navigate,
} from '../utils/navigation';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const returnTo = getAuthReturnPath();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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

    let data: AuthResponse['data'];
    let signUpError: AuthError | null = null;

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
      navigate(returnTo);
    } else {
      setSuccess(
        '登録を受け付けました。Supabaseでメール確認が有効な場合は、確認メールのリンクを開いてからログインしてください。',
      );
    }
  }

  return (
    <section className="form-panel">
      <div className="heading-with-help page-title-with-help">
        <h1>新規登録</h1>
        <HelpTip
          title="新規登録"
          description="ドライブマッピングの新しいアカウントを作成する画面です。"
          usage="ユーザー名・メールアドレス・パスワード（6文字以上）を入力して「登録する」を押すと、投稿やマイページ機能が使えるようになります。"
        />
      </div>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-field">
          <div className="form-field-label-row">
            <label htmlFor="signup-name">ユーザー名</label>
            <HelpTip
              title="ユーザー名"
              description="投稿カードやマイページ・アカウント検索で他のユーザーに表示されるニックネームです。"
            />
          </div>
          <input
            id="signup-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </div>
        <div className="form-field">
          <div className="form-field-label-row">
            <label htmlFor="signup-email">メールアドレス</label>
            <HelpTip
              title="メールアドレス"
              description="ログイン認証に使用するメールアドレスを入力してください。"
            />
          </div>
          <input
            id="signup-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <div className="form-field">
          <div className="form-field-label-row">
            <label htmlFor="signup-password">パスワード</label>
            <HelpTip
              title="パスワード"
              description="ログイン時に使う6文字以上のパスワードを設定してください。"
            />
          </div>
          <input
            id="signup-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={submitting}>
          {submitting ? '登録中...' : '登録する'}
        </button>
      </form>
      <p>
        すでにアカウントをお持ちですか？{' '}
        <Link href={getAuthHref('/login', returnTo)}>ログイン</Link>
      </p>
    </section>
  );
}
