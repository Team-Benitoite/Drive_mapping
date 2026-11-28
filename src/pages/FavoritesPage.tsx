import { useEffect, useState } from 'react';
import AuthGuard from '../components/AuthGuard';
import HelpTip from '../components/HelpTip';
import RouteCard from '../components/RouteCard';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { loadProfilesByIds } from '../utils/profileData';
import type { RouteListItem } from '../types/models';

export default function FavoritesPage() {
  const { user } = useAuth();
  const [routes, setRoutes] = useState<RouteListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadFavorites() {
      if (!supabase || !user) {
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('route_favorites')
        .select(
          `
            route_id,
            created_at,
            routes(
              *,
              route_prefectures(prefecture_code, is_main),
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
        const favoriteRoutes = (data || [])
          .map((row) => row.routes)
          .filter((route): route is NonNullable<typeof route> => Boolean(route));
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
        <div className="page-heading">
          <div className="heading-with-help">
            <h1>お気に入り</h1>
            <HelpTip
              title="お気に入り一覧"
              description="各投稿の詳細ページで「★ お気に入り」に登録したドライブコースをまとめて見返せる保存リストです。"
              usage="カードをクリックするとルート詳細が開きます。お気に入り解除も投稿詳細ページの「★ お気に入り済み」ボタンから行えます。"
            />
          </div>
          <div className="meta">全{routes.length}件</div>
        </div>
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
