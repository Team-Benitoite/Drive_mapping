import { useCallback, useEffect, useState, type FormEvent } from 'react';
import AuthGuard from '../components/AuthGuard';
import ProfileAvatar from '../components/ProfileAvatar';
import { useAuth } from '../contexts/AuthContext';
import { profileIconBucket, supabase } from '../lib/supabase';
import { loadProfilesByIds } from '../utils/profileData';
import { Link } from '../utils/navigation';
import { getErrorMessage } from '../utils/errors';
import type { ProfileSummary } from '../types/models';

const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function safeStorageName(file: File): string {
  const extension = file.name.includes('.')
    ? file.name.split('.').pop()?.toLowerCase() || 'jpg'
    : 'jpg';
  const token =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${token}.${extension}`;
}

interface FollowSectionProps {
  id: string;
  title: string;
  listHref: string;
  profiles: ProfileSummary[];
  currentUserId: string | undefined;
  followedIds: Set<string>;
  saving: boolean;
  onToggleFollow: (followeeId: string) => void;
}

function FollowSection({
  id,
  title,
  listHref,
  profiles,
  currentUserId,
  followedIds,
  saving,
  onToggleFollow,
}: FollowSectionProps) {
  return (
    <section id={id} className="panel">
      <div className="profile-section-header">
        <h2>
          {title}（{profiles.length}人）
        </h2>
        <Link href={listHref} className="summary-jump-btn">
          専用一覧へ →
        </Link>
      </div>
      {profiles.length === 0 ? (
        <p className="meta">まだいません。</p>
      ) : (
        <div className="profile-list profile-follow-scroll">
          {profiles.map((item) => (
            <div key={item.id} className="profile-list-row">
              <div className="profile-list-user">
                <ProfileAvatar
                  profile={item}
                  userId={item.id}
                  size="medium"
                />
                {item.bio && <p className="meta">{item.bio}</p>}
              </div>
              {currentUserId && currentUserId !== item.id && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    onToggleFollow(item.id);
                  }}
                  disabled={saving}
                >
                  {followedIds.has(item.id) ? 'フォロー解除' : 'フォローする'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function ProfileSettingsPage() {
  const { profile: currentProfile, setProfile, user } = useAuth();
  const [profile, setLocalProfile] = useState<ProfileSummary | null>(null);
  const [bio, setBio] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [followingProfiles, setFollowingProfiles] = useState<ProfileSummary[]>([]);
  const [followerProfiles, setFollowerProfiles] = useState<ProfileSummary[]>([]);
  const [followedIds, setFollowedIds] = useState<Set<string>>(() => new Set());
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingFollow, setSavingFollow] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(avatarFile);
    setAvatarPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [avatarFile]);

  const loadSettingsData = useCallback(async () => {
    if (!supabase || !user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, avatar_path, bio')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      setLocalProfile(profileData);
      setBio(profileData?.bio || '');

      const [{ data: followingRows }, { data: followerRows }] = await Promise.all([
        supabase
          .from('profile_follows')
          .select('followee_id, created_at')
          .eq('follower_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('profile_follows')
          .select('follower_id, created_at')
          .eq('followee_id', user.id)
          .order('created_at', { ascending: false }),
      ]);

      const nextFollowedIds = new Set(
        (followingRows || []).map((row) => row.followee_id),
      );
      setFollowedIds(nextFollowedIds);

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
    } catch (loadError) {
      setError(getErrorMessage(loadError, 'プロフィール情報の取得に失敗しました。'));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadSettingsData();
  }, [loadSettingsData]);

  useEffect(() => {
    const handleFollowUpdated = () => {
      void loadSettingsData();
    };
    window.addEventListener('dm_follow_updated', handleFollowUpdated);
    return () => window.removeEventListener('dm_follow_updated', handleFollowUpdated);
  }, [loadSettingsData]);

  useEffect(() => {
    if (loading) return;
    const hash = window.location.hash.replace(/^#/, '');
    if (hash) {
      const target = document.getElementById(hash);
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [loading]);

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !user) {
      setError('Supabase環境変数が未設定です。');
      return;
    }

    if (avatarFile) {
      if (!ALLOWED_AVATAR_TYPES.includes(avatarFile.type)) {
        setError('アイコン画像は JPG / PNG / WebP 形式を選択してください。');
        return;
      }
      if (avatarFile.size > MAX_AVATAR_BYTES) {
        setError('アイコン画像のサイズは 5MB 以下にしてください。');
        return;
      }
    }

    setSavingProfile(true);
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
        name:
          profile?.name ||
          currentProfile?.name ||
          user.email?.split('@')[0] ||
          'ユーザー',
        bio: bio.trim() || null,
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
      setMessage('プロフィール（アイコン・自己紹介）を保存しました。');
    } catch (submitError) {
      setError(
        getErrorMessage(submitError, 'プロフィールの保存に失敗しました。'),
      );
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !user) {
      setError('Supabase環境変数が未設定です。');
      return;
    }
    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください。');
      return;
    }

    setSavingPassword(true);
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
      setError(getErrorMessage(submitError, 'パスワード変更に失敗しました。'));
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !user) {
      setError('Supabase環境変数が未設定です。');
      return;
    }

    const trimmedEmail = newEmail.trim();
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setError('有効なメールアドレス形式で入力してください。');
      return;
    }
    if (user.email && trimmedEmail.toLowerCase() === user.email.toLowerCase()) {
      setError('現在と同じメールアドレスには変更できません。');
      return;
    }

    setSavingEmail(true);
    setError('');
    setMessage('');

    try {
      const { data, error: updateError } = await supabase.auth.updateUser({
        email: trimmedEmail,
      });
      if (updateError) throw updateError;

      setNewEmail('');
      if (data.user?.email === trimmedEmail) {
        setMessage('メールアドレスを更新しました。');
      } else {
        setMessage(
          '確認メールを送信しました。メール内のリンクを開いてメールアドレス変更を完了してください。',
        );
      }
    } catch (submitError) {
      setError(
        getErrorMessage(submitError, 'メールアドレスの変更に失敗しました。'),
      );
    } finally {
      setSavingEmail(false);
    }
  }

  async function toggleFollow(followeeId: string) {
    if (!supabase || !user || !followeeId || followeeId === user.id) return;

    setSavingFollow(true);
    setError('');

    try {
      if (followedIds.has(followeeId)) {
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
      await loadSettingsData();
    } catch (followError) {
      setError(getErrorMessage(followError, 'フォローの更新に失敗しました。'));
    } finally {
      setSavingFollow(false);
    }
  }

  const displayName =
    profile?.name || currentProfile?.name || user?.email?.split('@')[0] || 'ユーザー';

  return (
    <AuthGuard>
      {loading ? (
        <section className="panel">プロフィール設定を読み込んでいます...</section>
      ) : (
        <section className="profile-page">
          <div className="topnav">
            <Link href="/" className="button back-button">
              ← トップ（日本地図）へ戻る
            </Link>
            <Link href="/mypage" className="button">
              🗺️ マイページを見る
            </Link>
          </div>

          {/* ユーザー基本情報バー */}
          <div className="profile-header panel profile-identity-bar">
            {avatarPreviewUrl ? (
              <img
                src={avatarPreviewUrl}
                alt=""
                className="avatar-image profile-preview-avatar"
              />
            ) : (
              <ProfileAvatar
                profile={profile || currentProfile}
                userId={user?.id}
                size="large"
                showName={false}
              />
            )}
            <div className="profile-header-info">
              <div className="profile-header-title-row">
                <h1>{displayName}</h1>
                <span className="profile-role-badge">PROFILE</span>
              </div>
              <p className="profile-email-meta">
                メールアドレス：{user?.email || '未登録'}
              </p>
              <p className="pre-line">
                {profile?.bio || '自己紹介は未入力です。'}
              </p>
              <div className="profile-identity-links">
                <a href="#following-section" className="summary-jump-btn">
                  フォロー中：{followingProfiles.length}人
                </a>
                <a href="#followers-section" className="summary-jump-btn">
                  フォロワー：{followerProfiles.length}人
                </a>
              </div>
            </div>
          </div>

          {message && (
            <p className="success" role="status">
              {message}
            </p>
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}

          {/* アイコン設定・自己紹介編集 */}
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
                <small>JPG / PNG / WebP（5MB以下）</small>
              </label>
              <label>
                自己紹介
                <textarea
                  maxLength={1000}
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  placeholder="愛車やよく走るエリア、好きなドライブスポットなどを入力してください"
                />
              </label>
              <div className="profile-form-actions">
                <button type="submit" disabled={savingProfile}>
                  {savingProfile ? '保存中...' : '保存する'}
                </button>
              </div>
            </form>
          </section>

          {/* パスワード変更・メールアドレス変更 */}
          <div className="profile-grid">
            <section className="panel">
              <h2>パスワード変更</h2>
              <form onSubmit={handlePasswordSubmit}>
                <label>
                  新しいパスワード
                  <input
                    type="password"
                    minLength={6}
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="6文字以上で入力"
                    required
                  />
                </label>
                <div className="profile-form-actions">
                  <button type="submit" disabled={savingPassword}>
                    {savingPassword ? '変更中...' : '変更する'}
                  </button>
                </div>
              </form>
            </section>

            <section className="panel">
              <h2>メールアドレス変更</h2>
              <p className="meta">現在のメールアドレス：{user?.email || '未設定'}</p>
              <form onSubmit={handleEmailSubmit}>
                <label>
                  新しいメールアドレス
                  <input
                    type="email"
                    autoComplete="email"
                    value={newEmail}
                    onChange={(event) => setNewEmail(event.target.value)}
                    placeholder="new-address@example.com"
                    required
                  />
                  <small>
                    変更後、確認用メールが送信されます。メール内のリンクを開いて更新を完了してください。
                  </small>
                </label>
                <div className="profile-form-actions">
                  <button type="submit" disabled={savingEmail}>
                    {savingEmail ? '送信中...' : 'メールアドレスを更新する'}
                  </button>
                </div>
              </form>
            </section>
          </div>

          {/* フォロー一覧・フォロワー一覧セクション */}
          <div className="profile-grid">
            <FollowSection
              id="following-section"
              title="フォロー一覧"
              listHref="/following"
              profiles={followingProfiles}
              currentUserId={user?.id}
              followedIds={followedIds}
              saving={savingFollow}
              onToggleFollow={toggleFollow}
            />
            <FollowSection
              id="followers-section"
              title="フォロワー一覧"
              listHref="/followers"
              profiles={followerProfiles}
              currentUserId={user?.id}
              followedIds={followedIds}
              saving={savingFollow}
              onToggleFollow={toggleFollow}
            />
          </div>
        </section>
      )}
    </AuthGuard>
  );
}
