import { MapContainer, TileLayer, Marker, Polyline, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// 経由地の種別ごとに色分けしたピンを作る（divIcon でCSS不要に）。
function pinIcon(color) {
  return L.divIcon({
    className: 'route-pin',
    html: `<div style="
      background:${color};
      width:18px;height:18px;border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      border:2px solid #fff;
      box-shadow:0 1px 4px rgba(0,0,0,.4);"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 18],
    popupAnchor: [0, -16],
  });
}

const ICONS = {
  start: pinIcon('#16a34a'),
  middle: pinIcon('#2563eb'),
  goal: pinIcon('#dc2626'),
};

// クリックで地点を追加するためのイベントハンドラ（編集モード時のみ使用）。
function ClickCapture({ onAddPoint }) {
  useMapEvents({
    click(e) {
      onAddPoint({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

// 経由地リストから種別を導出（先頭=start / 末尾=goal / 中間=middle）。
export function deriveType(index, total) {
  if (index === 0) return 'start';
  if (index === total - 1) return 'goal';
  return 'middle';
}

/**
 * points: [{ lat, lng, label?, point_type? }]
 * onAddPoint: (latlng) => void  ※指定時はクリックで地点追加できる編集モード
 * center / zoom: 初期表示
 */
export default function RouteMap({
  points = [],
  onAddPoint,
  center = [36.2048, 138.2529], // 日本の概ね中心
  zoom = 5,
  className = 'map-box',
}) {
  const positions = points.map((p) => [p.lat, p.lng]);

  return (
    <div className={className}>
      <MapContainer
        center={center}
        zoom={zoom}
        maxZoom={17}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={17}
          // --- 通信量削減のためのタイル取得設定 ---
          keepBuffer={1}            // 画面外に保持する余剰タイルを最小化
          updateWhenZooming={false} // ズームアニメ中の中間タイルを取得しない
          updateWhenIdle={true}     // パンが止まってから取得（移動中の連続取得を抑制）
        />
        {onAddPoint && <ClickCapture onAddPoint={onAddPoint} />}
        {positions.length >= 2 && <Polyline positions={positions} color="#2563eb" weight={4} />}
        {points.map((p, i) => {
          const type = p.point_type ?? deriveType(i, points.length);
          return (
            <Marker key={i} position={[p.lat, p.lng]} icon={ICONS[type] ?? ICONS.middle}>
              <Popup>
                <strong>{type === 'start' ? '出発' : type === 'goal' ? '到着' : '中間'}</strong>
                {p.label ? <>：{p.label}</> : null}
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
