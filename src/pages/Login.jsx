import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    const { error } = await signIn(email, password);
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    navigate(from, { replace: true });
  };

  return (
    <form className="form card" onSubmit={handleSubmit}>
      <h2>ログイン</h2>
      {error && <p className="error">{error}</p>}

      <label htmlFor="email">メールアドレス</label>
      <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

      <label htmlFor="password">パスワード</label>
      <input
        id="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <button className="btn" type="submit" disabled={busy}>
        {busy ? 'ログイン中…' : 'ログイン'}
      </button>
      <p className="muted" style={{ marginTop: 16 }}>
        アカウントがありませんか？ <Link to="/signup">新規登録</Link>
      </p>
    </form>
  );
}
