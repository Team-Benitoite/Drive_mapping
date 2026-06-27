import { useAuth } from '../contexts/AuthContext.jsx';
import { Link } from '../utils/navigation.jsx';

export default function AuthGuard({ children }) {
  const { user } = useAuth();

  if (!user) {
    return (
      <section className="panel">
        <h1>ログインが必要です</h1>
        <p>このページを利用するにはログインしてください。</p>
        <Link href="/login" className="button">
          ログインへ
        </Link>
      </section>
    );
  }

  return children;
}
