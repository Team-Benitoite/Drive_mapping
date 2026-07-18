import { useAuth } from '../contexts/AuthContext.jsx';
import { getAuthHref, getCurrentPath, Link } from '../utils/navigation.jsx';

export default function AuthGuard({ children }) {
  const { user } = useAuth();

  if (!user) {
    const returnTo = getCurrentPath();

    return (
      <section className="panel">
        <h1>ログインが必要です</h1>
        <p>このページを利用するにはログインしてください。</p>
        <div className="actions">
          <Link href={getAuthHref('/login', returnTo)} className="button">
            ログインへ
          </Link>
          <Link href={getAuthHref('/signup', returnTo)} className="button">
            新規登録へ
          </Link>
        </div>
      </section>
    );
  }

  return children;
}
