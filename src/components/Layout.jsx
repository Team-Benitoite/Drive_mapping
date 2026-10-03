import React, { useState } from 'react';
import ProfileAvatar from './ProfileAvatar.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';
import { Link } from '../utils/navigation.jsx';

export default function Layout({ children }) {
  const { loading, profile, user } = useAuth();
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* トップヘッダーバー */}
      <header className="bg-slate-900/80 border-b border-slate-800 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🚗</span>
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent hover:opacity-80 transition">
              Drive Mapping
            </Link>
          </div>

          {/* ユーザーエリア＆検索 */}
          <div className="flex items-center gap-4 text-sm">
            {loading ? (
              <span className="text-slate-400 animate-pulse">ログイン確認中...</span>
            ) : user ? (
              <>
                <div className="hidden md:flex items-center gap-3">
                  <span className="text-slate-300">
                    <span className="text-indigo-400 font-semibold">{userName}</span> さん
                  </span>
                  <Link href="/profile" className="text-slate-300 hover:text-white transition">プロフィール</Link>
                  <Link href="/routes/new" className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg font-medium transition shadow-sm">
                    ＋ 投稿する
                  </Link>
                  <Link href="/logout" className="text-slate-400 hover:text-red-400 transition">ログアウト</Link>
                </div>

                {/* アカウント検索フォーム */}
                <form onSubmit={handleAccountSearch} className="flex items-center gap-1">
                  <input
                    type="search"
                    value={accountQuery}
                    onChange={(e) => setAccountQuery(e.target.value)}
                    placeholder="ユーザー検索..."
                    className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-32 sm:w-44"
                  />
                  <button
                    type="submit"
                    disabled={searching}
                    className="bg-slate-700 hover:bg-slate-600 text-white text-xs px-2.5 py-1.5 rounded-lg transition disabled:opacity-50"
                  >
                    検索
                  </button>
                </form>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login" className="text-slate-300 hover:text-white transition">ログイン</Link>
                <Link href="/signup" className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg font-medium transition">
                  新規登録
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>

      {}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-semibold text-white">アカウント検索結果</h3>
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="text-slate-400 hover:text-white text-xl font-bold"
              >
                ×
              </button>
            </div>

            {searchError && <p className="text-red-400 text-sm">{searchError}</p>}
            {!searchError && accountResults.length === 0 && (
              <p className="text-slate-400 text-sm text-center py-4">該当するアカウントが見つかりませんでした。</p>
            )}

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {accountResults.map((result) => (
                <div key={result.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700/40">
                  <div className="flex items-center gap-3">
                    <ProfileAvatar profile={result} userId={result.id} size="medium" />
                    <div>
                      <p className="text-sm font-semibold text-white">{result.name}</p>
                      <p className="text-xs text-slate-400 line-clamp-1">{result.bio || '自己紹介は未入力です。'}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleSearchFollow(result.id)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                      followedIds.has(result.id)
                        ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    }`}
                  >
                    {followedIds.has(result.id) ? 'フォロー解除' : 'フォロー'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}