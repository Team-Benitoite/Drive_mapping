"use client";
import { useState } from "react";
import MapView from "./map/MapView";
import type { MapRoute } from "./map/types";

// 仮データ（後で Supabase の取得結果に差し替え）
const SAMPLE_ROUTES: MapRoute[] = [
  { id: "1", prefectureCode: 20, title: "ビーナスライン", points: [
    { type: "start",  label: "茅野",   lng: 138.157, lat: 35.999 },
    { type: "middle", label: "霧ヶ峰", lng: 138.193, lat: 36.103 },
    { type: "goal",   label: "美ヶ原", lng: 138.111, lat: 36.230 },
  ]},
  { id: "2", prefectureCode: 14, title: "箱根ターンパイク", points: [
    { type: "start",  label: "小田原", lng: 139.159, lat: 35.264 },
    { type: "middle", label: "大観山", lng: 139.025, lat: 35.207 },
    { type: "goal",   label: "芦ノ湖", lng: 139.012, lat: 35.205 },
  ]},
  { id: "3", prefectureCode: 1, title: "パッチワークの路", points: [
    { type: "start",  label: "美瑛駅",   lng: 142.469, lat: 43.589 },
    { type: "middle", label: "四季彩の丘", lng: 142.512, lat: 43.553 },
    { type: "goal",   label: "青い池",   lng: 142.625, lat: 43.498 },
  ]},
  { id: "4", prefectureCode: 26, title: "鯖街道アタック", points: [
    { type: "start",  label: "出町柳", lng: 135.773, lat: 35.030 },
    { type: "middle", label: "大原",   lng: 135.834, lat: 35.119 },
    { type: "goal",   label: "久多",   lng: 135.782, lat: 35.295 },
  ]},
];

export default function Home() {
  const [pref, setPref] = useState<number | null>(null);
  const [routeId, setRouteId] = useState<string | null>(null);

  const visible = pref ? SAMPLE_ROUTES.filter((r) => r.prefectureCode === pref) : SAMPLE_ROUTES;

  return (
    <div style={{ position: "relative", width: "100%", height: "100dvh" }}>
      <MapView
        routes={SAMPLE_ROUTES}
        selectedPrefecture={pref}
        selectedRouteId={routeId}
        onSelectPrefecture={(c) => { setPref(c); setRouteId(null); }}
        onSelectRoute={setRouteId}
      />

      {/* 暫定ルート選択UI（後で RoutePanel に置換） */}
      <div style={{
        position: "absolute", top: 12, left: 12, display: "flex", flexDirection: "column",
        gap: 6, background: "#0c161bcc", border: "1px solid #1f2d34", borderRadius: 10,
        padding: 10, color: "#e7eef0", fontSize: 13, maxWidth: 220,
      }}>
        <div style={{ color: "#8aa0a8", fontSize: 11 }}>ルートを選択</div>
        {visible.map((r) => (
          <button key={r.id} onClick={() => setRouteId(r.id)}
            style={{
              textAlign: "left", cursor: "pointer", borderRadius: 8, padding: "6px 8px",
              border: `1px solid ${routeId === r.id ? "#fbbf24" : "#1f2d34"}`,
              background: routeId === r.id ? "#15282f" : "transparent", color: "inherit",
            }}>
            {r.title}
          </button>
        ))}
      </div>
    </div>
  );
}