import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import RouteCard from '../components/RouteCard';
import PrefectureSelect from '../components/PrefectureSelect';
import { supabase } from '../lib/supabase';
import { loadProfilesByIds } from '../utils/profileData';
import { Link, navigate } from '../utils/navigation';
import { getErrorMessage } from '../utils/errors';
import type { RouteListItem } from '../types/models';

interface RouteFilters {
  q: string;
  prefectureCode: string;
  userId: string;
}

function readInitialFilters(): RouteFilters {
  const params = new URLSearchParams(window.location.search);
  return {
    q: params.get('q') || '',
    prefectureCode: params.get('prefecture_code') || '',
    userId: params.get('user_id') || '',
  };
}

export default function RoutesIndexPage() {
  const [filters, setFilters] = useState(readInitialFilters);
  const { q, prefectureCode, userId } = filters;
  const requestId = useRef(0);
  const [routes, setRoutes] = useState<RouteListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRoutes = useCallback(async (filters: RouteFilters) => {
    const currentRequest = ++requestId.current;
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
    if (currentRequest !== requestId.current) return;

    if (fetchError) {
      setError(fetchError.message);
    } else {
      try {
        const profiles = await loadProfilesByIds(
          (data || []).map((route) => route.user_id),
        );
        if (currentRequest !== requestId.current) return;
        setRoutes(
          (data || []).map((route) => ({
            ...route,
            profile: profiles[route.user_id],
          })),
        );
      } catch (profileError) {
        if (currentRequest !== requestId.current) return;
        setError(
          getErrorMessage(profileError, 'プロフィールの取得に失敗しました。'),
        );
      }
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    function syncFilters() {
      const nextFilters = readInitialFilters();
      setFilters(nextFilters);
      void loadRoutes(nextFilters);
    }
    syncFilters();
    window.addEventListener('popstate', syncFilters);
    return () => {
      window.removeEventListener('popstate', syncFilters);
      requestId.current += 1;
    };
  }, [loadRoutes]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (prefectureCode) params.set('prefecture_code', prefectureCode);
    if (userId) params.set('user_id', userId);
    navigate(`/routes${params.toString() ? `?${params.toString()}` : ''}`);
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
          onChange={(event) => setFilters({ ...filters, q: event.target.value })}
        />
        <PrefectureSelect
          value={prefectureCode}
          onChange={(value) => setFilters({ ...filters, prefectureCode: value })}
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
