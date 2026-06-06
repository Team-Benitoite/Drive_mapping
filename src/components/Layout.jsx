import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Layout({ children }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <>
      <nav className="nav">
        <Link to="/" className="brand">🏍️ Drive Mapping</Link>
        <Link to="/">ルート一覧</Link>
        <div className="spacer" />
        {user ? (
          <>
            <Link to="/routes/new" className="btn">ルートを投稿</Link>
            <span className="muted">{user.user_metadata?.name ?? user.email}</span>
            <button className="btn-ghost btn" onClick={handleLogout}>ログアウト</button>
          </>
        ) : (
          <>
            <Link to="/login">ログイン</Link>
            <Link to="/signup" className="btn">新規登録</Link>
          </>
        )}
      </nav>
      <div className="container">{children}</div>
    </>
  );
}
