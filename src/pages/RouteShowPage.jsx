import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { getPrefectureName } from '../utils/prefectures.js';
import { getPublicPhotoUrl, isOwner, likeCount } from '../utils/routeData.js';
import { Link, navigate } from '../utils/navigation.jsx';

const pointLabel = {
  start: 'スタート',
  middle: '中間',
  goal: 'ゴール',
};

export default function RouteShowPage({ id }) {
  const { user } = useAuth();
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const owner = useMemo(() => isOwner(route, user), [route, user]);
  const liked = useMemo(
    () => Boolean(route?.route_likes?.some((like) => like.user_id === user?.id)),
    [route, user],
  );

  async function loadRoute() {
    setLoading(true);
    setError('');

    if (!supabase) {
      setLoading(false);
      return;
    }

    const { data, error: fetchError } = await supabase
      .from('routes')
      .select(
        `
          *,
          route_prefectures(prefecture_code, is_main),
          route_points(point_type, label, address, sort_order),
          route_photos(id, storage_path, thumb_path, sort_order),
          route_likes(user_id)
        `,
      )
      .eq('id', id)
      .order('sort_order', {
        foreignTable: 'route_points',
        ascending: true,
      })
      .order('sort_order', {
        foreignTable: 'route_photos',
        ascending: true,
      })
      .maybeSingle();

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setRoute(data);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadRoute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!selectedPhoto) return undefined;

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setSelectedPhoto(null);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhoto]);

  async function toggleLike() {
    if (!user) {
      navigate('/login');
      return;
    }

    setBusy(true);

    if (liked) {
      await supabase
        .from('route_likes')
        .delete()
        .eq('route_id', id)
        .eq('user_id', user.id);
    } else {
      await supabase.from('route_likes').insert({
        route_id: id,
        user_id: user.id,
      });
    }

    setBusy(false);
    loadRoute();
  }

  async function deleteRoute() {
    if (!owner || !window.confirm('本当に削除しますか？')) return;

    setBusy(true);
    const { error: deleteError } = await supabase
      .from('routes')
      .delete()
      .eq('id', id);

    setBusy(false);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    navigate('/routes');
  }

  if (loading) return <section className="panel">投稿を読み込んでいます...</section>;
  if (error) return <p className="error">{error}</p>;
  if (!route) return <section className="panel">投稿が見つかりません。</section>;

  const subPrefectures =
    route.route_prefectures
      ?.filter((prefecture) => !prefecture.is_main)
      .map((prefecture) => getPrefectureName(prefecture.prefecture_code)) || [];

  return (
    <article>
      <div className="detail-header">
        <div>
          <Link href="/routes">投稿一覧へ戻る</Link>
          <h1>{route.title}</h1>
          <p className="meta">
            投稿日：{new Date(route.created_at).toLocaleString('ja-JP')}
          </p>
        </div>
        <div className="actions">
          <button type="button" onClick={toggleLike} disabled={busy}>
            {liked ? 'いいね解除' : 'いいね'} ({likeCount(route)})
          </button>
          {owner && (
            <>
              <Link href={`/routes/${id}/edit`} className="button secondary">
                編集
              </Link>
              <button type="button" onClick={deleteRoute} disabled={busy}>
                削除
              </button>
            </>
          )}
        </div>
      </div>

      <div className="detail-grid">
        <div className="stack">
          <section className="panel">
            <h2>写真</h2>
            {route.route_photos?.length ? (
              <div className="photo-strip">
                {route.route_photos.map((photo) => (
                  <button
                    key={photo.id}
                    type="button"
                    className="photo-modal-trigger"
                    onClick={() =>
                      setSelectedPhoto(getPublicPhotoUrl(photo.storage_path))
                    }
                    aria-label="写真を拡大表示"
                  >
                    <img
                      src={getPublicPhotoUrl(
                        photo.thumb_path || photo.storage_path,
                      )}
                      alt=""
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            ) : (
              <p className="meta">写真は登録されていません。</p>
            )}
          </section>

          <section className="panel">
            <h2>説明</h2>
            <p className="pre-line">
              {route.description || '説明は未入力です。'}
            </p>
          </section>

          <section className="panel">
            <h2>ルート</h2>
            {route.route_points?.length ? (
              <ol className="point-list">
                {route.route_points.map((point, index) => (
                  <li key={`${point.point_type}-${index}`}>
                    <strong>{pointLabel[point.point_type] || '地点'}:</strong>{' '}
                    {point.label || pointLabel[point.point_type] || '地点'}
                    <div className="meta">
                      {point.address || '住所未入力'}
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="meta">ルート情報は登録されていません。</p>
            )}
          </section>
        </div>

        <aside className="panel">
          <h2>情報</h2>
          <dl className="info-list">
            <dt>概要</dt>
            <dd>{route.summary || '未入力'}</dd>
            <dt>メイン都道府県</dt>
            <dd>{getPrefectureName(route.prefecture_code)}</dd>
            <dt>サブ都道府県</dt>
            <dd>{subPrefectures.length ? subPrefectures.join('、') : '未入力'}</dd>
            <dt>住所</dt>
            <dd>{route.address || '未入力'}</dd>
            <dt>目的地サイト</dt>
            <dd>
              {route.site_url ? (
                <a href={route.site_url} target="_blank" rel="noreferrer">
                  サイトを開く
                </a>
              ) : (
                '未入力'
              )}
            </dd>
          </dl>
        </aside>
      </div>

      {selectedPhoto && (
        <div
          className="photo-modal"
          role="dialog"
          aria-modal="true"
          aria-label="写真の拡大表示"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="photo-modal-content"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="photo-modal-close"
              onClick={() => setSelectedPhoto(null)}
              aria-label="閉じる"
            >
              ×
            </button>
            <img src={selectedPhoto} alt="" />
          </div>
        </div>
      )}
    </article>
  );
}
