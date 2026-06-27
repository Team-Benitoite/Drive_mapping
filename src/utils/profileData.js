import { profileIconBucket, supabase } from '../lib/supabase.js';

export function getPublicAvatarUrl(path) {
  if (!path || !supabase) return '';
  return supabase.storage.from(profileIconBucket).getPublicUrl(path).data.publicUrl;
}

export function displayProfileName(profile, fallback = 'ユーザー') {
  return profile?.name || fallback;
}

export async function loadProfilesByIds(userIds) {
  const ids = [...new Set((userIds || []).filter(Boolean))];
  if (!supabase || ids.length === 0) return {};

  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, avatar_path, bio')
    .in('id', ids);

  if (error) throw error;

  return (data || []).reduce((profiles, profile) => {
    profiles[profile.id] = profile;
    return profiles;
  }, {});
}
