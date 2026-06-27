import ProfileAvatar from './ProfileAvatar.jsx';
import { routeThumbnail } from '../utils/routeData.js';
import { Link } from '../utils/navigation.jsx';

export default function RouteCard({ route }) {
  const thumbnail = routeThumbnail(route);

  return (
    <article className="route-card">
      <Link href={`/routes/${route.id}`} className="route-thumb-link">
        {thumbnail ? (
          <img src={thumbnail} alt="" className="route-thumb" loading="lazy" />
        ) : (
          <div className="route-thumb placeholder">No image</div>
        )}
      </Link>

      <div>
        <h3>
          <Link href={`/routes/${route.id}`}>{route.title}</Link>
        </h3>
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
