import ProfileAvatar from './ProfileAvatar';
import { getPrefectureName } from '../utils/prefectures';
import { likeCount, routeThumbnail } from '../utils/routeData';
import { Link } from '../utils/navigation';
import type { RouteListItem } from '../types/models';

export default function RouteCard({ route }: { route: RouteListItem }) {
  const thumbnail = routeThumbnail(route);
  const subPrefectures = (route.route_prefectures || []).filter(
    (pref) => !pref.is_main && pref.prefecture_code !== route.prefecture_code,
  );

  return (
    <article className="route-card">
      <Link href={`/routes/${route.id}`} className="route-thumb-link">
        {thumbnail ? (
          <img src={thumbnail} alt="" className="route-thumb" loading="lazy" />
        ) : (
          <div className="route-thumb placeholder">No image</div>
        )}
      </Link>

      <div className="route-card-body">
        <div className="route-card-title-row">
          <h3>
            <Link href={`/routes/${route.id}`}>{route.title}</Link>
          </h3>
          <span className="route-card-like-pill" aria-label={`いいね ${likeCount(route)}件`}>
            <span aria-hidden="true">♥</span> {likeCount(route)} pt
          </span>
        </div>
        <div className="route-card-pref-tags">
          <span className="route-card-pref-pill is-main">
            📍 {getPrefectureName(route.prefecture_code)}
          </span>
          {subPrefectures.map((pref) => (
            <span key={pref.prefecture_code} className="route-card-pref-pill is-sub">
              ＋ {getPrefectureName(pref.prefecture_code)}
            </span>
          ))}
        </div>
        <ProfileAvatar profile={route.profile} userId={route.user_id} />
        <p className="meta">
          {route.created_at
            ? new Date(route.created_at).toLocaleString('ja-JP')
            : ''}
        </p>
        <p className="summary">
          {route.summary || '概要は未入力です。'}
        </p>
      </div>
    </article>
  );
}
