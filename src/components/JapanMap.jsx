import { useEffect, useRef, useState } from 'react';
import { prefectureMap } from '../utils/prefectures.js';
import { navigate } from '../utils/navigation.jsx';

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

export default function JapanMap({ counts, hrefForCode }) {
  const imageRef = useRef(null);
  const [scale, setScale] = useState({ x: 1, y: 1 });
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

  function handleClick(event, code) {
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
    <div className={`dm-map-wrap ${heatOn ? 'heat-on' : ''}`}>
      <div className="dm-map-togglebar">
        <span>カラー</span>
        <button type="button" aria-pressed={heatOn} onClick={toggleHeat}>
          {heatOn ? 'ON' : 'OFF'}
        </button>
      </div>

      <div className="dm-map-legend" aria-label="凡例">
        <span className="chip">
          <span
            className="dot"
            style={{ background: 'rgba(82, 190, 0, 0.76)' }}
          />
          1〜10件
        </span>
        <span className="chip">
          <span
            className="dot"
            style={{ background: 'rgba(237, 233, 0, 0.89)' }}
          />
          11〜20件
        </span>
        <span className="chip">
          <span
            className="dot"
            style={{ background: 'rgba(240, 23, 23, 0.88)' }}
          />
          21件以上
        </span>
      </div>

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

      <map name="image-map">
        {areas.map(([code, name, coords]) => {
          const count = counts[code] || 0;
          return (
            <area
              key={code}
              alt={name}
              title={`${prefectureMap[code] || name} / 投稿 ${count} 件`}
              href={hrefForCode ? hrefForCode(code) : `/routes?prefecture_code=${code}`}
              data-pref={code}
              coords={scaledCoords(coords)}
              shape="poly"
              onClick={(event) => handleClick(event, code)}
            />
          );
        })}
      </map>

      <svg
        className="dm-heat-overlay"
        viewBox="0 0 894 894"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        {areas.map(([code, , coords]) => {
          const count = counts[code] || 0;
          return (
            <polygon
              key={code}
              points={coordsToPoints(coords)}
              fill={heatColor(count)}
              stroke="rgba(0,0,0,0.20)"
              strokeWidth="1"
            />
          );
        })}
      </svg>
    </div>
  );
}
