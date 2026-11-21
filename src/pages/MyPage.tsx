import { useCallback, useEffect, useMemo, useState } from 'react';
import AuthGuard from '../components/AuthGuard';
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

  const totalRoutes = routes.length;
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
    void loadMyPage();
  }, [loadMyPage]);

  useEffect(() => {
    const handleFollowUpdated = () => {
      void loadMyPage();
    };
    window.addEventListener('dm_follow_updated', handleFollowUpdated);
    return () => window.removeEventListener('dm_follow_updated', handleFollowUpdated);
  }, [loadMyPage]);

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
      <div className="topnav">
        <Link href="/" className="button back-button">
          ← トップ（日本地図）へ戻る
        </Link>
        {isOwnProfile && (
          <Link href="/profile" className="button">
            ⚙️ プロフィール・アカウント設定
          </Link>
        )}
      </div>

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
        <h2>投稿マップ</h2>
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
          <h2>投稿数一覧</h2>
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
          <h2>投稿サマリー</h2>
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

      <section className="panel">
        <h2>{isOwnProfile ? '自分の投稿一覧' : '投稿一覧'}</h2>
        {routes.length === 0 ? (
          <p className="meta">投稿はまだありません。</p>
        ) : (
          <div className="route-list profile-route-scroll">
            {routes.map((route) => (
              <RouteCard key={route.id} route={route} />
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
