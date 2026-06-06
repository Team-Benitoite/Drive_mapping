import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { data as api } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { PREFECTURES } from '../lib/prefectures';
import RouteMap, { deriveType } from '../components/RouteMap';

export default function RouteCreate() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [prefecture, setPrefecture] = useState('');
  const [points, setPoints] = useState([]); // [{lat,lng,label}]
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const addPoint = (latlng) => {
    setPoints((prev) => [...prev, { ...latlng, label: '' }]);
  };

  const updateLabel = (i, label) => {
    setPoints((prev) => prev.map((p, idx) => (idx === i ? { ...p, label } : p)));
  };

  const removePoint = (i) => {
    setPoints((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (points.length < 2) {
      setError('出発地と到着地を含め、地図上で2地点以上を指定してください。');
      return;
    }

    setBusy(true);
    // POST /api/routes 相当：routes と route_points を保存
    const { data: route, error: err } = await api.createRoute(user.id, {
      title,
      summary,
      description,
      prefecture_code: prefecture,
      points,
    });
    setBusy(false);

    if (err) {
      setError(`保存に失敗しました：${err.message}`);
      return;
    }
    navigate(`/routes/${route.id}`);
  };

  return (
    <div>
      <h2>ルートを投稿</h2>
      <p className="muted">地図をクリックして地点を順番に追加してください（最初＝出発地 / 最後＝到着地）。</p>
      {error && <p className="error">{error}</p>}

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom: 16 }}>
          <label htmlFor="title">タイトル *</label>
          <input id="title" value={title} onChange={(e) => setTitle(e.target.value)}
            required style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)' }} />

          <label htmlFor="summary" style={{ display: 'block', marginTop: 12 }}>概要（一覧に表示）</label>
          <input id="summary" value={summary} onChange={(e) => setSummary(e.target.value)}
            style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)' }} />

          <label htmlFor="description" style={{ display: 'block', marginTop: 12 }}>詳細説明</label>
          <textarea id="description" rows={4} value={description} onChange={(e) => setDescription(e.target.value)}
            style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', fontFamily: 'inherit' }} />

          <label htmlFor="pref" style={{ display: 'block', marginTop: 12 }}>主な都道府県</label>
          <select id="pref" value={prefecture} onChange={(e) => setPrefecture(e.target.value)}
            style={{ padding: 10, borderRadius: 8, border: '1px solid var(--border)' }}>
            <option value="">選択してください</option>
            {PREFECTURES.map(([code, name]) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>
        </div>

        <RouteMap points={points} onAddPoint={addPoint} />

        <ul className="point-list">
          {points.length === 0 && <li className="muted">まだ地点がありません。地図をクリックして追加してください。</li>}
          {points.map((p, i) => {
            const type = deriveType(i, points.length);
            return (
              <li key={i}>
                <span className={`badge ${type}`}>
                  {type === 'start' ? '出発' : type === 'goal' ? '到着' : '中間'}
                </span>
                <input
                  placeholder="地点名（任意）"
                  value={p.label}
                  onChange={(e) => updateLabel(i, e.target.value)}
                  style={{ flex: 1, padding: 6, borderRadius: 6, border: '1px solid var(--border)' }}
                />
                <span className="muted" style={{ fontSize: '0.75rem' }}>
                  {p.lat.toFixed(4)}, {p.lng.toFixed(4)}
                </span>
                <button type="button" className="btn btn-ghost" onClick={() => removePoint(i)}>削除</button>
              </li>
            );
          })}
        </ul>

        <button className="btn" type="submit" disabled={busy}>
          {busy ? '保存中…' : 'ルートを保存'}
        </button>
      </form>
    </div>
  );
}
