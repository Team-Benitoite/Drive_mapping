import { supabase, storageBucket } from '../lib/supabase';
import type {
  MiddlePointInput,
  RouteLikesSource,
  RouteOwnerSource,
  RouteThumbnailSource,
} from '../types/models';

export function getPublicPhotoUrl(path: string | null | undefined): string {
  if (!path || !supabase) return '';
  return supabase.storage.from(storageBucket).getPublicUrl(path).data.publicUrl;
}

export function routeThumbnail(
  route: RouteThumbnailSource | null | undefined,
): string {
  const firstPhoto = route?.route_photos?.[0];
  return getPublicPhotoUrl(firstPhoto?.thumb_path || firstPhoto?.storage_path);
}

export function likeCount(route: RouteLikesSource | null | undefined): number {
  return route?.route_likes?.length || 0;
}

export function isOwner(
  route: RouteOwnerSource | null | undefined,
  user: { id?: string } | null | undefined,
): boolean {
  return Boolean(route?.user_id && user?.id && route.user_id === user.id);
}

export function normalizeMiddlePoints(
  points: MiddlePointInput[],
): MiddlePointInput[] {
  return points.filter((point) => point.label.trim() || point.address.trim());
}
