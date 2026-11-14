import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { googleMapsApiKey, supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  buildGoogleMapsDirectionsUrl,
  buildGoogleMapsEmbedUrl,
  getSafeGoogleMapsUrl,
} from '../utils/googleMaps';
import { getPrefectureName } from '../utils/prefectures';
import { getPublicPhotoUrl, isOwner, likeCount } from '../utils/routeData';
import { getAuthHref, Link, navigate } from '../utils/navigation';
import type { PointType } from '../types/database';
import type { RouteDetail } from '../types/models';
import { getErrorMessage } from '../utils/errors';

const pointLabel: Record<PointType, string> = {
  start: 'スタート',
  middle: '中間',
  goal: 'ゴール',
};

export default function RouteShowPage({ id }: { id: number }) {
  const { user } = useAuth();
  const [route, setRoute] = useState<RouteDetail | null>(null);
  const [favorited, setFavorited] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  const owner = useMemo(() => isOwner(route, user), [route, user]);
  const liked = useMemo(
    () => Boolean(route?.route_likes?.some((like) => like.user_id === user?.id)),
    [route, user],
  );

  const photos = useMemo(() => route?.route_photos || [], [route]);

  const loadRoute = useCallback(async () => {
    setLoading(true);
    setError('');
    setActionError('');

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
      setLoading(false);
      return;
    }

    setRoute(data);
    setActiveSlide(0);

    if (user && data) {
      const { data: favData, error: favError } = await supabase
        .from('route_favorite')
        .select('id')
        .eq('route_id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!favError) {
        setFavorited(Boolean(favData));
      } else {
        setFavorited(false);
      }
    } else {
      setFavorited(false);
    }

    setLoading(false);
  }, [id, user]);

  useEffect(() => {
    void loadRoute();
  }, [loadRoute]);

  useEffect(() => {
    if (selectedPhotoIndex === null) return undefined;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setSelectedPhotoIndex(null);
      } else if (event.key === 'ArrowRight' && photos.length > 1) {
        setSelectedPhotoIndex((current) =>
          current === null ? null : (current + 1) % photos.length,
        );
      } else if (event.key === 'ArrowLeft' && photos.length > 1) {
        setSelectedPhotoIndex((current) =>
          current === null ? null : (current - 1 + photos.length) % photos.length,
        );
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhotoIndex, photos.length]);

  function scrollToSlide(index: number) {
    const clamped = Math.max(0, Math.min(index, photos.length - 1));
    setActiveSlide(clamped);
    if (carouselRef.current) {
      carouselRef.current.scrollTo({
        left: clamped * carouselRef.current.clientWidth,
        behavior: 'smooth',
      });
    }
  }

  function handleCarouselScroll() {
    const track = carouselRef.current;
    if (!track || track.clientWidth <= 0) return;
    const nextIndex = Math.round(track.scrollLeft / track.clientWidth);
    if (nextIndex !== activeSlide && nextIndex >= 0 && nextIndex < photos.length) {
      setActiveSlide(nextIndex);
    }
  }

  async function toggleLike() {
    if (!user) {
      navigate(getAuthHref('/login'));
      return;
    }

    if (!supabase) return;

    setBusy(true);
    setActionError('');

    try {
      const { error: updateError } = liked
        ? await supabase
            .from('route_likes')
            .delete()
            .eq('route_id', id)
            .eq('user_id', user.id)
        : await supabase.from('route_likes').insert({
            route_id: id,
            user_id: user.id,
          });
      if (updateError) throw updateError;
      await loadRoute();
    } catch (updateError) {
      setActionError(getErrorMessage(updateError, 'いいねの更新に失敗しました。'));
    } finally {
      setBusy(false);
    }
  }

  async function toggleFavorite() {
    if (!user) {
      navigate(getAuthHref('/login'));
      return;
    }

    if (!supabase) return;

    setBusy(true);
    setActionError('');

    try {
      const { error: updateError } = favorited
        ? await supabase
            .from('route_favorite')
            .delete()
            .eq('route_id', id)
            .eq('user_id', user.id)
        : await supabase.from('route_favorite').insert({
            route_id: id,
            user_id: user.id,
          });
      if (updateError) throw updateError;
      setFavorited(!favorited);
    } catch (updateError) {
      setActionError(
        getErrorMessage(updateError, 'お気に入りの更新に失敗しました。'),
      );
    } finally {
      setBusy(false);
    }
  }

  async function deleteRoute() {
    if (!owner || !window.confirm('本当に削除しますか？')) return;
    if (!supabase) return;

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
  const googleMapsDirectionsUrl = buildGoogleMapsDirectionsUrl(route);
  const googleMapsSharedUrl = getSafeGoogleMapsUrl(route.google_maps_url);
  const googleMapsEmbedUrl = buildGoogleMapsEmbedUrl(
    route,
    googleMapsApiKey,
  );
  const selectedPhotoUrl =
    selectedPhotoIndex !== null && photos[selectedPhotoIndex]
      ? getPublicPhotoUrl(photos[selectedPhotoIndex].storage_path)
      : null;

  return (
    <article className="route-detail-page">
      <div className="detail-header">
        <div className="detail-title-block">
          <div className="detail-back-wrap">
            <Link href="/routes" className="button back-button">
              ← 投稿一覧へ戻る
            </Link>
          </div>
          <h1>{route.title}</h1>
          <p className="meta">
            投稿日：{new Date(route.created_at).toLocaleString('ja-JP')}
          </p>
        </div>
        <div className="actions detail-actions">
          <button
            type="button"
            onClick={toggleFavorite}
            disabled={busy}
            className={`favorite-star-btn ${favorited ? 'is-active' : ''}`}
            aria-pressed={favorited}
          >
            <span className="favorite-star-icon" aria-hidden="true">
              {favorited ? '★' : '☆'}
            </span>
            <span>{favorited ? 'お気に入り済み' : 'お気に入り'}</span>
          </button>
          <button
            type="button"
            onClick={toggleLike}
            disabled={busy}
            className={`like-heart-btn ${liked ? 'is-active' : ''}`}
            aria-pressed={liked}
          >
            <span aria-hidden="true">{liked ? '♥' : '♡'}</span>
            <span>
              {liked ? 'いいね済み' : 'いいね'} ({likeCount(route)})
            </span>
          </button>
          {owner && (
            <>
              <Link href={`/routes/${id}/edit`} className="button secondary">
                編集
              </Link>
              <button
                type="button"
                onClick={deleteRoute}
                disabled={busy}
                className="danger-button"
              >
                削除
              </button>
            </>
          )}
        </div>
      </div>

      {actionError && (
        <p className="error" role="alert">
          {actionError}
        </p>
      )}

      <div className="detail-grid">
        <div className="stack">
          <section className="panel">
            <h2>写真</h2>
            {photos.length ? (
              <div className="photo-carousel">
                <div className="photo-carousel-frame">
                  <div
                    ref={carouselRef}
                    className="photo-carousel-track"
                    onScroll={handleCarouselScroll}
                  >
                    {photos.map((photo, index) => (
                      <div key={photo.id} className="photo-carousel-slide">
                        <button
                          type="button"
                          className="photo-modal-trigger photo-carousel-trigger"
                          onClick={() => setSelectedPhotoIndex(index)}
                          aria-label={`写真 ${index + 1} を拡大表示`}
                        >
                          <img
                            src={getPublicPhotoUrl(photo.storage_path)}
                            alt={`${route.title}の写真 ${index + 1}`}
                            loading="lazy"
                            className="photo-carousel-img"
                          />
                        </button>
                      </div>
                    ))}
                  </div>

                  {photos.length > 1 && (
                    <>
                      <button
                        type="button"
                        className="carousel-nav-btn carousel-prev"
                        onClick={() =>
                          scrollToSlide(
                            (activeSlide - 1 + photos.length) % photos.length,
                          )
                        }
                        aria-label="前の写真へ"
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        className="carousel-nav-btn carousel-next"
                        onClick={() =>
                          scrollToSlide((activeSlide + 1) % photos.length)
                        }
                        aria-label="次の写真へ"
                      >
                        ›
                      </button>
                      <div className="carousel-counter" aria-live="polite">
                        {activeSlide + 1} / {photos.length}
                      </div>
                    </>
                  )}
                </div>

                {photos.length > 1 && (
                  <div className="carousel-dots" role="tablist" aria-label="写真の選択">
                    {photos.map((photo, index) => (
                      <button
                        key={photo.id}
                        type="button"
                        role="tab"
                        aria-selected={index === activeSlide}
                        aria-label={`写真 ${index + 1}`}
                        className={`carousel-dot ${index === activeSlide ? 'is-active' : ''}`}
                        onClick={() => scrollToSlide(index)}
                      />
                    ))}
                  </div>
                )}
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

          {(googleMapsDirectionsUrl || googleMapsSharedUrl) && (
            <section className="panel google-maps-panel">
              <div className="google-maps-heading">
                <div>
                  <h2 className="google-maps-title">Google Maps経路</h2>
                  <p className="meta">
                    登録地点または保存された共有URLから経路を確認できます。
                  </p>
                </div>
                <div className="actions">
                  {googleMapsDirectionsUrl && (
                    <a
                      href={googleMapsDirectionsUrl}
                      className="button"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      登録地点から経路を開く
                    </a>
                  )}
                  {googleMapsSharedUrl && (
                    <a
                      href={googleMapsSharedUrl}
                      className="button secondary"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      保存した共有経路を開く
                    </a>
                  )}
                </div>
              </div>

              {googleMapsEmbedUrl && (
                <div className="google-maps-embed">
                  <iframe
                    title={`${route.title}のGoogle Maps経路`}
                    src={googleMapsEmbedUrl}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                  />
                </div>
              )}
            </section>
          )}
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

      {selectedPhotoUrl && (
        <div
          className="photo-modal"
          role="dialog"
          aria-modal="true"
          aria-label="写真の拡大表示"
          onClick={() => setSelectedPhotoIndex(null)}
        >
          <div
            className="photo-modal-content"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="photo-modal-close"
              onClick={() => setSelectedPhotoIndex(null)}
              aria-label="閉じる"
            >
              ×
            </button>
            {photos.length > 1 && selectedPhotoIndex !== null && (
              <>
                <button
                  type="button"
                  className="carousel-nav-btn carousel-prev modal-nav"
                  onClick={() =>
                    setSelectedPhotoIndex(
                      (selectedPhotoIndex - 1 + photos.length) % photos.length,
                    )
                  }
                  aria-label="前の写真へ"
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="carousel-nav-btn carousel-next modal-nav"
                  onClick={() =>
                    setSelectedPhotoIndex((selectedPhotoIndex + 1) % photos.length)
                  }
                  aria-label="次の写真へ"
                >
                  ›
                </button>
              </>
            )}
            <img src={selectedPhotoUrl} alt="" />
          </div>
        </div>
      )}
    </article>
  );
}

