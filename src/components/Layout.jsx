import { useState } from 'react';
import ProfileAvatar from './ProfileAvatar.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';
import { Link } from '../utils/navigation.jsx';

export default function Layout({ children }) {
  const { authError, loading, profile, user } = useAuth();
  const userName = profile?.name || user?.email || 'ユーザー';
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
          <div className="auth">
            {user ? (
              <>
                ログイン中：{userName} さん |{' '}
                <Link href="/profile">プロフィール</Link> |{' '}
                <Link href="/routes/new">投稿する</Link> |{' '}
                <Link href="/logout">ログアウト</Link>
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
              </>
            ) : (
              <>
                <Link href="/login">ログイン</Link> /{' '}
                <Link href="/signup">新規登録</Link>
              </>
            )}
          </div>
          {authError && (
            <div className="notice">
              Supabaseへの接続に失敗しています。.env の
              `VITE_SUPABASE_URL` と `VITE_SUPABASE_ANON_KEY`、または
              Supabaseプロジェクトの状態を確認してください。
            </div>
          )}
          {children}
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
