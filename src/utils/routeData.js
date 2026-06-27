import { supabase, storageBucket } from '../lib/supabase.js';

export function getPublicPhotoUrl(path) {
  if (!path || !supabase) return '';
  return supabase.storage.from(storageBucket).getPublicUrl(path).data.publicUrl;
}

export function routeThumbnail(route) {
  const firstPhoto = route?.route_photos?.[0];
  return getPublicPhotoUrl(firstPhoto?.thumb_path || firstPhoto?.storage_path);
}

export function likeCount(route) {
  return route?.route_likes?.length || 0;
}

export function isOwner(route, user) {
  return Boolean(route?.user_id && user?.id && route.user_id === user.id);
}

export function normalizeMiddlePoints(points) {
  return points.filter((point) => point.label.trim() || point.address.trim());
}
