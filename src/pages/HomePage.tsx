import { useEffect, useState } from 'react';
import JapanMap from '../components/JapanMap';
import { supabase } from '../lib/supabase';
import { getRouteGoogleMapsUrl } from '../utils/googleMaps';
import { getPrefectureName } from '../utils/prefectures';
import { getPublicPhotoUrl } from '../utils/routeData';
import { getErrorMessage } from '../utils/errors';
import type { PrefectureCounts, TopPrefecture } from '../types/models';

export default function HomePage() {
  const [counts, setCounts] = useState<PrefectureCounts>({});
  const [topPrefectures, setTopPrefectures] = useState<TopPrefecture[]>([]);
  const [popularRoutes, setPopularRoutes] = useState<Record<number, TopPrefecture>>({});
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      if (!supabase) return;
      const nextCounts: PrefectureCounts = {};
      const popularByPrefecture = new Map<number, TopPrefecture>();

      try {
        // ページ単位で集計し、取得上限を超える投稿もランキングに含める。
        const pageSize = 1000;
        for (let offset = 0; !cancelled; offset += pageSize) {
          const { data, error: fetchError } = await supabase
            .from('routes')
            .select(`
              id, title, prefecture_code, address, google_maps_url,
              route_points(label, address, sort_order),
              route_likes(user_id),
              route_photos(storage_path, thumb_path, sort_order)
            `)
            .order('id', { ascending: true })
            .order('sort_order', { foreignTable: 'route_photos', ascending: true })
            .range(offset, offset + pageSize - 1);
          if (fetchError) throw fetchError;
          if (cancelled) return;

          for (const route of data || []) {
            const code = route.prefecture_code;
            nextCounts[code] = (nextCounts[code] || 0) + 1;
            const likeCount = route.route_likes.length;
            const previous = popularByPrefecture.get(code);
            if (!previous || likeCount > previous.like_count) {
              const photo = route.route_photos[0];
              popularByPrefecture.set(code, {
                route_id: route.id,
                prefecture_code: code,
                title: route.title,
                like_count: likeCount,
                image_url: getPublicPhotoUrl(photo?.thumb_path || photo?.storage_path) || null,
                google_maps_url: getRouteGoogleMapsUrl({
                  address: route.address,
                  google_maps_url: route.google_maps_url,
                  route_points: route.route_points,
                  title: route.title,
                  prefecture_name: getPrefectureName(code),
                }),
              });
            }
          }
          if (!data || data.length < pageSize) break;
        }
        if (cancelled) return;
        setCounts(nextCounts);
        const routesMap: Record<number, TopPrefecture> = {};
        popularByPrefecture.forEach((v, k) => {
          routesMap[k] = v;
        });
        setPopularRoutes(routesMap);
        setTopPrefectures(
          [...popularByPrefecture.values()]
            .sort((left, right) => right.like_count - left.like_count || left.prefecture_code - right.prefecture_code)
            .slice(0, 3),
        );
      } catch (fetchError) {
        if (!cancelled) setError(getErrorMessage(fetchError, '投稿データの取得に失敗しました。'));
      }
    }

    void loadData();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="home-top-container">
      {error && <p className="error" role="alert">{error}</p>}
      <JapanMap counts={counts} topPrefectures={topPrefectures} popularRoutes={popularRoutes} />
    </div>
  );
}
