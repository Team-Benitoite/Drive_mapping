import { useEffect, useMemo, useState } from 'react';
import AuthGuard from '../components/AuthGuard.jsx';
import JapanMap from '../components/JapanMap.jsx';
import ProfileAvatar from '../components/ProfileAvatar.jsx';
import RouteCard from '../components/RouteCard.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { profileIconBucket, supabase } from '../lib/supabase.js';
import { getPrefectureName } from '../utils/prefectures.js';
import { loadProfilesByIds } from '../utils/profileData.js';
import { Link, navigate } from '../utils/navigation.jsx';

function safeStorageName(file) {
  const extension = file.name.includes('.')
    ? file.name.split('.').pop().toLowerCase()
    : 'jpg';
  const token =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${token}.${extension}`;
}

function ProfileList({ currentUserId, followedIds, onToggleFollow, saving, title, profiles }) {
  return (
    <section className="panel">
      <h2>{title}</h2>
      {profiles.length === 0 ? (
        <p className="meta">まだいません。</p>
      ) : (
        <div className="profile-list">
          {profiles.map((profile) => (
            <div key={profile.id} className="profile-list-row">
              <ProfileAvatar
                profile={profile}
                userId={profile.id}
                size="medium"
              />
              {currentUserId && currentUserId !== profile.id && (
                <button
                  type="button"
                  onClick={() => onToggleFollow(profile.id)}
                  disabled={saving}
                >
                  {followedIds.has(profile.id) ? 'フォロー解除' : 'フォロー'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function ProfilePage({ id }) {
  const { profile: currentProfile, setProfile, user } = useAuth();
  const targetId = id || user?.id;
  const isOwnProfile = Boolean(user?.id && targetId === user.id);
  const [profile, setLocalProfile] = useState(null);
  const [form, setForm] = useState({ bio: '' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [password, setPassword] = useState('');
  const [routes, setRoutes] = useState([]);
  const [counts, setCounts] = useState({});
  const [followingProfiles, setFollowingProfiles] = useState([]);
  const [followerProfiles, setFollowerProfiles] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentUserFolloweeIds, setCurrentUserFolloweeIds] = useState(
    () => new Set(),
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const totalRoutes = useMemo(
    () => Object.values(counts).reduce((sum, count) => sum + count, 0),
    [counts],
  );

  async function loadProfile() {
    setLoading(true);
    setError('');
    setMessage('');

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
    setForm({
      bio: profileData?.bio || '',
    });

    const { data: routeData, error: routesError } = await supabase
      .from('routes')
      .select(
        `
          *,
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

    const nextCounts = {};
    (routeData || []).forEach((route) => {
      const code = Number(route.prefecture_code);
      if (code) nextCounts[code] = (nextCounts[code] || 0) + 1;
    });
    setCounts(nextCounts);

    const [{ data: followingRows }, { data: followerRows }] = await Promise.all([
      supabase
        .from('profile_follows')
        .select('followee_id, created_at')
        .eq('follower_id', targetId)
        .order('created_at', { ascending: false }),
      supabase
        .from('profile_follows')
        .select('follower_id, created_at')
        .eq('followee_id', targetId)
        .order('created_at', { ascending: false }),
    ]);

    const followingMap = await loadProfilesByIds(
      (followingRows || []).map((row) => row.followee_id),
    );
    const followerMap = await loadProfilesByIds(
      (followerRows || []).map((row) => row.follower_id),
    );

    setFollowingProfiles(
      (followingRows || [])
        .map((row) => followingMap[row.followee_id])
        .filter(Boolean),
    );
    setFollowerProfiles(
      (followerRows || [])
        .map((row) => followerMap[row.follower_id])
        .filter(Boolean),
    );

    if (user) {
      const { data: currentFollowingRows } = await supabase
        .from('profile_follows')
        .select('followee_id')
        .eq('follower_id', user.id)
        .order('created_at', { ascending: false });
      const nextFolloweeIds = new Set(
        (currentFollowingRows || []).map((row) => row.followee_id),
      );
      setCurrentUserFolloweeIds(nextFolloweeIds);
      setIsFollowing(nextFolloweeIds.has(targetId));
    } else {
      setCurrentUserFolloweeIds(new Set());
      setIsFollowing(false);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetId, user?.id]);

  async function handleProfileSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      let avatarPath = profile?.avatar_path || null;

      if (avatarFile) {
        avatarPath = `${user.id}/${safeStorageName(avatarFile)}`;
        const { error: uploadError } = await supabase.storage
          .from(profileIconBucket)
          .upload(avatarPath, avatarFile, { upsert: true });
        if (uploadError) throw uploadError;
      }

      const payload = {
        id: user.id,
        name: profile?.name || currentProfile?.name || user.email?.split('@')[0] || 'ユーザー',
        bio: form.bio.trim() || null,
        avatar_path: avatarPath,
      };

      const { data, error: updateError } = await supabase
        .from('profiles')
        .upsert(payload)
        .select('id, name, avatar_path, bio')
        .single();

      if (updateError) throw updateError;

      setLocalProfile(data);
      setProfile(data);
      setAvatarFile(null);
      setMessage('プロフィールを保存しました。');
    } catch (submitError) {
      setError(submitError.message || 'プロフィールの保存に失敗しました。');
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });
      if (updateError) throw updateError;
      setPassword('');
      setMessage('パスワードを変更しました。');
    } catch (submitError) {
      setError(submitError.message || 'パスワード変更に失敗しました。');
    } finally {
      setSaving(false);
    }
  }

  async function toggleFollow(followeeId = targetId) {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!followeeId || followeeId === user.id) return;

    setSaving(true);
    setError('');

    try {
      if (currentUserFolloweeIds.has(followeeId)) {
        const { error: deleteError } = await supabase
          .from('profile_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('followee_id', followeeId);
        if (deleteError) throw deleteError;
      } else {
        const { error: insertError } = await supabase
          .from('profile_follows')
          .insert({ follower_id: user.id, followee_id: followeeId });
        if (insertError) throw insertError;
      }

      await loadProfile();
    } catch (followError) {
      setError(followError.message || 'フォローの更新に失敗しました。');
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

  if (loading) return <section className="panel">プロフィールを読み込んでいます...</section>;
  if (error && !profile) return <p className="error">{error}</p>;

  return (
    <section>
      <div className="topnav">
        <Link href="/">← トップ（日本地図）へ戻る</Link>
      </div>

      <div className="profile-header panel">
        <ProfileAvatar
          profile={profile || currentProfile}
          userId={targetId}
          size="large"
          showName={false}
        />
        <div>
          <h1>{profile?.name || 'プロフィール'}</h1>
          <p className="pre-line">{profile?.bio || '自己紹介は未入力です。'}</p>
          {!isOwnProfile && (
            <button type="button" onClick={toggleFollow} disabled={saving}>
              {isFollowing ? 'フォロー解除' : 'フォローする'}
            </button>
          )}
        </div>
      </div>

      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}

      {isOwnProfile && (
        <div className="profile-grid">
          <section className="panel">
            <h2>アイコン設定・自己紹介</h2>
            <form onSubmit={handleProfileSubmit}>
              <label>
                アイコン画像
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) =>
                    setAvatarFile(event.target.files?.[0] || null)
                  }
                />
              </label>
              <label>
                自己紹介
                <textarea
                  maxLength={1000}
                  value={form.bio}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      bio: event.target.value,
                    }))
                  }
                />
              </label>
              <button type="submit" disabled={saving}>
                保存する
              </button>
            </form>
          </section>

          <section className="panel">
            <h2>パスワード変更</h2>
            <form onSubmit={handlePasswordSubmit}>
              <label>
                新しいパスワード
                <input
                  type="password"
                  minLength={6}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </label>
              <button type="submit" disabled={saving}>
                変更する
              </button>
            </form>
          </section>
        </div>
      )}

      <div className="profile-grid">
        <section className="panel">
          <h2>投稿マップ</h2>
          <div className="map-wrap profile-map">
            <JapanMap
              counts={counts}
              hrefForCode={(code) =>
                `/routes?prefecture_code=${code}&user_id=${targetId}`
              }
            />
          </div>
        </section>

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
      </div>

      <div className="profile-grid">
        <ProfileList
          currentUserId={user?.id}
          followedIds={currentUserFolloweeIds}
          onToggleFollow={toggleFollow}
          profiles={followingProfiles}
          saving={saving}
          title="フォロー一覧"
        />
        <ProfileList
          currentUserId={user?.id}
          followedIds={currentUserFolloweeIds}
          onToggleFollow={toggleFollow}
          profiles={followerProfiles}
          saving={saving}
          title="フォロワー一覧"
        />
      </div>

      <section className="panel">
        <h2>投稿一覧</h2>
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
