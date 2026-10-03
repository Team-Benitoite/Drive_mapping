import { useEffect, useRef, useState } from 'react';
import { prefectureMap } from '../utils/prefectures.js';
import { navigate } from '../utils/navigation.jsx';

// -----------------------------------------------------------------
// 【追加】地方ごとのカラーマップ定義
// 各地方に所属する都道府県コード(prefecture)と表示色(color, hover)を設定
// -----------------------------------------------------------------
export const REGIONS = {
  hokkaidoTohoku: { id: 'hokkaidoTohoku', name: '北海道・東北', color: '#3B82F6', hover: '#2563EB', prefecture: [1, 2, 3, 4, 5, 6, 7] },
  kanto: { id: 'kanto', name: '関東', color: '#8B5CF6', hover: '#7C3AED', prefecture: [8, 9, 10, 11, 12, 13, 14] },
  chubu: { id: 'chubu', name: '中部・北陸', color: '#10B981', hover: '#059669', prefecture: [15, 16, 17, 18, 19, 20, 21, 22, 23] },
  kinki: { id: 'kinki', name: '近畿', color: '#F59E0B', hover: '#D97706', prefecture: [24, 25, 26, 27, 28, 29, 30] },
  chugoku: { id: 'chugoku', name: '中国', color: '#EC4899', hover: '#DB2777', prefecture: [31, 32, 33, 34, 35] },
  shikoku: { id: 'shikoku', name: '四国', color: '#06B6D4', hover: '#0891B2', prefecture: [36, 37, 38, 39] },
  kyushuOkinawa: { id: 'kyushuOkinawa', name: '九州・沖縄', color: '#EF4444', hover: '#DC2626', prefecture: [40, 41, 42, 43, 44, 45, 46, 47] }
};

// -----------------------------------------------------------------
// 【追加】都道府県コードから該当する地方オブジェクトを取得する関数
// -----------------------------------------------------------------
export function getRegionByCode(code) {
  const numCode = Number(code);
  for (const regKey in REGIONS) {
    if (REGIONS[regKey].prefecture.includes(numCode)) {
      return REGIONS[regKey];
    }
  }
  return { id: 'other', name: 'その他', color: '#6B7280', hover: '#4B5563' };
}

// 元の都道府県データ（コード、名称、ポリゴン座標）[cite: 2]
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

