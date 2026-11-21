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
              route_prefectures(prefecture_code, is_main),
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
            const prefCodes = Array.from(
              new Set(
                [
                  route.prefecture_code,
                  ...(route.route_prefectures || []).map((pref) => pref.prefecture_code),
                ].filter((code): code is number => Number.isFinite(code) && code > 0),
              ),
            );
            const likeCount = route.route_likes.length;
            const photo = route.route_photos[0];
            const imageUrl =
              getPublicPhotoUrl(photo?.thumb_path || photo?.storage_path) || null;
            const mapsUrl = getRouteGoogleMapsUrl({
              address: route.address,
              google_maps_url: route.google_maps_url,
              route_points: route.route_points,
              title: route.title,
              prefecture_name: getPrefectureName(route.prefecture_code),
            });

            for (const code of prefCodes) {
              nextCounts[code] = (nextCounts[code] || 0) + 1;
              const previous = popularByPrefecture.get(code);
              if (!previous || likeCount > previous.like_count) {
                popularByPrefecture.set(code, {
                  route_id: route.id,
                  prefecture_code: code,
                  title: route.title,
                  like_count: likeCount,
                  image_url: imageUrl,
                  google_maps_url: mapsUrl,
                });
              }
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

        const sortedCandidates = [...popularByPrefecture.values()].sort(
          (left, right) =>
            right.like_count - left.like_count ||
            left.prefecture_code - right.prefecture_code,
        );
        const topUniqueRoutes: TopPrefecture[] = [];
        const seenRouteIds = new Set<number>();
        for (const item of sortedCandidates) {
          if (item.route_id !== undefined) {
            if (seenRouteIds.has(item.route_id)) continue;
            seenRouteIds.add(item.route_id);
          }
          topUniqueRoutes.push(item);
          if (topUniqueRoutes.length >= 3) break;
        }
        setTopPrefectures(topUniqueRoutes);
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
