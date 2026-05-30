import type { MapRoute } from "./types";

// Supabaseから取得した行を共通型へ。DB都合の変更はここだけで吸収
export function toMapRoutes(rows: any[]): MapRoute[] {
  return rows.map((r) => ({
    id: String(r.id),
    prefectureCode: r.prefecture_code,
    title: r.title,
    points: r.route_points
      .sort((a: any, b: any) => a.seq - b.seq)
      .map((p: any) => ({
        type: p.point_type, label: p.label, lng: p.lng, lat: p.lat,
      })),
  }));
}