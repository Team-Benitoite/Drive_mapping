import { profileIconBucket, supabase } from '../lib/supabase';
import type { ProfileMap, ProfileSummary } from '../types/models';

export function getPublicAvatarUrl(path: string | null | undefined): string {
  if (!path || !supabase) return '';
  return supabase.storage.from(profileIconBucket).getPublicUrl(path).data.publicUrl;
}

export function displayProfileName(
  profile: Pick<ProfileSummary, 'name'> | null | undefined,
  fallback = 'ユーザー',
): string {
  return profile?.name || fallback;
}

export async function loadProfilesByIds(
  userIds: (string | null | undefined)[] | null | undefined,
): Promise<ProfileMap> {
  const ids = [...new Set((userIds || []).filter((id): id is string => Boolean(id)))];
  if (!supabase || ids.length === 0) return {};

  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, avatar_path, bio')
    .in('id', ids);

  if (error) throw error;

  return (data || []).reduce<ProfileMap>((profiles, profile) => {
    profiles[profile.id] = profile;
    return profiles;
  }, {});
}
