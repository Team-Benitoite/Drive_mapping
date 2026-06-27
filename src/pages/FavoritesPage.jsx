import { useEffect, useState } from 'react';
import AuthGuard from '../components/AuthGuard.jsx';
import RouteCard from '../components/RouteCard.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';
import { loadProfilesByIds } from '../utils/profileData.js';
import { Link } from '../utils/navigation.jsx';

export default function FavoritesPage() {
  const { user } = useAuth();
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadFavorites() {
      if (!supabase || !user) {
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('route_likes')
        .select(
          `
            route_id,
            created_at,
            routes(
              *,
              route_photos(storage_path, thumb_path, sort_order),
              route_likes(user_id)
            )
          `,
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
      } else {
        const favoriteRoutes = (data || []).map((row) => row.routes).filter(Boolean);
        const profiles = await loadProfilesByIds(
          favoriteRoutes.map((route) => route.user_id),
        );
        setRoutes(
          favoriteRoutes.map((route) => ({
            ...route,
            profile: profiles[route.user_id],
          })),
        );
      }

      setLoading(false);
    }

    loadFavorites();
  }, [user]);

  return (
    <AuthGuard>
      <section>
        <div className="topnav">
          <Link href="/">← トップ（日本地図）へ戻る</Link>
        </div>
        <h1>お気に入り</h1>
        <div className="meta">ログイン中：{user?.email} さん / {routes.length} 件</div>
        {loading && <div className="panel">お気に入りを読み込んでいます...</div>}
        {error && <p className="error">{error}</p>}
        {!loading && !error && routes.length === 0 && (
          <div className="panel">お気に入りはまだありません。</div>
        )}
        <div className="route-list">
          {routes.map((route) => (
            <RouteCard key={route.id} route={route} />
          ))}
        </div>
      </section>
    </AuthGuard>
  );
}
