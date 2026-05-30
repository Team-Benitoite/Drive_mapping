import type { MapViewProps } from "./types";
import JapanSvgMap from "./impl/JapanSvgMap";
// 将来の差し替えはこの2行を入れ替えるだけ:
// import LeafletMap from "./impl/LeafletMap";

export default function MapView(props: MapViewProps) {
  return <JapanSvgMap {...props} />;
}