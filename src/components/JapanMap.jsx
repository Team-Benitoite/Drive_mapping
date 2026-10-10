import { useEffect, useRef, useState } from 'react';
import { prefectureMap } from '../utils/prefectures.js';
import { navigate } from '../utils/navigation.jsx';

export const REGIONS = {
  hokkaidoTohoku: { id: 'hokkaidoTohoku', name: '北海道・東北', color: '#3B82F6', hover: '#2563EB', prefecture: [1, 2, 3, 4, 5, 6, 7] },
  kanto: { id: 'kanto', name: '関東', color: '#8B5CF6', hover: '#7C3AED', prefecture: [8, 9, 10, 11, 12, 13, 14] },
  chubu: { id: 'chubu', name: '中部・北陸', color: '#10B981', hover: '#059669', prefecture: [15, 16, 17, 18, 19, 20, 21, 22, 23] },
  kinki: { id: 'kinki', name: '近畿', color: '#F59E0B', hover: '#D97706', prefecture: [24, 25, 26, 27, 28, 29, 30] },
  chugoku: { id: 'chugoku', name: '中国', color: '#EC4899', hover: '#DB2777', prefecture: [31, 32, 33, 34, 35] },
  shikoku: { id: 'shikoku', name: '四国', color: '#06B6D4', hover: '#0891B2', prefecture: [36, 37, 38, 39] },
  kyushuOkinawa: { id: 'kyushuOkinawa', name: '九州・沖縄', color: '#EF4444', hover: '#DC2626', prefecture: [40, 41, 42, 43, 44, 45, 46, 47] }
};

export function getRegionByCode(code) {
  const numCode = Number(code);
  for (const regKey in REGIONS) {
    if (REGIONS[regKey].prefecture.includes(numCode)) {
      return REGIONS[regKey];
    }
  }
  return { id: 'other', name: 'その他', color: '#6B7280', hover: '#4B5563' };
}

