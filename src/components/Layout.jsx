import { useState, useEffect } from 'react';
import ProfileAvatar from './ProfileAvatar.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';
import { getAuthHref, Link } from '../utils/navigation.jsx';

export default function Layout({ children }) {
  const { authError, loading, profile, user } = useAuth();
  const userName = profile?.name || user?.email || 'ユーザー';

  const [menuOpen, setMenuOpen] = useState(false);

  // ヒートマップ（投稿件数）ON/OFFステートをヘッダー側で保持
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
    // カスタムイベントで JapanMap に変更を即座に通知
    window.dispatchEvent(new Event('dm_heatmap_toggle'));
  };

  // アカウント検索機能[cite: 3]
  const [accountQuery, setAccountQuery] = useState('');
  const [accountResults, setAccountResults] = useState([]);
  const [followedIds, setFollowedIds] = useState(() => new Set());
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searching, setSearching] = useState(false);

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
          {/* ヘッダー操作エリア：三本バーと投稿件数トグルボタン */}
          <div className="auth-header-bar" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', position: 'relative', marginBottom: '16px' }}>
            
            {/* ★ 三本バーの横に配置した投稿件数トグルボタン */}
            <button
              type="button"
              onClick={toggleHeat}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '20px',
                border: '1px solid #cbd5e1',
                background: heatOn ? '#3b82f6' : '#ffffff',
                color: heatOn ? '#ffffff' : '#334155',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                transition: 'all 0.2s ease'
              }}
            >
              <span>投稿件数</span>
              <span style={{
                background: heatOn ? '#ffffff' : '#e2e8f0',
                color: heatOn ? '#3b82f6' : '#64748b',
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: '11px'
              }}>
                {heatOn ? 'ON' : 'OFF'}
              </span>
            </button>

            {/* 三本バーボタン */}
            <button
              type="button"
              className="menu-toggle-btn"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="メニューを開く"
              style={{ fontSize: '18px', padding: '6px 14px', cursor: 'pointer', borderRadius: '20px' }}
            >
              ☰ メニュー
            </button>

            {/* ドロップダウンメニュー */}
            {menuOpen && (
              <div
                className="auth-dropdown-menu"
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  backgroundColor: '#ffffff',
                  border: '1px solid #ccc',
                  borderRadius: '12px',
                  padding: '16px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                  zIndex: 100,
                  minWidth: '260px',
                  marginTop: '6px'
                }}
              >
                {user ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>ログイン中：<strong>{userName}</strong> さん</div>
                    <hr style={{ margin: '4px 0' }} />
                    <Link href="/profile" onClick={() => setMenuOpen(false)}>プロフィール</Link>
                    <Link href="/routes/new" onClick={() => setMenuOpen(false)}>投稿する</Link>
                    <Link href="/logout" onClick={() => setMenuOpen(false)}>ログアウト</Link>
                    
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
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Link href={getAuthHref('/login')} onClick={() => setMenuOpen(false)}>ログイン</Link> /{' '}
                    <Link href={getAuthHref('/signup')} onClick={() => setMenuOpen(false)}>新規登録</Link>
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

          {/* モーダル表示 */}
          {searchOpen && (
            <div className="account-modal" role="dialog" onClick={() => setSearchOpen(false)}>
              <div className="account-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="account-modal-header">
                  <h2>アカウント検索</h2>
                  <button type="button" onClick={() => setSearchOpen(false)}>×</button>
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