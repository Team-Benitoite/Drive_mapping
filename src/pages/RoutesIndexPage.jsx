import { useEffect, useMemo, useState } from 'react';
import RouteCard from '../components/RouteCard.jsx';
import PrefectureSelect from '../components/PrefectureSelect.jsx';
import { supabase } from '../lib/supabase.js';
import { loadProfilesByIds } from '../utils/profileData.js';
import { Link, navigate } from '../utils/navigation.jsx';

function readInitialFilters() {
  const params = new URLSearchParams(window.location.search);
  return {
    q: params.get('q') || '',
    prefectureCode: params.get('prefecture_code') || '',
    userId: params.get('user_id') || '',
  };
}

export default function RoutesIndexPage() {
  const initialFilters = useMemo(readInitialFilters, []);
  const [q, setQ] = useState(initialFilters.q);
  const [prefectureCode, setPrefectureCode] = useState(
    initialFilters.prefectureCode,
  );
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadRoutes(filters = { q, prefectureCode, userId: initialFilters.userId }) {
    setLoading(true);
    setError('');

    if (!supabase) {
      setLoading(false);
      return;
    }

    let query = supabase
      .from('routes')
      .select(
        `
          *,
          route_photos(storage_path, thumb_path, sort_order),
          route_likes(user_id)
        `,
      )
      .order('created_at', { ascending: false })
      .order('sort_order', {
        foreignTable: 'route_photos',
        ascending: true,
      });

    if (filters.q.trim()) {
      const keyword = filters.q.trim().replaceAll(',', ' ');
      query = query.or(
        `title.ilike.%${keyword}%,summary.ilike.%${keyword}%,description.ilike.%${keyword}%`,
      );
    }

    if (filters.prefectureCode) {
      query = query.eq('prefecture_code', Number(filters.prefectureCode));
    }

    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }

    const { data, error: fetchError } = await query;

    if (fetchError) {
      setError(fetchError.message);
    } else {
      try {
        const profiles = await loadProfilesByIds(
          (data || []).map((route) => route.user_id),
        );
        setRoutes(
          (data || []).map((route) => ({
            ...route,
            profile: profiles[route.user_id],
          })),
        );
      } catch (profileError) {
        setError(profileError.message);
      }
    }

    setLoading(false);
  }

  useEffect(() => {
    loadRoutes(initialFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubmit(event) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (prefectureCode) params.set('prefecture_code', prefectureCode);
    if (initialFilters.userId) params.set('user_id', initialFilters.userId);
    navigate(`/routes${params.toString() ? `?${params.toString()}` : ''}`);
    loadRoutes({ q, prefectureCode, userId: initialFilters.userId });
  }

  return (
    <section>
      <div className="topnav">
        <Link href="/">← トップ（日本地図）へ戻る</Link>
        <Link href="/routes/new">＋ 投稿する</Link>
      </div>

      <div className="page-heading">
        <h1>投稿一覧</h1>
      </div>

      <form className="search" onSubmit={handleSubmit}>
        <input
          type="search"
          placeholder="キーワード（タイトル/概要/説明）"
          value={q}
          onChange={(event) => setQ(event.target.value)}
        />
        <PrefectureSelect
          value={prefectureCode}
          onChange={setPrefectureCode}
        />
        <button type="submit">検索</button>
      </form>

      {loading && <div className="panel">投稿を読み込んでいます...</div>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && routes.length === 0 && (
        <div className="panel">該当する投稿がありません。</div>
      )}

      <div className="list">
        {routes.map((route) => (
          <RouteCard key={route.id} route={route} />
        ))}
      </div>
    </section>
  );
}
