export type PointType = "start" | "middle" | "goal";

export interface RoutePoint {
  type: PointType;
  label: string;
  lng: number;
  lat: number;
}

export interface MapRoute {
  id: string;
  prefectureCode: number; // JIS 1〜47
  title: string;
  points: RoutePoint[];
}

// すべての地図実装が満たす契約
export interface MapViewProps {
  routes: MapRoute[];
  selectedPrefecture: number | null;
  selectedRouteId: string | null;
  onSelectPrefecture: (code: number | null) => void;
  onSelectRoute: (id: string | null) => void;
}