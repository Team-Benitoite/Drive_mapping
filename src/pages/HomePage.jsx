import React, { useEffect, useState } from 'react';
import JapanMap, { REGIONS } from '../components/JapanMap.jsx';
import Layout from '../components/Layout.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';
import { getPrefectureName } from '../utils/prefectures.js';
import { Link } from '../utils/navigation.jsx';

export default function HomePage() {
  const { user } = useAuth();
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeRegion, setActiveRegion] = useState('all');

  useEffect(() => {
    async function loadCounts() {
      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('route_prefectures')
        .select('prefecture_code')
        .eq('is_main', true);

      if (!error && data) {
        const nextCounts = {};
        data.forEach((route) => {
          const code = Number(route.prefecture_code);
          if (code) nextCounts[code] = (nextCounts[code] || 0) + 1;
        });
        setCounts(nextCounts);
      }

      setLoading(false);
    }

    loadCounts();
  }, []);

  const filteredCounts = Object.entries(counts).filter(([code]) => {
    if (activeRegion === 'all') return true;
    const region = REGIONS[activeRegion];
    return region ? region.prefs.includes(Number(code)) : true;
  });

  return (
    <Layout>
      <div className="space-y-6">
        {/* ページタイトル・概要 */}
        <div className="text-center sm:text-left space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            ドライブマップ
          </h1>
          <p className="text-slate-400 text-sm sm:text-base">
            直観的に日本地図をドラッグ＆ズームして、全国のドライブスポットを見つけよう！
          </p>
        </div>

        {/* 地方絞り込みタブ */}
        <div className="flex flex-wrap gap-2 pt-2 border-b border-slate-800 pb-4">
          <button
            onClick={() => setActiveRegion('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeRegion === 'all'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            全国を表示
          </button>
          {Object.entries(REGIONS).map(([key, reg]) => (
            <button
              key={key}
              onClick={() => setActiveRegion(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                activeRegion === key
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: reg.color }} />
              {reg.name}
            </button>
          ))}
        </div>

        {}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* インタラクティブ日本地図 */}
          <div className="lg:col-span-2">
            <JapanMap counts={counts} />
          </div>

          {/* 右側サイドバー: メニュー ＆ 投稿数リスト */}
          <div className="space-y-6">
            {/* メニューカード */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                📌 Quick Menu
              </h2>
              <div className="flex flex-col gap-2">
                <Link
                  href="/routes"
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-200 transition font-medium border border-slate-700/30"
                >
                  <span>🗺️️ 投稿ルート一覧</span>
                  <span className="text-xs text-indigo-400">閲覧する ➔</span>
                </Link>

                {user && (
                  <>
                    <Link
                      href="/routes/new"
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-200 transition font-medium border border-slate-700/30"
                    >
                      <span>✍️️ 新しく投稿する</span>
                      <span className="text-xs text-indigo-400">作成する ➔</span>
                    </Link>
                    <Link
                      href="/favorites"
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-200 transition font-medium border border-slate-700/30"
                    >
                      <span>⭐ お気に入りスポット</span>
                      <span className="text-xs text-indigo-400">見る ➔</span>
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* 都道府県別 投稿数カード */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  📊 地域別投稿数
                </h2>
                <span className="text-xs text-slate-400">
                  {loading ? '読み込み中...' : `${filteredCounts.length} 地域`}
                </span>
              </div>

              {loading ? (
                <div className="text-center py-6 text-slate-400 text-sm animate-pulse">
                  データをロードしています...
                </div>
              ) : filteredCounts.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-sm">
                  該当する投稿データがありません。
                </div>
              ) : (
                <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                  {filteredCounts.map(([code, count]) => (
                    <Link
                      key={code}
                      href={`/routes?prefecture_code=${code}`}
                      className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-sm text-slate-300 hover:text-white transition group border border-slate-700/20"
                    >
                      <span className="group-hover:text-indigo-300 font-medium">
                        {getPrefectureName(code)}
                      </span>
                      <span className="bg-indigo-950/80 text-indigo-300 border border-indigo-800/50 text-xs px-2.5 py-0.5 rounded-full font-bold">
                        {count} 件
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}