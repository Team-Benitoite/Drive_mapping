import { useEffect, useState } from 'react';
import JapanMap from '../components/JapanMap.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';
import { getPrefectureName } from '../utils/prefectures.js';
import { Link } from '../utils/navigation.jsx';

export default function HomePage() {
  const { user } = useAuth();
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCounts() {
      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('route_prefectures')
        .select('prefecture_code')
        .eq('is_main', true);

      if (!error && data) {
        const nextCounts = {};
        data.forEach((route) => {
          const code = Number(route.prefecture_code);
          if (code) nextCounts[code] = (nextCounts[code] || 0) + 1;
        });
        setCounts(nextCounts);
      }

      setLoading(false);
    }

    loadCounts();
  }, []);

  return (
    <>
      <h1>Drive Mapping</h1>
      <p>都道府県をクリックすると投稿一覧へ移動します。</p>

      <div className="wrap">
        <div className="card">
          <div className="map-wrap">
            <JapanMap counts={counts} />
          </div>
        </div>

        <div className="card side">
          <h3>メニュー</h3>
          <ul>
            <li>
              <Link href="/routes">投稿一覧</Link>
            </li>
            {user && (
              <>
                <li>
                  <Link href="/routes/new">投稿する</Link>
                </li>
                <li>
                  <Link href="/favorites">お気に入り</Link>
                </li>
              </>
            )}
          </ul>

          <hr />

          <h3>投稿数</h3>
          {loading ? (
            <p>読み込んでいます...</p>
          ) : Object.keys(counts).length === 0 ? (
            <p>まだ投稿がありません。</p>
          ) : (
            <ul>
              {Object.entries(counts)
                .filter(([, count]) => count > 0)
                .map(([code, count]) => (
                  <li key={code}>
                    <Link href={`/routes?prefecture_code=${code}`}>
                      {getPrefectureName(code)}
                    </Link>
                    ：{count} 件
                  </li>
                ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
