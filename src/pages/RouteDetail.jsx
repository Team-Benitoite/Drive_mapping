import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { data as api } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { prefectureName } from '../lib/prefectures';
import RouteMap from '../components/RouteMap';

export default function RouteDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [route, setRoute] = useState(null);
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    // GET /api/routes/{id} 相当
    const { data: r, error } = await api.getRoute(id, user?.id);
    if (error) {
      setError(error.message);
    } else {
      setRoute(r);
      setLikeCount(r.like_count);
      setLiked(r.liked);
    }
    setLoading(false);
  }, [id, user]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleLike = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    const res = await api.toggleLike(id, user.id);
    setLiked(res.liked);
    setLikeCount(res.like_count);
  };

  const handleDelete = async () => {
    if (!window.confirm('このルートを削除しますか？この操作は取り消せません。')) return;
    const { error } = await api.deleteRoute(id);
    if (error) {
      setError(`削除に失敗しました：${error.message}`);
      return;
    }
    navigate('/');
  };

  if (loading) return <p className="muted">読み込み中…</p>;
  if (error) return <p className="error">エラー：{error}</p>;
  if (!route) return <p className="muted">ルートが見つかりません。</p>;

  const points = route.points ?? [];
  const isOwner = user && user.id === route.user_id;
  const center = points.length > 0 ? [points[0].lat, points[0].lng] : undefined;

  return (
    <div>
      <button className="btn btn-ghost" onClick={() => navigate('/')}>← 一覧へ戻る</button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
        <h2 style={{ margin: 0 }}>{route.title}</h2>
        {route.prefecture_code && <span className="badge">{prefectureName(route.prefecture_code)}</span>}
      </div>
      <p className="muted">
        投稿者：{route.author_name} ・ {new Date(route.created_at).toLocaleDateString('ja-JP')}
      </p>

      {route.summary && <p>{route.summary}</p>}

      <RouteMap points={points} center={center} zoom={center ? 10 : 5} />

      <ul className="point-list">
        {points.map((p, i) => (
          <li key={i}>
            <span className={`badge ${p.point_type}`}>
              {p.point_type === 'start' ? '出発' : p.point_type === 'goal' ? '到着' : '中間'}
            </span>
            {p.label || `(${p.lat.toFixed(4)}, ${p.lng.toFixed(4)})`}
          </li>
        ))}
      </ul>

      {route.description && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3>詳細</h3>
          <p style={{ whiteSpace: 'pre-wrap' }}>{route.description}</p>
        </div>
      )}

      <div className="toolbar" style={{ marginTop: 20 }}>
        <button className="btn" onClick={toggleLike}>
          {liked ? '❤ いいね済み' : '🤍 いいね'}（{likeCount}）
        </button>
        {isOwner && (
          <button className="btn btn-danger" onClick={handleDelete}>削除</button>
        )}
      </div>
    </div>
  );
}
