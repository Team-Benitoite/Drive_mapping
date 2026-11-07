import { displayProfileName, getPublicAvatarUrl } from '../utils/profileData';
import { Link } from '../utils/navigation';
import type { ProfileSummary } from '../types/models';

export interface ProfileAvatarProps {
  profile: ProfileSummary | null | undefined;
  userId?: string | null;
  size?: 'small' | 'medium' | 'large';
  showName?: boolean;
}

export default function ProfileAvatar({
  profile,
  userId,
  size = 'small',
  showName = true,
}: ProfileAvatarProps) {
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
