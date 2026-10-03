import { useState } from 'react';
import ProfileAvatar from './ProfileAvatar.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';
import { getAuthHref, Link } from '../utils/navigation.jsx';

export default function Layout({ children }) {
  // AuthContextから現在の認証状態・ユーザープロファイル情報を取得[cite: 3]
  const { authError, loading, profile, user } = useAuth();
  const userName = profile?.name || user?.email || 'ユーザー';

  // 【追加】三本バー（ハンバーガーメニュー）の開閉状態を管理するState
  const [menuOpen, setMenuOpen] = useState(false);

  // アカウント検索機能に関する各State[cite: 3]
  const [accountQuery, setAccountQuery] = useState(''); // 検索入力文字列[cite: 3]
  const [accountResults, setAccountResults] = useState([]); // 検索結果リスト[cite: 3]
  const [followedIds, setFollowedIds] = useState(() => new Set()); // フォロー中ユーザーのID集合[cite: 3]
  const [searchOpen, setSearchOpen] = useState(false); // 検索モーダルの表示フラグ[cite: 3]
  const [searchError, setSearchError] = useState(''); // 検索エラーメッセージ[cite: 3]
  const [searching, setSearching] = useState(false); // 検索処理中フラグ[cite: 3]

  // アカウント検索の実行処理[cite: 3]
  async function handleAccountSearch(event) {
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

  // 検索モーダル内でのフォロー/フォロー解除トグル処理[cite: 3]
  async function toggleSearchFollow(profileId) {
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
          {/* 【修正】三本バーボタンとドロップダウンメニュー構造を追加 */}
          <div className="auth-header-bar" style={{ display: 'flex', justifyContent: 'flex-end', position: 'relative', marginBottom: '16px' }}>
            {/* 三本バー（ハンバーガーアイコン）ボタン */}
            <button
              type="button"
              className="menu-toggle-btn"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="メニューを開く"
              style={{ fontSize: '20px', padding: '6px 12px', cursor: 'pointer' }}
            >
              ☰ メニュー
            </button>

            {/* 三本バーがクリックされた際に表示されるメニューボックス */}
            {menuOpen && (
              <div
                className="auth-dropdown-menu"
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  backgroundColor: '#ffffff',
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  padding: '16px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  zIndex: 50,
                  minWidth: '260px'
                }}
              >
                {user ? (
                  /* ログイン時の表示エリア（元コードの要素をそのまま配置）[cite: 3] */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>ログイン中：<strong>{userName}</strong> さん</div>
                    <hr style={{ margin: '4px 0' }} />
                    <Link href="/profile" onClick={() => setMenuOpen(false)}>プロフィール</Link>
                    <Link href="/routes/new" onClick={() => setMenuOpen(false)}>投稿する</Link>
                    <Link href="/logout" onClick={() => setMenuOpen(false)}>ログアウト</Link>
                    
                    {/* アカウント検索フォーム[cite: 3] */}
                    <form className="account-search" onSubmit={handleAccountSearch} style={{ marginTop: '8px' }}>
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
                  /* 未ログイン時の表示エリア[cite: 3] */
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Link href={getAuthHref('/login')} onClick={() => setMenuOpen(false)}>ログイン</Link> /{' '}
                    <Link href={getAuthHref('/signup')} onClick={() => setMenuOpen(false)}>新規登録</Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Supabase接続エラー表示[cite: 3] */}
          {authError && (
            <div className="notice">
              Supabaseへの接続に失敗しています。.env の
              `VITE_SUPABASE_URL` と `VITE_SUPABASE_ANON_KEY`、または
              Supabaseプロジェクトの状態を確認してください。
            </div>
          )}

          {/* 子コンポーネント（メインコンテンツ）の描画[cite: 3] */}
          {children}

          {/* アカウント検索結果を表示するモーダルダイアログ[cite: 3] */}
          {searchOpen && (
            <div
              className="account-modal"
              role="dialog"
              aria-modal="true"
              aria-label="アカウント検索結果"
              onClick={() => setSearchOpen(false)}
            >
              <div
                className="account-modal-content"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="account-modal-header">
                  <h2>アカウント検索</h2>
                  <button
                    type="button"
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
                      <ProfileAvatar
                        profile={result}
                        userId={result.id}
                        size="medium"
                      />
                      <p className="meta">{result.bio || '自己紹介は未入力です。'}</p>
                      <button
                        type="button"
                        onClick={() => toggleSearchFollow(result.id)}
                      >
                        {followedIds.has(result.id)
                          ? 'フォロー解除'
                          : 'フォローする'}
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