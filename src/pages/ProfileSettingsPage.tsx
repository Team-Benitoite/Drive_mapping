import { useCallback, useEffect, useState, type FormEvent } from 'react';
import AuthGuard from '../components/AuthGuard';
import ProfileAvatar from '../components/ProfileAvatar';
import { useAuth } from '../contexts/AuthContext';
import { profileIconBucket, supabase } from '../lib/supabase';
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

export default function ProfileSettingsPage() {
  const { profile: currentProfile, setProfile, user } = useAuth();
  const [profile, setLocalProfile] = useState<ProfileSummary | null>(null);
  const [bio, setBio] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
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
    } catch (loadError) {
      setError(getErrorMessage(loadError, 'プロフィール情報の取得に失敗しました。'));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadSettingsData();
  }, [loadSettingsData]);

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

          {/* 左：メールアドレス変更 ／ 右：パスワード変更 */}
          <div className="profile-grid">
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
          </div>
        </section>
      )}
    </AuthGuard>
  );
}
