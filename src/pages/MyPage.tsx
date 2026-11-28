import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AuthGuard from '../components/AuthGuard';
import HelpTip from '../components/HelpTip';
import JapanMap from '../components/JapanMap';
import ProfileAvatar from '../components/ProfileAvatar';
import RouteCard from '../components/RouteCard';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { getRouteGoogleMapsUrl } from '../utils/googleMaps';
import { getPrefectureName } from '../utils/prefectures';
import { getPublicPhotoUrl } from '../utils/routeData';
import { getAuthHref, Link, navigate } from '../utils/navigation';
import { getErrorMessage } from '../utils/errors';
import type {
  PrefectureCounts,
  ProfileSummary,
  RouteListItem,
  RouteLocationPoint,
  TopPrefecture,
} from '../types/models';

const ROUTES_PER_PAGE = 20;

function getPageNumbers(currentPage: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  const pages: (number | 'ellipsis')[] = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) pages.push('ellipsis');
  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }
  if (end < totalPages - 1) pages.push('ellipsis');
  pages.push(totalPages);
  return pages;
}

export default function MyPage({ id }: { id?: string }) {
  const { profile: currentProfile, user } = useAuth();
  const targetId = id || user?.id;
  const isOwnProfile = Boolean(user?.id && targetId === user.id);

  const [profile, setLocalProfile] = useState<ProfileSummary | null>(null);
  const [routes, setRoutes] = useState<
    (RouteListItem & { route_points?: RouteLocationPoint[] | null })[]
  >([]);
  const [counts, setCounts] = useState<PrefectureCounts>({});
  const [followingCount, setFollowingCount] = useState(0);
  const [followerCount, setFollowerCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const routesSectionRef = useRef<HTMLElement | null>(null);
  const routeListScrollRef = useRef<HTMLDivElement | null>(null);

  const totalRoutes = routes.length;
  const totalPages = Math.max(1, Math.ceil(totalRoutes / ROUTES_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedRoutes = useMemo(() => {
    const startIndex = (safePage - 1) * ROUTES_PER_PAGE;
    return routes.slice(startIndex, startIndex + ROUTES_PER_PAGE);
  }, [routes, safePage]);
  const pageNumbers = useMemo(
    () => getPageNumbers(safePage, totalPages),
    [safePage, totalPages],
  );
  const totalLikes = useMemo(
    () =>
      routes.reduce(
        (sum, route) => sum + (route.route_likes?.length || 0),
        0,
      ),
    [routes],
  );

  const userTopPrefectures = useMemo<TopPrefecture[]>(() => {
    if (routes.length === 0) return [];
    return [...routes]
      .sort(
        (left, right) =>
          (right.route_likes?.length || 0) - (left.route_likes?.length || 0) ||
          new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
      )
      .slice(0, 3)
      .map((route) => {
        const firstPhoto = route.route_photos?.[0];
        return {
          route_id: route.id,
          prefecture_code: route.prefecture_code,
          title: route.title,
          like_count: route.route_likes?.length || 0,
          image_url:
            getPublicPhotoUrl(firstPhoto?.thumb_path || firstPhoto?.storage_path) ||
            null,
          google_maps_url: getRouteGoogleMapsUrl({
            address: route.address,
            google_maps_url: route.google_maps_url,
            route_points: route.route_points,
            title: route.title,
            prefecture_name: getPrefectureName(route.prefecture_code),
          }),
        };
      });
  }, [routes]);

  const userPopularRoutes = useMemo<Record<number, TopPrefecture>>(() => {
    const map: Record<number, TopPrefecture> = {};
    const sorted = [...routes].sort(
      (left, right) =>
        (right.route_likes?.length || 0) - (left.route_likes?.length || 0) ||
        new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
    );
    for (const route of sorted) {
      const prefCodes = Array.from(
        new Set(
          [
            route.prefecture_code,
            ...(route.route_prefectures || []).map((pref) => pref.prefecture_code),
          ].filter((code): code is number => Number.isFinite(code) && code > 0),
        ),
      );
      const firstPhoto = route.route_photos?.[0];
      const imageUrl =
        getPublicPhotoUrl(firstPhoto?.thumb_path || firstPhoto?.storage_path) ||
        null;
      const mapsUrl = getRouteGoogleMapsUrl({
        address: route.address,
        google_maps_url: route.google_maps_url,
        route_points: route.route_points,
        title: route.title,
        prefecture_name: getPrefectureName(route.prefecture_code),
      });

      for (const code of prefCodes) {
        if (!map[code]) {
          map[code] = {
            route_id: route.id,
            prefecture_code: code,
            title: route.title,
            like_count: route.route_likes?.length || 0,
            image_url: imageUrl,
            google_maps_url: mapsUrl,
          };
        }
      }
    }
    return map;
  }, [routes]);

  const loadMyPage = useCallback(async () => {
    setLoading(true);
    setError('');

    if (!supabase || !targetId) {
      setLoading(false);
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, avatar_path, bio')
      .eq('id', targetId)
      .maybeSingle();

    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return;
    }

    setLocalProfile(profileData);

    const { data: routeData, error: routesError } = await supabase
      .from('routes')
      .select(
        `
          *,
          route_prefectures(prefecture_code, is_main),
          route_points(label, address, sort_order),
          route_photos(storage_path, thumb_path, sort_order),
          route_likes(user_id)
        `,
      )
      .eq('user_id', targetId)
      .order('created_at', { ascending: false })
      .order('sort_order', {
        foreignTable: 'route_photos',
        ascending: true,
      });

    if (routesError) {
      setError(routesError.message);
      setLoading(false);
      return;
    }

    setRoutes((routeData || []).map((route) => ({ ...route, profile: profileData })));

    const nextCounts: PrefectureCounts = {};
    (routeData || []).forEach((route) => {
      const prefCodes = Array.from(
        new Set(
          [
            Number(route.prefecture_code),
            ...(route.route_prefectures || []).map((pref) =>
              Number(pref.prefecture_code),
            ),
          ].filter((code) => Number.isFinite(code) && code > 0),
        ),
      );
      prefCodes.forEach((code) => {
        nextCounts[code] = (nextCounts[code] || 0) + 1;
      });
    });
    setCounts(nextCounts);

    const [{ count: nextFollowingCount }, { count: nextFollowerCount }] = await Promise.all([
      supabase
        .from('profile_follows')
        .select('followee_id', { count: 'exact', head: true })
        .eq('follower_id', targetId),
      supabase
        .from('profile_follows')
        .select('follower_id', { count: 'exact', head: true })
        .eq('followee_id', targetId),
    ]);

    setFollowingCount(nextFollowingCount || 0);
    setFollowerCount(nextFollowerCount || 0);

    if (user && !isOwnProfile) {
      const { data: followRow } = await supabase
        .from('profile_follows')
        .select('followee_id')
        .eq('follower_id', user.id)
        .eq('followee_id', targetId)
        .maybeSingle();
      setIsFollowing(Boolean(followRow));
    } else {
      setIsFollowing(false);
    }

    setLoading(false);
  }, [isOwnProfile, targetId, user]);

  useEffect(() => {
    setCurrentPage(1);
    void loadMyPage();
  }, [loadMyPage]);

  useEffect(() => {
    const handleFollowUpdated = () => {
      void loadMyPage();
    };
    window.addEventListener('dm_follow_updated', handleFollowUpdated);
    return () => window.removeEventListener('dm_follow_updated', handleFollowUpdated);
  }, [loadMyPage]);

  function handlePageChange(nextPage: number) {
    const clamped = Math.max(1, Math.min(nextPage, totalPages));
    setCurrentPage(clamped);
    if (routeListScrollRef.current) {
      routeListScrollRef.current.scrollTop = 0;
    }
    routesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function toggleFollow() {
    if (!user) {
      navigate(getAuthHref('/login'));
      return;
    }
    if (!targetId || targetId === user.id || !supabase) return;

    setSaving(true);
    setError('');

    try {
      if (isFollowing) {
        const { error: deleteError } = await supabase
          .from('profile_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('followee_id', targetId);
        if (deleteError) throw deleteError;
      } else {
        const { error: insertError } = await supabase
          .from('profile_follows')
          .insert({ follower_id: user.id, followee_id: targetId });
        if (insertError) throw insertError;
      }

      window.dispatchEvent(new Event('dm_follow_updated'));
      await loadMyPage();
    } catch (followError) {
      setError(getErrorMessage(followError, 'フォローの更新に失敗しました。'));
    } finally {
      setSaving(false);
    }
  }

  if (!targetId) {
    return (
      <AuthGuard>
        <section />
      </AuthGuard>
    );
  }

  if (loading) return <section className="panel">マイページを読み込んでいます...</section>;
  if (error && !profile) return <p className="error">{error}</p>;

  const followingHref = isOwnProfile ? '/following' : `/profiles/${targetId}/following`;
  const followersHref = isOwnProfile ? '/followers' : `/profiles/${targetId}/followers`;

  return (
    <section className="profile-page">
      <div className="profile-header panel">
        <ProfileAvatar
          profile={profile || (isOwnProfile ? currentProfile : null)}
          userId={targetId}
          size="large"
          showName={false}
        />
        <div className="profile-header-info">
          <div className="profile-header-title-row">
            <h1>{profile?.name || (isOwnProfile ? 'マイページ' : 'ユーザー')}</h1>
            <span className="profile-role-badge">
              {isOwnProfile ? 'MY PAGE' : 'DRIVER'}
            </span>
            <HelpTip
              title={isOwnProfile ? 'マイページ' : 'ドライバープロフィール'}
              description={
                isOwnProfile
                  ? 'あなた自身が投稿したルートや走破した都道府県マップ、いいね数・フォロー数を確認できるホーム画面です。'
                  : 'このドライバーが投稿したルートや日本地図、フォロー状況を確認できる画面です。'
              }
              usage={
                isOwnProfile
                  ? 'アイコンや自己紹介を変更したい場合は、右上の「☰」メニュー内の「プロフィール」から設定できます。'
                  : '「フォローする」ボタンで相手をフォローしてマイページからいつでも見返せます。'
              }
            />
          </div>
          <p className="pre-line">{profile?.bio || '自己紹介は未入力です。'}</p>
          {!isOwnProfile && (
            <button
              type="button"
              onClick={toggleFollow}
              disabled={saving}
            >
              {isFollowing ? 'フォロー解除' : 'フォローする'}
            </button>
          )}
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      <section className="panel profile-map-panel">
        <div className="heading-with-help section-heading-with-help">
          <h2>投稿マップ</h2>
          <HelpTip
            title="投稿マップ"
            description="このユーザーが投稿したルート（メイン・サブ都道府県）だけを日本地図上に可視化したマップです。"
            usage="右上の「投稿件数」をONにすると投稿数に応じて都道府県の色が変わります。県マスをクリックするとそのユーザーの該当県ルートだけを見られます。"
          />
        </div>
        <JapanMap
          counts={counts}
          topPrefectures={userTopPrefectures}
          popularRoutes={userPopularRoutes}
          showTopCards={routes.length > 0}
          strictTopCards={true}
          topCardsBadge="MY POPULAR ROUTES"
          topCardsTitle={
            isOwnProfile
              ? '自分の投稿のいいね人気順'
              : `${profile?.name || 'ユーザー'}さんの人気投稿`
          }
          showHeatToggle={true}
          hrefForCode={(code) =>
            `/routes?prefecture_code=${code}&user_id=${targetId}`
          }
        />
      </section>

      <div className="profile-grid">
        <section className="panel">
          <div className="heading-with-help section-heading-with-help">
            <h2>投稿数一覧</h2>
            <HelpTip
              title="投稿数一覧"
              description="都道府県ごとの投稿件数をリストで確認できるボックスです。"
              usage="都道府県名をクリックすると、このユーザーのその県の投稿一覧ページへ移動します。"
            />
          </div>
          <div className="profile-count-scroll">
            {totalRoutes === 0 ? (
              <p className="meta">まだ投稿がありません。</p>
            ) : (
              <ul>
                {Object.entries(counts)
                  .filter(([, count]) => count > 0)
                  .map(([code, count]) => (
                    <li key={code}>
                      <Link href={`/routes?prefecture_code=${code}&user_id=${targetId}`}>
                        {getPrefectureName(code)}
                      </Link>
                      ：{count} 件
                    </li>
                  ))}
              </ul>
            )}
            <p className="meta">合計：{totalRoutes} 件</p>
          </div>
        </section>

        <section className="panel">
          <div className="heading-with-help section-heading-with-help">
            <h2>投稿サマリー</h2>
            <HelpTip
              title="投稿サマリー"
              description="総投稿数・獲得いいね合計・フォロー中・フォロワー数をひと目で確認できる集計パネルです。"
              usage="「一覧を見る →」ボタンをクリックすると、フォロー中・フォロワーのユーザー一覧画面へ移動できます。"
            />
          </div>
          <dl className="info-list">
            <dt>総投稿数</dt>
            <dd>{totalRoutes} 件</dd>
            <dt>獲得いいね合計</dt>
            <dd>{totalLikes} pt</dd>
            <dt>フォロー中</dt>
            <dd className="summary-count-row">
              <span className="summary-count-value">{followingCount} 人</span>
              <Link href={followingHref} className="summary-jump-btn">
                一覧を見る →
              </Link>
            </dd>
            <dt>フォロワー</dt>
            <dd className="summary-count-row">
              <span className="summary-count-value">{followerCount} 人</span>
              <Link href={followersHref} className="summary-jump-btn">
                一覧を見る →
              </Link>
            </dd>
          </dl>
        </section>
      </div>

      <section className="panel" ref={routesSectionRef}>
        <div className="profile-section-header">
          <div className="heading-with-help">
            <h2>{isOwnProfile ? '自分の投稿一覧' : '投稿一覧'}</h2>
            <HelpTip
              title={isOwnProfile ? '自分の投稿一覧' : '投稿一覧'}
              description="投稿したドライブコースが新しい順に最大20件ずつ表示されます。"
              usage="カードをクリックして詳細の確認や編集・削除が行えます。21件以上ある場合は下のページ番号で切り替えられます。"
            />
          </div>
          {totalRoutes > 0 && (
            <span className="meta">
              全 {totalRoutes} 件中 {(safePage - 1) * ROUTES_PER_PAGE + 1}〜
              {Math.min(safePage * ROUTES_PER_PAGE, totalRoutes)} 件を表示
            </span>
          )}
        </div>
        {routes.length === 0 ? (
          <p className="meta">投稿はまだありません。</p>
        ) : (
          <>
            <div className="route-list profile-route-scroll" ref={routeListScrollRef}>
              {paginatedRoutes.map((route) => (
                <RouteCard key={route.id} route={route} />
              ))}
            </div>

            {totalPages > 1 && (
              <nav className="pagination-bar" aria-label="投稿一覧のページネーション">
                <button
                  type="button"
                  className="pagination-btn"
                  onClick={() => handlePageChange(safePage - 1)}
                  disabled={safePage <= 1}
                >
                  ← 前へ
                </button>

                <div className="pagination-pages">
                  {pageNumbers.map((item, index) =>
                    item === 'ellipsis' ? (
                      <span
                        key={`ellipsis-${index}`}
                        className="pagination-ellipsis"
                        aria-hidden="true"
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={item}
                        type="button"
                        className={`pagination-btn ${
                          item === safePage ? 'is-active' : ''
                        }`}
                        aria-current={item === safePage ? 'page' : undefined}
                        onClick={() => handlePageChange(item)}
                      >
                        {item}
                      </button>
                    ),
                  )}
                </div>

                <button
                  type="button"
                  className="pagination-btn"
                  onClick={() => handlePageChange(safePage + 1)}
                  disabled={safePage >= totalPages}
                >
                  次へ →
                </button>
              </nav>
            )}
          </>
        )}
      </section>
    </section>
  );
}
