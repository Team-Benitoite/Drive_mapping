import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { data as api } from '../api';
import { PREFECTURES, prefectureName } from '../lib/prefectures';

export default function Index() {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState([]);
  const [pref, setPref] = useState(''); // 都道府県絞り込み
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError('');
      try {
        // GET /api/routes 相当
        const list = await api.listRoutes(pref || undefined);
        if (active) setRoutes(list);
      } catch (e) {
        if (active) setError(e.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [pref]);

  return (
    <div>
      <h2>ツーリングルート一覧</h2>
      <p className="muted">他のユーザーが投稿したルートを閲覧できます（ログイン不要）。</p>

      <div className="toolbar">
        <label htmlFor="pref" className="muted">都道府県で絞り込み：</label>
        <select id="pref" value={pref} onChange={(e) => setPref(e.target.value)} style={{ padding: '8px', borderRadius: 8 }}>
          <option value="">すべて</option>
          {PREFECTURES.map(([code, name]) => (
            <option key={code} value={code}>{name}</option>
          ))}
        </select>
      </div>

      {error && <p className="error">読み込みエラー：{error}</p>}
      {loading ? (
        <p className="muted">読み込み中…</p>
      ) : routes.length === 0 ? (
        <p className="muted">まだルートが投稿されていません。</p>
      ) : (
        <div className="route-grid">
          {routes.map((r) => (
            <div key={r.id} className="card route-card" onClick={() => navigate(`/routes/${r.id}`)}>
              <h3>{r.title}</h3>
              <p className="muted" style={{ minHeight: 40 }}>{r.summary || '（説明なし）'}</p>
              <div className="meta">
                {r.prefecture_code && <span className="badge">{prefectureName(r.prefecture_code)}</span>}
                {' '}投稿者：{r.author_name}
                {' ・ ❤ '}{r.like_count}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
