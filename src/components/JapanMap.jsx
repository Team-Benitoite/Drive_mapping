import React, { useState, useRef } from 'react';
import { prefectureMap } from '../utils/prefectures.js';
import { navigate } from '../utils/navigation.jsx';

export const REGIONS = {
  hokkaidoTohoku: { id: 'hokkaidoTohoku', name: '北海道・東北', color: '#3B82F6', hover: '#2563EB', prefs: [1, 2, 3, 4, 5, 6, 7] },
  kanto: { id: 'kanto', name: '関東', color: '#8B5CF6', hover: '#7C3AED', prefs: [8, 9, 10, 11, 12, 13, 14] },
  chubu: { id: 'chubu', name: '中部・北陸', color: '#10B981', hover: '#059669', prefs: [15, 16, 17, 18, 19, 20, 21, 22, 23] },
  kinki: { id: 'kinki', name: '近畿', color: '#F59E0B', hover: '#D97706', prefs: [24, 25, 26, 27, 28, 29, 30] },
  chugoku: { id: 'chugoku', name: '中国', color: '#EC4899', hover: '#DB2777', prefs: [31, 32, 33, 34, 35] },
  shikoku: { id: 'shikoku', name: '四国', color: '#06B6D4', hover: '#0891B2', prefs: [36, 37, 38, 39] },
  kyushuOkinawa: { id: 'kyushuOkinawa', name: '九州・沖縄', color: '#EF4444', hover: '#DC2626', prefs: [40, 41, 42, 43, 44, 45, 46, 47] }
};

