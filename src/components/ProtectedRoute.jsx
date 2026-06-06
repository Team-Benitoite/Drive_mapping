import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// 認証が必要な画面をラップする。未ログインなら /login へ誘導する。
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <p className="muted">読み込み中…</p>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}
