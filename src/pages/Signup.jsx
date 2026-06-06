import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Signup() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setBusy(true);
    const { data, error } = await signUp(email, password, name);
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    // メール確認が無効なプロジェクトでは即セッションが張られる。
    if (data.session) {
      navigate('/');
    } else {
      setInfo('登録しました。確認メールが届いている場合は認証後にログインしてください。');
    }
  };

  return (
    <form className="form card" onSubmit={handleSubmit}>
      <h2>新規登録</h2>
      {error && <p className="error">{error}</p>}
      {info && <p className="muted">{info}</p>}

      <label htmlFor="name">表示名</label>
      <input id="name" value={name} onChange={(e) => setName(e.target.value)} required />

      <label htmlFor="email">メールアドレス</label>
      <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

      <label htmlFor="password">パスワード（6文字以上）</label>
      <input
        id="password"
        type="password"
        minLength={6}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <button className="btn" type="submit" disabled={busy}>
        {busy ? '登録中…' : '登録する'}
      </button>
      <p className="muted" style={{ marginTop: 16 }}>
        すでにアカウントをお持ちですか？ <Link to="/login">ログイン</Link>
      </p>
    </form>
  );
}