export default function JapanMap({ counts = {}, hrefForCode }) {
  const imageRef = useRef(null); // 画像エレメントの参照保持[cite: 2]
  const [scale, setScale] = useState({ x: 1, y: 1 }); // 画像リサイズ時の縮尺状態[cite: 2]
  const [hoveredPref, setHoveredPref] = useState(null); // 【追加】現在ホバーされている都道府県コード

  // ヒートマップ表示切り替えの永続化ステート[cite: 2]
  const [heatOn, setHeatOn] = useState(() => {
    try {
      return localStorage.getItem('dm_heatmap_on') === '1';
    } catch {
      return false;
    }
  });

  // ウィンドウリサイズ時に画像とマップ座標の縮尺を同期計算[cite: 2]
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

  // クリック時の遷移処理[cite: 2]
  function handleClick(event, code) {
    event.preventDefault();
    navigate(hrefForCode ? hrefForCode(code) : `/routes?prefecture_code=${code}`);
  }

  // ヒートマップ表示切り替えスイッチ[cite: 2]
  function toggleHeat() {
    const next = !heatOn;
    setHeatOn(next);
    localStorage.setItem('dm_heatmap_on', next ? '1' : '0');
  }

// 16進数カラーを半透明（RGBA）に変換する関数をコンポーネント外に追加
function hexToRgba(hex, alpha = 0.5) {
  if (!hex || !hex.startsWith('#')) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

  // 投稿数に応じたヒートマップ背景色の判定[cite: 2]
  function heatColor(count) {
    if (count <= 0) return 'rgba(0,0,0,0)';
    if (count <= 10) return 'rgba(82, 190, 0, 0.30)';
    if (count <= 20) return 'rgba(237, 233, 0, 0.30)';
    return 'rgba(240, 23, 23, 0.30)';
  }

  // SVG用：カンマ区切りの座標をSVG polygon形式に変換[cite: 2]
  function coordsToPoints(coords) {
    const values = coords.split(',');
    const points = [];
    for (let index = 0; index < values.length; index += 2) {
      points.push(`${values[index]},${values[index + 1]}`);
    }
    return points.join(' ');
  }

  // HTML map用：画像の実際の表示サイズに合わせて座標をスケール変換[cite: 2]
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
    <div className={`dm-map-wrap ${heatOn ? 'heat-on' : ''}`}>
      <div className="dm-map-stage">
        {/* 投稿件数（ヒートマップ）のON/OFF切り替えボタン[cite: 2] */}
        <div className="dm-map-togglebar">
          <span>投稿件数</span>
          <button type="button" aria-pressed={heatOn} onClick={toggleHeat}>
            {heatOn ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* 土台の地図画像[cite: 2] */}
        <img
          ref={imageRef}
          src="/map.jpg"
          useMap="#image-map"
          alt="日本地図"
          onLoad={() => {
            const image = imageRef.current;
            if (!image || !image.naturalWidth || !image.naturalHeight) return;
            setScale({
              x: image.clientWidth / image.naturalWidth,
              y: image.clientHeight / image.naturalHeight,
            });
          }}
        />

        {/* クリック領域を判定するHTMLイメージマップ[cite: 2] */}
        <map name="image-map">
          {areas.map(([code, name, coords]) => {
            const count = counts[code] || 0;
            const region = getRegionByCode(code); // 【追加】該当都道府県の地方情報を取得
            return (
              <area
                key={code}
                alt={name}
                /* ツールチップに地方名を追加表示 */
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

        {/* 【修正】ヒートマップオーバーレイ ＋ 地方ごとの色分けレイヤー */}
        {/* SVG用オーバーレイ */}
    <svg
        className="dm-heat-overlay"
        viewBox="0 0 894 894"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
    >
        {areas.map(([code, , coords]) => {
            const count = counts[code] || 0;
            const region = getRegionByCode(code); // 地方情報を取得
        
        // 投稿件数OFF時：地方の基本色を半透明(alpha: 0.55)、ホバー時は少し濃く(alpha: 0.8)
            // 投稿件数ON時：ヒートマップ色
            let fillColor;
            if (heatOn) {
            fillColor = heatColor(count);
            } else {
            const baseColor = hoveredPref === code ? region.hover : region.color;
            fillColor = hexToRgba(baseColor, hoveredPref === code ? 0.8 : 0.55);
            }

            return (
            <polygon
                key={code}
                points={coordsToPoints(coords)}
                fill={fillColor}
                stroke="rgba(0,0,0,0.30)"
                strokeWidth="1"
                style={{
                transition: 'fill 0.15s ease',
                pointerEvents: 'none' // クリックイベントを下の <area> に透過させる[cite: 1, 2]
                }}
            />
            );
        })}
        </svg>
      </div>

      {/* 【追加】地方グループの凡例表示 */}
      {!heatOn && (
        <div className="dm-region-legend" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px', fontSize: '12px' }}>
          {Object.values(REGIONS).map((reg) => (
            <span key={reg.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '10px', height: '10px', backgroundColor: reg.color, borderRadius: '2px' }} />
              {reg.name}
            </span>
          ))}
        </div>
      )}

      {/* 投稿数ヒートマップの凡例表示[cite: 2] */}
      {heatOn && (
        <div className="dm-map-legend" aria-label="凡例">
          <span className="chip">
            <span className="dot" style={{ background: 'rgba(82, 190, 0, 0.76)' }} />
            1〜10件
          </span>
          <span className="chip">
            <span className="dot" style={{ background: 'rgba(237, 233, 0, 0.89)' }} />
            11〜20件
          </span>
          <span className="chip">
            <span className="dot" style={{ background: 'rgba(240, 23, 23, 0.88)' }} />
            21件以上
          </span>
        </div>
      )}
    </div>
  );
}