export function getRegionByCode(code) {
  const numCode = Number(code);
  for (const regKey in REGIONS) {
    if (REGIONS[regKey].prefs.includes(numCode)) {
      return REGIONS[regKey];
    }
  }
  return { id: 'other', name: 'その他', color: '#6B7280', hover: '#4B5563' };
}

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
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);
  
  const [heatOn, setHeatOn] = useState(() => {
    try {
      return localStorage.getItem('dm_heatmap_on') === '1';
    } catch {
      return false;
    }
  });
  const [hoveredPref, setHoveredPref] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const containerRef = useRef(null);

  function heatColor(count) {
    if (count <= 0) return 'rgba(255,255,255,0.1)';
    if (count <= 5) return 'rgba(34, 197, 94, 0.4)';
    if (count <= 15) return 'rgba(234, 179, 8, 0.5)';
    return 'rgba(239, 68, 68, 0.6)';
  }

  function coordsToPoints(coords) {
    const values = coords.split(',');
    const points = [];
    for (let index = 0; index < values.length; index += 2) {
      points.push(`${values[index]},${values[index + 1]}`);
    }
    return points.join(' ');
  }

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setHasMoved(false);
    setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      
      if (Math.abs(newX - transform.x) > 3 || Math.abs(newY - transform.y) > 3) {
        setHasMoved(true);
      }
      
      setTransform((prev) => ({ ...prev, x: newX, y: newY }));
    }

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setTooltipPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClick = (e, code) => {
    if (hasMoved) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    e.preventDefault();
    navigate(hrefForCode ? hrefForCode(code) : `/routes?prefecture_code=${code}`);
  };

  const handleZoom = (factor) => {
    setTransform((prev) => {
      const newScale = Math.min(Math.max(prev.scale * factor, 0.6), 3.0);
      return { ...prev, scale: newScale };
    });
  };

  const handleReset = () => {
    setTransform({ x: 0, y: 0, scale: 1 });
  };

  const toggleHeat = () => {
    const next = !heatOn;
    setHeatOn(next);
    try {
      localStorage.setItem('dm_heatmap_on', next ? '1' : '0');
    } catch (e) {
      console.warn(e);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[600px] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 select-none cursor-grab active:cursor-grabbing"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* 画面左上：コントロールボタン */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 bg-slate-800/80 backdrop-blur-md p-2 rounded-xl border border-slate-700/50 shadow-lg">
        <button
          onClick={() => handleZoom(1.2)}
          className="w-10 h-10 bg-slate-700 hover:bg-slate-600 active:scale-95 text-white font-bold rounded-lg transition flex items-center justify-center text-lg"
          title="拡大"
        >
          ＋
        </button>
        <button
          onClick={() => handleZoom(0.8)}
          className="w-10 h-10 bg-slate-700 hover:bg-slate-600 active:scale-95 text-white font-bold rounded-lg transition flex items-center justify-center text-lg"
          title="縮小"
        >
          －
        </button>
        <button
          onClick={handleReset}
          className="w-10 h-10 bg-slate-700 hover:bg-slate-600 active:scale-95 text-white rounded-lg transition flex items-center justify-center text-xs font-bold"
          title="リセット"
        >
          RESET
        </button>
        <div className="h-[1px] bg-slate-700 my-1" />
        <button
          onClick={toggleHeat}
          className={`w-10 h-10 rounded-lg text-xs font-bold transition flex items-center justify-center ${
            heatOn ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-700 text-slate-300'
          }`}
          title="ヒートマップ表示切替"
        >
          {heatOn ? '熱ON' : '熱OFF'}
        </button>
      </div>

      {/* 画面右上：凡例 */}
      <div className="absolute top-4 right-4 z-20 bg-slate-800/80 backdrop-blur-md px-4 py-3 rounded-xl border border-slate-700/50 text-xs text-slate-200 flex flex-col gap-2 shadow-lg">
        <span className="font-semibold text-slate-400 mb-1">【凡例】</span>
        {heatOn ? (
          <>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> 1〜5件</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500 inline-block" /> 6〜15件</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> 16件以上</div>
          </>
        ) : (
          Object.values(REGIONS).map((reg) => (
            <div key={reg.id} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: reg.color }} />
              {reg.name}
            </div>
          ))
        )}
      </div>

      {/* ドラッグ操作案内ヒント */}
      <div className="absolute bottom-4 left-4 z-20 bg-slate-800/60 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs text-slate-400 pointer-events-none">
        💡 ドラッグで移動 / 都道府県クリックで詳細へ
      </div>

      {/* メインSVG地図コンテンツ */}
      <div
        className="w-full h-full transition-transform duration-75 ease-out"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: 'center center',
        }}
      >
        <svg
          viewBox="0 0 894 894"
          className="w-full h-full drop-shadow-2xl"
          preserveAspectRatio="xMidYMid meet"
        >
          {areas.map(([code, name, coords]) => {
            const count = counts[code] || 0;
            const region = getRegionByCode(code);
            const isHovered = hoveredPref === code;
            
            const fillColor = heatOn ? heatColor(count) : (isHovered ? region.hover : region.color);

            return (
              <polygon
                key={code}
                points={coordsToPoints(coords)}
                fill={fillColor}
                stroke="#0f172a"
                strokeWidth="1.5"
                className="transition-all duration-200 cursor-pointer hover:opacity-90"
                style={{
                  filter: isHovered ? 'drop-shadow(0 0 8px rgba(255,255,255,0.6))' : 'none',
                }}
                onMouseEnter={() => setHoveredPref(code)}
                onMouseLeave={() => setHoveredPref(null)}
                onClick={(e) => handleClick(e, code)}
              />
            );
          })}
        </svg>
      </div>

      {}
      {hoveredPref && (
        <div
          className="absolute z-30 pointer-events-none bg-slate-900/90 text-white text-xs px-3 py-2 rounded-lg shadow-xl border border-slate-700/80 backdrop-blur-md transform -translate-x-1/2 -translate-y-12 transition-all duration-75"
          style={{
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`,
          }}
        >
          <div className="font-bold text-sm text-indigo-400">
            {prefectureMap[hoveredPref]}
          </div>
          <div className="text-slate-300">
            投稿数: <span className="font-extrabold text-amber-400">{counts[hoveredPref] || 0}</span> 件
          </div>
        </div>
      )}
    </div>
  );
}