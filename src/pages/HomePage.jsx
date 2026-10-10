import { useEffect, useState } from 'react';
import JapanMap from '../components/JapanMap.jsx';
import { supabase } from '../lib/supabase.js';

export default function HomePage() {
  const [counts, setCounts] = useState({});
  const [topPrefectures, setTopPrefectures] = useState([]);

  useEffect(() => {
    async function loadData() {
      if (!supabase) return;

      // 1. 各都道府県の投稿数を取得
      const { data: routePrefs } = await supabase
        .from('route_prefectures')
        .select('prefecture_code')
        .eq('is_main', true);

      if (routePrefs) {
        const nextCounts = {};
        routePrefs.forEach((route) => {
          const code = Number(route.prefecture_code);
          if (code) nextCounts[code] = (nextCounts[code] || 0) + 1;
        });
        setCounts(nextCounts);
      }

      // 2. 全ユーザーの「いいね数」を集計して人気の高い都道府県 TOP 3 を取得
      // （※ route_likes と routes を結合してイイネ数順に抽出）
      const { data: popularRoutes } = await supabase
        .from('routes')
        .select(`
          id,
          title,
          like_count,
          route_photos(photo_path),
          route_prefectures!inner(prefecture_code)
        `)
        .order('like_count', { ascending: false })
        .limit(10);

      if (popularRoutes) {
        // 都道府県ごとに最もイイネ数が多い投稿を1つ選択してTop3に絞り込む
        const prefMap = new Map();
        popularRoutes.forEach((route) => {
          const code = route.route_prefectures[0]?.prefecture_code;
          if (code && !prefMap.has(code)) {
            const photoPath = route.route_photos?.[0]?.photo_path;
            const imageUrl = photoPath
              ? supabase.storage.from('route-photos').getPublicUrl(photoPath).data.publicUrl
              : null;

            prefMap.set(code, {
              prefecture_code: Number(code),
              title: route.title,
              like_count: route.like_count || 0,
              image_url: imageUrl,
            });
          }
        });

        setTopPrefectures(Array.from(prefMap.values()).slice(0, 3));
      }
    }

    loadData();
  }, []);

  return (
    <div className="home-top-container" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '10px' }}>
      {/* マウスでドラッグ・ズーム操作ができるマップコンポーネント */}
      <JapanMap counts={counts} topPrefectures={topPrefectures} />
    </div>
  );
}