function hexToRgba(hex, alpha = 0.5) {
  if (!hex || !hex.startsWith('#')) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// 各都道府県の中心座標（吹き出しの表示基準位置：894x894基準）
const PREF_CENTERS = {
  1: { x: 740, y: 160 },  // 北海道
  2: { x: 697, y: 290 },  // 青森
  3: { x: 724, y: 349 },  // 岩手
  4: { x: 718, y: 411 },  // 宮城
  5: { x: 665, y: 351 },  // 秋田
  6: { x: 665, y: 411 },  // 山形
  7: { x: 696, y: 465 },  // 福島
  8: { x: 727, y: 519 },  // 茨城
  9: { x: 681, y: 513 },  // 栃木
  10: { x: 636, y: 513 }, // 群馬
  11: { x: 657, y: 550 }, // 埼玉
  12: { x: 728, y: 587 }, // 千葉
  13: { x: 669, y: 576 }, // 東京
  14: { x: 665, y: 608 }, // 神奈川
  15: { x: 610, y: 453 }, // 新潟
  16: { x: 543, y: 509 }, // 富山
  17: { x: 499, y: 493 }, // 石川
  18: { x: 484, y: 549 }, // 福井
  19: { x: 620, y: 587 }, // 山梨
  20: { x: 578, y: 550 }, // 長野
  21: { x: 529, y: 567 }, // 岐阜
  22: { x: 609, y: 632 }, // 静岡
  23: { x: 537, y: 632 }, // 愛知
  24: { x: 482, y: 655 }, // 三重
  25: { x: 487, y: 589 }, // 滋賀
  26: { x: 432, y: 581 }, // 京都
  27: { x: 417, y: 634 }, // 大阪
  28: { x: 372, y: 588 }, // 兵庫
  29: { x: 453, y: 643 }, // 奈良
  30: { x: 438, y: 677 }, // 和歌山
  31: { x: 325, y: 567 }, // 鳥取
  32: { x: 276, y: 567 }, // 島根
  33: { x: 325, y: 605 }, // 岡山
  34: { x: 276, y: 605 }, // 広島
  35: { x: 229, y: 588 }, // 山口
  36: { x: 345, y: 692 }, // 徳島
  37: { x: 345, y: 660 }, // 香川
  38: { x: 271, y: 674 }, // 愛媛
  39: { x: 302, y: 716 }, // 高知
  40: { x: 167, y: 628 }, // 福岡
  41: { x: 118, y: 628 }, // 佐賀
  42: { x: 91,  y: 637 }, // 長崎
  43: { x: 139, y: 691 }, // 熊本
  44: { x: 185, y: 648 }, // 大分
  45: { x: 185, y: 701 }, // 宮崎
  46: { x: 139, y: 741 }, // 鹿児島
  47: { x: 87,  y: 795 }   // 沖縄
};

const areas = [
  [47, '沖縄県', '76,774,98,774,99,818,76,817'],
  [46, '鹿児島県', '111,720,111,762,136,763,136,749,161,750,161,773,167,774,196,754,196,731,168,731,168,720'],
  [43, '熊本県', '123,662,123,704,111,713,111,720,167,719,168,662'],
  [45, '宮崎県', '169,672,169,731,197,731,196,690,202,682,202,672'],
  [42, '長崎県', '78,605,78,668,104,668,103,606'],
  [41, '佐賀県', '103,606,104,651,132,650,132,606'],
  [40, '福岡県', '123,661,168,661,168,624,202,625,202,606,133,606,132,650,123,650'],
  [44, '大分県', '168,624,169,672,202,672,202,625'],
  [39, '高知県', '229,699,314,700,376,712,376,733,342,733,332,719,299,719,286,733,229,733'],
  [38, '愛媛県', '229,669,229,700,314,699,314,665,283,664,283,649'],
  [36, '徳島県', '314,672,314,699,376,712,376,672'],
  [37, '香川県', '314,649,314,671,376,672,377,649'],
  [35, '山口県', '250,550,209,578,208,626,250,627'],
  [32, '島根県', '251,585,251,550,301,550,301,584'],
  [34, '広島県', '251,584,251,626,301,626,301,584'],
  [31, '鳥取県', '301,550,302,584,348,584,348,550'],
  [33, '岡山県', '301,584,302,626,348,626,348,584'],
  [28, '兵庫県', '348,550,349,626,397,627,396,550'],
  [27, '大阪府', '397,627,397,612,437,612,437,656,410,656,410,627'],
  [26, '京都府', '397,550,397,612,468,612,468,567,428,566,428,550'],
  [29, '奈良県', '438,612,438,675,468,675,469,612'],
  [30, '和歌山県', '409,656,409,699,468,699,468,675,438,675,437,656'],
  [24, '三重県', '468,612,469,699,497,699,496,632,506,632,505,612'],
  [25, '滋賀県', '469,567,469,612,505,612,505,567'],
  [18, '福井県', '429,555,429,566,513,567,513,532,455,532,455,555'],
  [17, '石川県', '513,474,485,474,485,512,455,531,513,532'],
  [16, '富山県', '514,497,534,497,572,468,572,522,514,522'],
  [21, '岐阜県', '514,523,514,567,505,567,506,612,554,612,553,523'],
  [23, '愛知県', '506,612,506,632,517,632,518,653,568,653,568,612'],
  [20, '長野県', '554,522,554,612,602,612,602,563,612,563,612,488,572,488,572,522'],
  [15, '新潟県', '647,418,638,418,572,468,572,488,648,488'],
  [10, '群馬県', '613,488,613,538,659,537,659,488'],
  [19, '山梨県', '602,563,637,563,637,612,603,612'],
  [22, '静岡県', '568,612,568,653,599,653,630,633,630,654,651,654,651,627,637,626,637,612'],
  [11, '埼玉県', '612,538,613,563,703,563,703,537'],
  [13, '東京都', '637,563,637,591,702,590,702,563'],
  [14, '神奈川県', '637,591,637,626,693,627,693,591'],
  [9, '栃木県', '659,488,659,537,703,537,702,489'],
  [12, '千葉県', '703,550,703,590,716,590,717,625,754,625,753,549'],
  [8, '茨城県', '702,488,703,549,753,549,744,541,744,489'],
  [7, '福島県', '647,443,649,488,744,488,744,442'],
  [6, '山形県', '638,380,637,417,647,417,648,442,692,442,693,379'],
  [4, '宮城県', '693,380,692,442,744,441,744,380'],
  [5, '秋田県', '637,322,638,380,693,380,693,323'],
  [3, '岩手県', '694,323,693,379,744,379,756,369,756,323'],
  [2, '青森県', '638,276,638,322,756,322,755,309,726,288,725,257,701,257,700,288,669,288,669,275'],
  [1, '北海道', '672,80,672,187,638,213,638,246,689,246,689,228,712,227,753,256,802,228,845,228,846,158,812,158,716,80'],
];

export default function JapanMap({ counts = {}, topPrefectures = [], hrefForCode }) {
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  
  const [scale, setScale] = useState({ x: 1, y: 1 });
  const [hoveredPref, setHoveredPref] = useState(null);

  // --- ドラッグ＆ズームのステート管理 ---
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const [heatOn, setHeatOn] = useState(() => {
    try {
      return localStorage.getItem('dm_heatmap_on') === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    function updateScale() {
      const image = imageRef.current;
      if (!image || !image.naturalWidth || !image.naturalHeight) return;
      setScale({
        x: image.clientWidth / image.naturalWidth,
        y: image.clientHeight / image.naturalHeight,
      });
    }

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  // --- マウス操作（ドラッグ・ズーム）処理 ---
  function handleWheel(e) {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    setZoom((prevZoom) => Math.min(Math.max(prevZoom * zoomFactor, 0.8), 3.5));
  }

  function handleMouseDown(e) {
    if (e.button !== 0) return; // 左クリックのみ
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  }

  function handleMouseMove(e) {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  }

  function handleMouseUp() {
    setIsDragging(false);
  }

  function resetView() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }

  function handleClick(event, code) {
    if (isDragging) return; // ドラッグ移動中の誤クリック防止
    event.preventDefault();
    navigate(hrefForCode ? hrefForCode(code) : `/routes?prefecture_code=${code}`);
  }

  function toggleHeat() {
    const next = !heatOn;
    setHeatOn(next);
    localStorage.setItem('dm_heatmap_on', next ? '1' : '0');
  }

  function heatColor(count) {
    if (count <= 0) return 'rgba(0,0,0,0)';
    if (count <= 10) return 'rgba(82, 190, 0, 0.30)';
    if (count <= 20) return 'rgba(237, 233, 0, 0.30)';
    return 'rgba(240, 23, 23, 0.30)';
  }

  function coordsToPoints(coords) {
    const values = coords.split(',');
    const points = [];
    for (let index = 0; index < values.length; index += 2) {
      points.push(`${values[index]},${values[index + 1]}`);
    }
    return points.join(' ');
  }

  function scaledCoords(coords) {
    return coords
      .split(',')
      .map((value, index) => {
        const ratio = index % 2 === 0 ? scale.x : scale.y;
        return Math.round(Number(value) * ratio);
      })
      .join(',');
  }

  return (
    <div 
      className="dm-map-viewport" 
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        position: 'relative',
        overflow: 'hidden',
        cursor: isDragging ? 'grabbing' : 'grab',
        width: '100%',
        height: 'calc(100vh - 120px)',
        minHeight: '600px',
        background: '#f8fafc',
        borderRadius: '16px',
        boxShadow: 'inset 0 0 20px rgba(0,0,0,0.03)'
      }}
    >
      {/* ズーム & リセットコントロールUI */}
      <div className="dm-map-controls" style={{ position: 'absolute', bottom: 20, right: 20, zIndex: 10, display: 'flex', gap: '8px' }}>
        <button type="button" onClick={() => setZoom((z) => Math.min(z * 1.2, 3.5))} className="map-btn">+</button>
        <button type="button" onClick={() => setZoom((z) => Math.max(z * 0.8, 0.8))} className="map-btn">-</button>
        <button type="button" onClick={resetView} className="map-btn reset-btn">リセット</button>
      </div>

      <div className={`dm-map-wrap ${heatOn ? 'heat-on' : ''}`}>
        {/* ドラッグ＆拡大のTransformを適用する領域 */}
        <div 
          className="dm-map-stage"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            position: 'relative',
            width: '100%',
            maxWidth: '894px',
            margin: '0 auto'
          }}
        >
          {/* 投稿件数のON/OFFスイッチ */}
          <div className="dm-map-togglebar">
            <span>投稿件数</span>
            <button type="button" aria-pressed={heatOn} onClick={toggleHeat}>
              {heatOn ? 'ON' : 'OFF'}
            </button>
          </div>

          <img
            ref={imageRef}
            src="/map.jpg"
            useMap="#image-map"
            alt="日本地図"
            style={{ width: '100%', height: 'auto', display: 'block' }}
            onLoad={() => {
              const image = imageRef.current;
              if (!image || !image.naturalWidth || !image.naturalHeight) return;
              setScale({
                x: image.clientWidth / image.naturalWidth,
                y: image.clientHeight / image.naturalHeight,
              });
            }}
          />

          <map name="image-map">
            {areas.map(([code, name, coords]) => {
              const count = counts[code] || 0;
              const region = getRegionByCode(code);
              return (
                <area
                  key={code}
                  alt={name}
                  title={`${prefectureMap[code] || name}（${region.name}） / 投稿 ${count} 件`}
                  href={hrefForCode ? hrefForCode(code) : `/routes?prefecture_code=${code}`}
                  data-pref={code}
                  coords={scaledCoords(coords)}
                  shape="poly"
                  onClick={(event) => handleClick(event, code)}
                  onMouseEnter={() => setHoveredPref(code)}
                  onMouseLeave={() => setHoveredPref(null)}
                />
              );
            })}
          </map>

          {/* SVG オーバーレイ（都道府県の色付け） */}
          <svg
            className="dm-heat-overlay"
            viewBox="0 0 894 894"
            preserveAspectRatio="none"
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'block',
              pointerEvents: 'none',
              zIndex: 2,
            }}
          >
            {areas.map(([code, , coords]) => {
              const count = counts[code] || 0;
              const region = getRegionByCode(code);

              let fillColor;
              if (heatOn) {
                fillColor = heatColor(count);
              } else {
                const baseColor = hoveredPref === code ? region.hover : region.color;
                fillColor = hexToRgba(baseColor, hoveredPref === code ? 0.75 : 0.45);
              }

              return (
                <polygon
                  key={code}
                  points={coordsToPoints(coords)}
                  fill={fillColor}
                  stroke="rgba(0,0,0,0.25)"
                  strokeWidth="1"
                  style={{ transition: 'fill 0.15s ease' }}
                />
              );
            })}
          </svg>

          {/* ★ いいね集計が高い都道府県に表示するポップアップ吹き出し（Pin & Popup） */}
          {topPrefectures.map((item) => {
            const center = PREF_CENTERS[item.prefecture_code];
            if (!center) return null;

            // 各座標の比率を計算 (894px 基準)
            const posX = (center.x / 894) * 100;
            const posY = (center.y / 894) * 100;

            return (
              <div
                key={item.prefecture_code}
                className="map-top-popup"
                style={{
                  position: 'absolute',
                  left: `${posX}%`,
                  top: `${posY}%`,
                  transform: 'translate(-50%, -100%)',
                  zIndex: 10,
                  pointerEvents: 'auto'
                }}
                onClick={() => navigate(`/routes?prefecture_code=${item.prefecture_code}`)}
              >
                <div className="popup-card">
                  <span className="popup-rank">★ 人気 Top</span>
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.title} className="popup-img" />
                  ) : (
                    <div className="popup-img-placeholder">No Image</div>
                  )}
                  <div className="popup-content">
                    <span className="popup-pref">{prefectureMap[item.prefecture_code]}</span>
                    <h4 className="popup-title">{item.title || '人気のドライブコース'}</h4>
                    <span className="popup-likes">♥ {item.like_count} Likes</span>
                  </div>
                </div>
                <div className="popup-arrow" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}