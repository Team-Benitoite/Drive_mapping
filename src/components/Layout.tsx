import { useState, type FormEvent, type ReactNode } from 'react';
import ProfileAvatar from './ProfileAvatar';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { getAuthHref, Link } from '../utils/navigation';
import type { ProfileSummary } from '../types/models';

export default function Layout({ children }: { children: ReactNode }) {
  const { authError, loading, profile, user } = useAuth();
  const userName = profile?.name || user?.email || 'ユーザー';

  const [menuOpen, setMenuOpen] = useState(false);

  const [heatOn, setHeatOn] = useState(() => {
    try {
      return localStorage.getItem('dm_heatmap_on') === '1';
    } catch {
      return false;
    }
  });

  const toggleHeat = () => {
    const next = !heatOn;
    setHeatOn(next);
    localStorage.setItem('dm_heatmap_on', next ? '1' : '0');
    window.dispatchEvent(new Event('dm_heatmap_toggle'));
  };

  const [accountQuery, setAccountQuery] = useState('');
  const [accountResults, setAccountResults] = useState<ProfileSummary[]>([]);
  const [followedIds, setFollowedIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searching, setSearching] = useState(false);

  async function handleAccountSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearchError('');
    if (!supabase || !user || !accountQuery.trim()) return;

    setSearching(true);
    const keyword = accountQuery.trim().replaceAll(',', ' ');
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, avatar_path, bio')
      .ilike('name', `%${keyword}%`)
      .neq('id', user.id)
      .limit(10);

    if (error) {
      setSearchError(error.message);
      setAccountResults([]);
      setFollowedIds(new Set());
      setSearchOpen(true);
      setSearching(false);
      return;
    }

    const results = data || [];
    const ids = results.map((result) => result.id);
    if (ids.length) {
      const { data: followRows } = await supabase
        .from('profile_follows')
        .select('followee_id')
        .eq('follower_id', user.id)
        .in('followee_id', ids);
      setFollowedIds(new Set((followRows || []).map((row) => row.followee_id)));
    } else {
      setFollowedIds(new Set());
    }

    setAccountResults(results);
    setSearchOpen(true);
    setSearching(false);
  }

  async function toggleSearchFollow(profileId: string) {
    if (!supabase || !user || !profileId) return;

    if (followedIds.has(profileId)) {
      const { error } = await supabase
        .from('profile_follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('followee_id', profileId);
      if (error) {
        setSearchError(error.message);
        return;
      }
      setFollowedIds((current) => {
        const next = new Set(current);
        next.delete(profileId);
        return next;
      });
      return;
    }

    const { error } = await supabase
      .from('profile_follows')
      .insert({ follower_id: user.id, followee_id: profileId });
    if (error) {
      setSearchError(error.message);
      return;
    }
    setFollowedIds((current) => new Set(current).add(profileId));
  }

  return (
    <div className="app-shell">
      {loading ? (
        <main className="container">
          <div className="panel">ログイン状態を確認しています...</div>
        </main>
      ) : (
        <main className="container">
          {/* ヘッダー操作バー */}
          <div className="auth-header-bar">
            {/* 1. 投稿件数トグルボタン */}
            <button
              type="button"
              onClick={toggleHeat}
              aria-pressed={heatOn}
              className={`game-header-btn heat-toggle-btn ${heatOn ? 'active' : ''}`}
            >
              <span>📊 投稿件数</span>
              <span className="game-header-badge">
                {heatOn ? 'ON' : 'OFF'}
              </span>
            </button>

            {/* 2. 投稿一覧ボタン */}
            <Link
              href="/routes"
              className="game-header-btn routes-list-btn"
            >
              🚩 投稿一覧
            </Link>

            {/* 3. 三本バーメニューボタン */}
            <button
              type="button"
              className="game-header-btn menu-toggle-btn"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="メニューを開く"
              aria-expanded={menuOpen}
              title="メニュー"
            >
              ☰
            </button>

            {/* ドロップダウンメニュー */}
            {menuOpen && (
              <div className="auth-dropdown-menu">
                {user ? (
                  <div className="auth-dropdown-stack">
                    <div className="auth-dropdown-user">
                      ログイン中：<strong>{userName}</strong> さん
                    </div>
                    <hr className="auth-dropdown-divider" />
                    <Link href="/profile" onClick={() => setMenuOpen(false)}>
                      プロフィール
                    </Link>
                    <Link href="/routes/new" onClick={() => setMenuOpen(false)}>
                      投稿する
                    </Link>
                    <Link href="/favorites" onClick={() => setMenuOpen(false)}>
                      お気に入り
                    </Link>
                    <Link href="/logout" onClick={() => setMenuOpen(false)}>
                      ログアウト
                    </Link>

                    <form className="account-search" onSubmit={handleAccountSearch}>
                      <input
                        type="search"
                        value={accountQuery}
                        onChange={(event) => setAccountQuery(event.target.value)}
                        placeholder="アカウント検索"
                        aria-label="アカウント検索"
                      />
                      <button type="submit" disabled={searching}>
                        検索
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="auth-dropdown-guest">
                    <Link href={getAuthHref('/login')} onClick={() => setMenuOpen(false)}>
                      ログイン
                    </Link>
                    <Link href={getAuthHref('/signup')} onClick={() => setMenuOpen(false)}>
                      新規登録
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {authError && (
            <div className="notice">
              Supabaseへの接続に失敗しています。
            </div>
          )}

          {children}

          {searchOpen && (
            <div className="account-modal" role="dialog" aria-modal="true" onClick={() => setSearchOpen(false)}>
              <div className="account-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="account-modal-header">
                  <h2>アカウント検索</h2>
                  <button
                    type="button"
                    className="photo-modal-close account-modal-close"
                    onClick={() => setSearchOpen(false)}
                    aria-label="閉じる"
                  >
                    ×
                  </button>
                </div>
                {searchError && <p className="error">{searchError}</p>}
                {!searchError && accountResults.length === 0 && (
                  <p className="meta">該当するアカウントがありません。</p>
                )}
                <div className="account-result-list">
                  {accountResults.map((result) => (
                    <div key={result.id} className="account-result">
                      <ProfileAvatar profile={result} userId={result.id} size="medium" />
                      <p className="meta">{result.bio || '自己紹介は未入力です。'}</p>
                      <button type="button" onClick={() => toggleSearchFollow(result.id)}>
                        {followedIds.has(result.id) ? 'フォロー解除' : 'フォローする'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      )}
    </div>
  );
}
