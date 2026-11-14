import type { Tables } from './database';

export type ProfileRow = Tables<'profiles'>;
export type RouteRow = Tables<'routes'>;
export type RoutePhotoRow = Tables<'route_photos'>;
export type RoutePointRow = Tables<'route_points'>;

/** 一覧やアバター表示で読み込むプロフィールの列 */
export type ProfileSummary = Pick<
  ProfileRow,
  'id' | 'name' | 'avatar_path' | 'bio'
>;

/** ユーザーIDごとのプロフィール辞書 */
export type ProfileMap = Record<string, ProfileSummary>;

export type RouteLikeRef = Pick<Tables<'route_likes'>, 'user_id'>;
export type RouteFavoriteRef = Pick<Tables<'route_favorites'>, 'user_id'>;
export type RoutePrefectureRef = Pick<
  Tables<'route_prefectures'>,
  'prefecture_code' | 'is_main'
>;
export type RoutePointSummary = Pick<
  RoutePointRow,
  'point_type' | 'label' | 'address' | 'sort_order'
>;
export type RouteListPhoto = Pick<
  RoutePhotoRow,
  'storage_path' | 'thumb_path' | 'sort_order'
>;
export type RouteDetailPhoto = Pick<
  RoutePhotoRow,
  'id' | 'storage_path' | 'thumb_path' | 'sort_order'
>;

/** サムネイル表示に必要な最小の形 */
export interface RouteThumbnailSource {
  route_photos?: Pick<RoutePhotoRow, 'storage_path' | 'thumb_path'>[] | null;
}

/** いいね数の集計に必要な最小の形 */
export interface RouteLikesSource {
  route_likes?: RouteLikeRef[] | null;
}

/** お気に入り判定に必要な最小の形 */
export interface RouteFavoritesSource {
  route_favorites?: RouteFavoriteRef[] | null;
}

/** 投稿者判定に必要な最小の形 */
export interface RouteOwnerSource {
  user_id?: string | null;
}

/** Google Mapsの経路URL生成に必要な最小の形 */
export interface RouteLocationPoint {
  label?: string | null;
  address?: string | null;
  sort_order?: number | null;
}

export interface RouteLocationSource {
  address?: string | null;
  route_points?: RouteLocationPoint[] | null;
}

/** 一覧・カード表示用の投稿（プロフィールを後から合成する） */
export interface RouteListItem extends RouteRow {
  route_photos?: RouteListPhoto[] | null;
  route_likes?: RouteLikeRef[] | null;
  route_favorites?: RouteFavoriteRef[] | null;
  profile?: ProfileSummary | null;
}

/** 投稿詳細画面で読み込む投稿 */
export interface RouteDetail extends RouteRow {
  route_prefectures?: RoutePrefectureRef[] | null;
  route_points?: RoutePointSummary[] | null;
  route_photos?: RouteDetailPhoto[] | null;
  route_likes?: RouteLikeRef[] | null;
  route_favorites?: RouteFavoriteRef[] | null;
}

/** 投稿編集フォームで読み込む投稿 */
export interface RouteEditSource extends RouteRow {
  route_prefectures?: RoutePrefectureRef[] | null;
  route_points?: RoutePointSummary[] | null;
  route_photos?: RouteDetailPhoto[] | null;
}

/** 都道府県コードごとの投稿数 */
export type PrefectureCounts = Record<number, number>;

/** 都道府県ごとの人気投稿を地図に表示するための情報 */
export interface TopPrefecture {
  prefecture_code: number;
  title: string;
  like_count: number;
  image_url: string | null;
  route_id?: number;
  google_maps_url?: string | null;
}

/** 投稿フォームの中間地点の入力値 */
export interface MiddlePointInput {
  label: string;
  address: string;
}
