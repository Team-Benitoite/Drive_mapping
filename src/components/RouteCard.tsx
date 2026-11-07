import ProfileAvatar from './ProfileAvatar';
import { routeThumbnail } from '../utils/routeData';
import { Link } from '../utils/navigation';
import type { RouteListItem } from '../types/models';

export default function RouteCard({ route }: { route: RouteListItem }) {
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
