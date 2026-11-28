import { useCallback, useEffect, useState } from 'react';
import AuthGuard from '../components/AuthGuard';
import ProfileAvatar from '../components/ProfileAvatar';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { loadProfilesByIds } from '../utils/profileData';
import { getAuthHref, Link, navigate } from '../utils/navigation';
import { getErrorMessage } from '../utils/errors';
import type { ProfileSummary } from '../types/models';

export interface FollowListPageProps {
  mode: 'following' | 'followers';
  id?: string;
}

export default function FollowListPage({ mode, id }: FollowListPageProps) {
  const { user } = useAuth();
  const targetId = id || user?.id;
  const isOwnList = Boolean(user?.id && targetId === user.id);

  const [targetProfile, setTargetProfile] = useState<ProfileSummary | null>(null);
  const [followingProfiles, setFollowingProfiles] = useState<ProfileSummary[]>([]);
  const [followerProfiles, setFollowerProfiles] = useState<ProfileSummary[]>([]);
  const [currentUserFolloweeIds, setCurrentUserFolloweeIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadFollowData = useCallback(async () => {
    if (!supabase || !targetId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, avatar_path, bio')
        .eq('id', targetId)
        .maybeSingle();

      if (profileError) throw profileError;
      setTargetProfile(profileData);

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

      const [followingMap, followerMap] = await Promise.all([
        loadProfilesByIds((followingRows || []).map((row) => row.followee_id)),
        loadProfilesByIds((followerRows || []).map((row) => row.follower_id)),
      ]);

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
        const { data: myFollowingRows } = await supabase
          .from('profile_follows')
          .select('followee_id')
          .eq('follower_id', user.id);
        setCurrentUserFolloweeIds(
          new Set((myFollowingRows || []).map((row) => row.followee_id)),
        );
      } else {
        setCurrentUserFolloweeIds(new Set());
      }
    } catch (loadError) {
      setError(getErrorMessage(loadError, '一覧の取得に失敗しました。'));
    } finally {
      setLoading(false);
    }
  }, [targetId, user]);

  useEffect(() => {
    void loadFollowData();
  }, [loadFollowData]);

  useEffect(() => {
    const handleFollowUpdated = () => {
      void loadFollowData();
    };
    window.addEventListener('dm_follow_updated', handleFollowUpdated);
    return () => window.removeEventListener('dm_follow_updated', handleFollowUpdated);
  }, [loadFollowData]);

  async function toggleFollow(followeeId: string) {
    if (!user) {
      navigate(getAuthHref('/login'));
      return;
    }
    if (!supabase || !followeeId || followeeId === user.id) return;

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

      window.dispatchEvent(new Event('dm_follow_updated'));
      await loadFollowData();
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

  if (loading) return <section className="panel">一覧を読み込んでいます...</section>;

  const followingHref = isOwnList ? '/following' : `/profiles/${targetId}/following`;
  const followersHref = isOwnList ? '/followers' : `/profiles/${targetId}/followers`;
  const activeProfiles = mode === 'following' ? followingProfiles : followerProfiles;
  const pageTitle = mode === 'following' ? 'フォロー一覧' : 'フォロワー一覧';

  return (
    <section className="profile-page">
      <div className="profile-header panel">
        <ProfileAvatar
          profile={targetProfile}
          userId={targetId}
          size="large"
          showName={false}
        />
        <div className="profile-header-info">
          <div className="profile-header-title-row">
            <h1>
              {targetProfile?.name ? `${targetProfile.name} さんの` : ''}
              {pageTitle}
            </h1>
          </div>
          <div className="follow-tabs">
            <Link
              href={followingHref}
              className={`follow-tab-btn ${mode === 'following' ? 'is-active' : ''}`}
            >
              フォロー中（{followingProfiles.length}人）
            </Link>
            <Link
              href={followersHref}
              className={`follow-tab-btn ${mode === 'followers' ? 'is-active' : ''}`}
            >
              フォロワー（{followerProfiles.length}人）
            </Link>
          </div>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      <section className="panel">
        <h2>
          {pageTitle}（{activeProfiles.length}人）
        </h2>
        {activeProfiles.length === 0 ? (
          <p className="meta">
            {mode === 'following'
              ? 'フォローしているユーザーはまだいません。'
              : 'フォロワーはまだいません。'}
          </p>
        ) : (
          <div className="profile-list">
            {activeProfiles.map((item) => (
              <div key={item.id} className="profile-list-row">
                <div className="profile-list-user">
                  <ProfileAvatar
                    profile={item}
                    userId={item.id}
                    size="medium"
                  />
                  {item.bio && <p className="meta">{item.bio}</p>}
                </div>
                {user && user.id !== item.id && (
                  <button
                    type="button"
                    onClick={() => toggleFollow(item.id)}
                    disabled={saving}
                  >
                    {currentUserFolloweeIds.has(item.id)
                      ? 'フォロー解除'
                      : 'フォローする'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
