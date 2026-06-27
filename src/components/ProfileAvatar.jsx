import { displayProfileName, getPublicAvatarUrl } from '../utils/profileData.js';
import { Link } from '../utils/navigation.jsx';

export default function ProfileAvatar({
  profile,
  userId,
  size = 'small',
  showName = true,
}) {
  const name = displayProfileName(profile);
  const avatarUrl = getPublicAvatarUrl(profile?.avatar_path);
  const content = (
    <>
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="avatar-image" loading="lazy" />
      ) : (
        <span className="avatar-placeholder">{name.slice(0, 1)}</span>
      )}
      {showName && <span>{name}</span>}
    </>
  );

  if (!userId) {
    return <span className={`profile-chip ${size}`}>{content}</span>;
  }

  return (
    <Link href={`/profiles/${userId}`} className={`profile-chip ${size}`}>
      {content}
    </Link>
  );
}
