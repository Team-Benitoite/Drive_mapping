import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { prefectureMap } from '../utils/prefectures';
import { navigate } from '../utils/navigation';
import type { PrefectureCounts, TopPrefecture } from '../types/models';

export const REGIONS = {
  hokkaidoTohoku: { id: 'hokkaidoTohoku', name: '北海道・東北', color: '#38BDF8', hover: '#0284C7', prefecture: [1, 2, 3, 4, 5, 6, 7] },
  kanto: { id: 'kanto', name: '関東', color: '#C084FC', hover: '#9333EA', prefecture: [8, 9, 10, 11, 12, 13, 14] },
  chubu: { id: 'chubu', name: '中部・北陸', color: '#4ADE80', hover: '#16A34A', prefecture: [15, 16, 17, 18, 19, 20, 21, 22, 23] },
  kinki: { id: 'kinki', name: '近畿', color: '#FACC15', hover: '#EAB308', prefecture: [24, 25, 26, 27, 28, 29, 30] },
  chugoku: { id: 'chugoku', name: '中国', color: '#FB7185', hover: '#E11D48', prefecture: [31, 32, 33, 34, 35] },
  shikoku: { id: 'shikoku', name: '四国', color: '#22D3EE', hover: '#0891B2', prefecture: [36, 37, 38, 39] },
  kyushuOkinawa: { id: 'kyushuOkinawa', name: '九州・沖縄', color: '#FB923C', hover: '#EA580C', prefecture: [40, 41, 42, 43, 44, 45, 46, 47] }
};

export function getRegionByCode(code: number) {
  const numCode = Number(code);
  for (const region of Object.values(REGIONS)) {
    if (region.prefecture.includes(numCode)) {
      return region;
    }
  }
  return { id: 'other', name: 'その他', color: '#94A3B8', hover: '#475569' };
}

// 都道府県テキストの表記ルール（「京都」「北海道」対応）
// 基本的に末尾の「県」「府」「都」のみを除去。「京都府」は「京都」、「北海道」は「北海道」
export function formatPrefectureShortName(code: number, rawName: string): string {
  if (code === 1 || rawName.startsWith('北海道')) return '北海道';
  if (code === 26 || rawName.startsWith('京都')) return '京都';
  if (code === 13 || rawName.startsWith('東京')) return '東京';
  if (code === 27 || rawName.startsWith('大阪')) return '大阪';
  const baseName = prefectureMap[code] || rawName;
  return baseName.replace(/（[^）]+）/g, '').replace(/[県府都]$/, '');
}

// 各都道府県の文字数およびマス面積に応じたSVGフォントサイズ最適化（マス枠からはみ出さない）
export function getPrefectureFontSize(code: number, shortName: string): number {
  if (shortName.length >= 4) return 8.2; // 神奈川、和歌山、鹿児島など
  if (shortName.length === 3) return 9.0; // 北海道
  // マス面積が特に狭い都道府県
  if (code === 13) return 8.5; // 東京
  if (code === 37) return 8.0; // 香川
  if (code === 41) return 8.0; // 佐賀
  if (code === 27) return 8.5; // 大阪
  if (code === 14) return 8.2; // 神奈川
  return 10.0;
}

// 各都道府県の県庁所在地（緯度経度テーブル：現在地からの最近傍判定用）
const PREFECTURE_LOCATIONS: Record<number, { lat: number; lng: number }> = {
  1: { lat: 43.06417, lng: 141.34694 }, // 北海道（札幌）
  2: { lat: 40.82444, lng: 140.74 },     // 青森
  3: { lat: 39.70361, lng: 141.1525 },   // 岩手（盛岡）
  4: { lat: 38.26889, lng: 140.87194 },  // 宮城（仙台）
  5: { lat: 39.71861, lng: 140.1025 },   // 秋田
  6: { lat: 38.24056, lng: 140.36333 },  // 山形
  7: { lat: 37.75, lng: 140.46778 },     // 福島
  8: { lat: 36.34139, lng: 140.44667 },  // 茨城（水戸）
  9: { lat: 36.56583, lng: 139.88361 },  // 栃木（宇都宮）
  10: { lat: 36.39111, lng: 139.06083 }, // 群馬（前橋）
  11: { lat: 35.85694, lng: 139.64889 }, // 埼玉（さいたま）
  12: { lat: 35.60472, lng: 140.12333 }, // 千葉
  13: { lat: 35.68944, lng: 139.69167 }, // 東京（新宿）
  14: { lat: 35.44778, lng: 139.6425 },  // 神奈川（横浜）
  15: { lat: 37.90222, lng: 139.02361 }, // 新潟
  16: { lat: 36.69528, lng: 137.21139 }, // 富山
  17: { lat: 36.59444, lng: 136.62556 }, // 石川（金沢）
  18: { lat: 36.06528, lng: 136.22194 }, // 福井
  19: { lat: 35.66389, lng: 138.56833 }, // 山梨（甲府）
  20: { lat: 36.65139, lng: 138.18111 }, // 長野
  21: { lat: 35.39111, lng: 136.72222 }, // 岐阜
  22: { lat: 34.97694, lng: 138.38306 }, // 静岡
  23: { lat: 35.18028, lng: 136.90667 }, // 愛知（名古屋）
  24: { lat: 34.73028, lng: 136.50861 }, // 三重（津）
  25: { lat: 35.00444, lng: 135.86833 }, // 滋賀（大津）
  26: { lat: 35.02139, lng: 135.75556 }, // 京都
  27: { lat: 34.68639, lng: 135.52 },    // 大阪
  28: { lat: 34.69139, lng: 135.18306 }, // 兵庫（神戸）
  29: { lat: 34.68528, lng: 135.83278 }, // 奈良
  30: { lat: 34.22611, lng: 135.1675 },  // 和歌山
  31: { lat: 35.50361, lng: 134.23833 }, // 鳥取
  32: { lat: 35.47222, lng: 133.05056 }, // 島根（松江）
  33: { lat: 34.66167, lng: 133.935 },   // 岡山
  34: { lat: 34.39639, lng: 132.45944 }, // 広島
  35: { lat: 34.18583, lng: 131.47139 }, // 山口
  36: { lat: 34.06583, lng: 134.55944 }, // 徳島
  37: { lat: 34.34028, lng: 134.04333 }, // 香川（高松）
  38: { lat: 33.84167, lng: 132.76611 }, // 愛媛（松山）
  39: { lat: 33.55972, lng: 133.53111 }, // 高知
  40: { lat: 33.60639, lng: 130.41806 }, // 福岡
  41: { lat: 33.24944, lng: 130.29889 }, // 佐賀
  42: { lat: 32.74472, lng: 129.87361 }, // 長崎
  43: { lat: 32.78972, lng: 130.74167 }, // 熊本
  44: { lat: 33.23806, lng: 131.6125 },  // 大分
  45: { lat: 31.91111, lng: 131.42389 }, // 宮崎
  46: { lat: 31.56028, lng: 130.55806 }, // 鹿児島
  47: { lat: 26.2125, lng: 127.68111 },  // 沖縄（那覇）
};

// 幾何学的重心を計算・補正した都道府県の中心座標（SVG座標 894×894基準）
const PREF_CENTERS: Record<number, { x: number; y: number }> = {
  1: { x: 740, y: 160 }, 2: { x: 695, y: 290 }, 3: { x: 724, y: 351 }, 4: { x: 718, y: 411 },
  5: { x: 665, y: 351 }, 6: { x: 665, y: 411 }, 7: { x: 696, y: 465 }, 8: { x: 727, y: 519 },
  9: { x: 681, y: 513 }, 10: { x: 636, y: 513 }, 11: { x: 657, y: 550 }, 12: { x: 728, y: 587 },
  13: { x: 669, y: 577 }, 14: { x: 665, y: 609 }, 15: { x: 610, y: 453 }, 16: { x: 543, y: 495 },
  17: { x: 484, y: 503 }, 18: { x: 471, y: 550 }, 19: { x: 619, y: 587 }, 20: { x: 583, y: 550 },
  21: { x: 530, y: 567 }, 22: { x: 610, y: 633 }, 23: { x: 537, y: 632 }, 24: { x: 487, y: 655 },
  25: { x: 487, y: 589 }, 26: { x: 432, y: 581 }, 27: { x: 417, y: 634 }, 28: { x: 372, y: 588 },
  29: { x: 453, y: 643 }, 30: { x: 438, y: 677 }, 31: { x: 325, y: 567 }, 32: { x: 276, y: 567 },
  33: { x: 325, y: 605 }, 34: { x: 276, y: 605 }, 35: { x: 229, y: 588 }, 36: { x: 345, y: 692 },
  37: { x: 345, y: 660 }, 38: { x: 271, y: 674 }, 39: { x: 302, y: 716 }, 40: { x: 162, y: 633 },
  41: { x: 118, y: 628 }, 42: { x: 91, y: 637 }, 43: { x: 139, y: 691 }, 44: { x: 185, y: 648 },
  45: { x: 185, y: 701 }, 46: { x: 153, y: 747 }, 47: { x: 87, y: 796 }
};

const areas: [code: number, name: string, coords: string][] = [
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
  [28, '兵庫県（淡路島）', '384,633,384,648,399,648,398,633'],
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
  [15, '新潟県（佐渡島）', '582,425,568,425,550,439,563,439'],
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

// 初期注目ルート（デフォルト）
const DEFAULT_TOP_PREFECTURES: TopPrefecture[] = [
  {
    route_id: 1,
    prefecture_code: 14,
    title: '湘南海岸〜江の島 サンセットオーシャンロード',
    like_count: 42,
    image_url: '/src/assets/images/drive_shonan_coastal_1794028779907.jpg',
  },
  {
    route_id: 2,
    prefecture_code: 22,
    title: '伊豆スカイライン＆富士山パノラマライン',
    like_count: 36,
    image_url: '/src/assets/images/drive_fuji_panorama_1794028779954.jpg',
  },
  {
    route_id: 3,
    prefecture_code: 1,
    title: '美瑛 パッチワークの路＆青い池ドライブ',
    like_count: 29,
    image_url: '/src/assets/images/drive_biei_hills_1794028780301.jpg',
  },
];

// 都道府県ホバー時の代表ルート（写真付きフォールバック名所ルート）
const FALLBACK_PREF_ROUTES: Record<number, { title: string; image_url: string; likes: number }> = {
  1: { title: '美瑛 パッチワークの路＆青い池ドライブ', image_url: '/src/assets/images/drive_biei_hills_1794028780301.jpg', likes: 29 },
  13: { title: 'レインボーブリッジ＆お台場ベイエリアナイトクルーズ', image_url: '/src/assets/images/drive_shonan_coastal_1794028779907.jpg', likes: 28 },
  14: { title: '湘南海岸〜江の島 サンセットオーシャンロード', image_url: '/src/assets/images/drive_shonan_coastal_1794028779907.jpg', likes: 42 },
  17: { title: '千里浜なぎさドライブウェイ 砂浜オーシャンロード', image_url: '/src/assets/images/drive_shonan_coastal_1794028779907.jpg', likes: 24 },
  20: { title: 'ビーナスライン 白樺湖〜霧ヶ峰高原パノラマ', image_url: '/src/assets/images/drive_fuji_panorama_1794028779954.jpg', likes: 31 },
  22: { title: '伊豆スカイライン＆富士山パノラマライン', image_url: '/src/assets/images/drive_fuji_panorama_1794028779954.jpg', likes: 36 },
  26: { title: '嵐山〜高雄パークウェイ 古都パノラマドライブ', image_url: '/src/assets/images/drive_fuji_panorama_1794028779954.jpg', likes: 27 },
  27: { title: '阪神高速湾岸線＆南港サンセットクルーズ', image_url: '/src/assets/images/drive_shonan_coastal_1794028779907.jpg', likes: 22 },
  28: { title: '明石海峡大橋＆淡路島サンセットライン', image_url: '/src/assets/images/drive_shonan_coastal_1794028779907.jpg', likes: 25 },
  35: { title: '角島大橋 エメラルドグリーン海上ドライブルート', image_url: '/src/assets/images/drive_shonan_coastal_1794028779907.jpg', likes: 38 },
  40: { title: '志賀島シーサイドライン＆海の中道ドライブ', image_url: '/src/assets/images/drive_shonan_coastal_1794028779907.jpg', likes: 26 },
  47: { title: '古宇利大橋＆美ら海エメラルドオーシャンロード', image_url: '/src/assets/images/drive_shonan_coastal_1794028779907.jpg', likes: 39 },
};

export interface JapanMapProps {
  counts: PrefectureCounts;
  topPrefectures?: TopPrefecture[];
  popularRoutes?: Record<number, TopPrefecture>;
  hrefForCode?: (code: number) => string;
}

// 初期スケール & 表示位置（デスクトップでは左側カード群と重ならないよう右側へオフセット）
const INITIAL_ZOOM = 1.15;
export const getInitialPan = () => {
  if (typeof window !== 'undefined' && window.innerWidth <= 768) {
    return { x: 0, y: 10 };
  }
  return { x: 75, y: 10 };
};

export default function JapanMap({
  counts = {},
  topPrefectures = [],
  popularRoutes = {},
  hrefForCode,
}: JapanMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const [hoveredPref, setHoveredPref] = useState<number | null>(null);
  const [hoveredCardPhoto, setHoveredCardPhoto] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(INITIAL_ZOOM);
  const [pan, setPan] = useState(getInitialPan);
  const [showGuide, setShowGuide] = useState(true);

  // モバイル位置情報関連の状態
  const [currentLocationPref, setCurrentLocationPref] = useState<number | null>(null);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);

  const mouseDownPosRef = useRef({ x: 0, y: 0 });
  const isMovedRef = useRef(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const [heatOn, setHeatOn] = useState(() => {
    try {
      return localStorage.getItem('dm_heatmap_on') === '1';
    } catch {
      return false;
    }
  });

  const displayCards = useMemo(() => {
    const combined: TopPrefecture[] = [...topPrefectures];
    for (const fallback of DEFAULT_TOP_PREFECTURES) {
      if (combined.length >= 3) break;
      if (!combined.some((item) => item.prefecture_code === fallback.prefecture_code)) {
        combined.push(fallback);
      }
    }
    return combined.slice(0, 3);
  }, [topPrefectures]);

  useEffect(() => {
    const timer = setTimeout(() => setShowGuide(false), 4500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleToggle = () => {
      setHeatOn(localStorage.getItem('dm_heatmap_on') === '1');
    };
    window.addEventListener('dm_heatmap_toggle', handleToggle);
    return () => window.removeEventListener('dm_heatmap_toggle', handleToggle);
  }, []);

  // モバイル端末判定
  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 768 || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  }, []);

  // カメラを特定の都道府県にズーム・中心合わせする計算
  // 仕様：d = (対象県の中心座標 − ステージ中心) × s
  //       pan = ビューポート中心 − ステージ中心 − (zoom × d)
  const focusPrefecture = useCallback((targetCode: number) => {
    const targetCoord = PREF_CENTERS[targetCode];
    if (!targetCoord || !containerRef.current) return;

    const viewport = containerRef.current;
    const stageElement = viewport.querySelector('.game-map-stage') as HTMLElement | null;
    const stageWidth = stageElement?.offsetWidth || 894;

    // SVG viewBoxサイズは894×894、ステージ中心は (447, 447)
    const stageCenterX = 447;
    const stageCenterY = 447;
    const s = stageWidth / 894;

    // モバイルでのズーム倍率
    const targetZoom = 2.1;

    // d = (対象県の中心座標 − ステージ中心) × s
    const dX = (targetCoord.x - stageCenterX) * s;
    const dY = (targetCoord.y - stageCenterY) * s;

    // デスクトップでは左側カードデッキを避けるため右方向に少しオフセット（+45px）
    const desktopOffset = (typeof window !== 'undefined' && window.innerWidth > 768) ? 45 : 0;
    const panX = - (targetZoom * dX) + desktopOffset;
    const panY = - (targetZoom * dY);

    setZoom(targetZoom);
    setPan({ x: Math.round(panX), y: Math.round(panY) });
  }, []);

  // 取得した緯度経度から日本国内の最近傍都道府県を判定
  const detectNearestPrefecture = useCallback((lat: number, lng: number): number | null => {
    // 日本国外のおおよその境界チェック（国外の場合は何事もなかったかのように全国表示）
    if (lat < 24 || lat > 46 || lng < 122 || lng > 154) {
      return null;
    }

    let nearestCode: number | null = null;
    let minDistance = Number.POSITIVE_INFINITY;

    for (const [codeStr, loc] of Object.entries(PREFECTURE_LOCATIONS)) {
      const code = Number(codeStr);
      // 緯度経度の簡易距離（コサイン補正）
      const latDiff = loc.lat - lat;
      const lngDiff = (loc.lng - lng) * Math.cos((lat * Math.PI) / 180);
      const dist = latDiff * latDiff + lngDiff * lngDiff;
      if (dist < minDistance) {
        minDistance = dist;
        nearestCode = code;
      }
    }
    return nearestCode;
  }, []);

  // 位置情報の取得実行
  const executeGeolocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        try {
          localStorage.setItem('dm_geo_choice', 'granted');
        } catch {
          // ignore
        }
        setShowLocationPrompt(false);
        const { latitude, longitude } = position.coords;
        const code = detectNearestPrefecture(latitude, longitude);
        if (code) {
          setCurrentLocationPref(code);
          focusPrefecture(code);
        }
      },
      () => {
        // 取得失敗時は何事もなかったかのように静かに全国表示
        try {
          localStorage.setItem('dm_geo_choice', 'denied');
        } catch {
          // ignore
        }
        setShowLocationPrompt(false);
      },
      { timeout: 8000, enableHighAccuracy: false, maximumAge: 300000 }
    );
  }, [detectNearestPrefecture, focusPrefecture]);

  // モバイル位置情報の初期化・UX取得フロー
  useEffect(() => {
    if (!isMobile) return;

    // 1. localStorage に前回の許可/拒否選択が保存されている場合はそれを再現
    let savedChoice: string | null = null;
    try {
      savedChoice = localStorage.getItem('dm_geo_choice');
    } catch {
      // ignore
    }

    if (savedChoice === 'granted') {
      executeGeolocation();
      return;
    }
    if (savedChoice === 'denied') {
      return;
    }

    // 2. Permissions API チェック
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((result) => {
          if (result.state === 'granted') {
            executeGeolocation();
          } else if (result.state === 'prompt') {
            setShowLocationPrompt(true);
          }
          // 'denied' の場合は静かに全国表示
        })
        .catch(() => {
          setShowLocationPrompt(true);
        });
    } else {
      setShowLocationPrompt(true);
    }
  }, [isMobile, executeGeolocation]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    function handleWheel(event: WheelEvent) {
      event.preventDefault();
      const zoomFactor = event.deltaY < 0 ? 1.12 : 0.88;
      setZoom((value) => Math.min(Math.max(value * zoomFactor, 0.8), 3.5));
    }
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  function handleContainerMouseMove(e: MouseEvent<HTMLDivElement>) {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }

    if (isMouseDown) {
      const dx = Math.abs(e.clientX - mouseDownPosRef.current.x);
      const dy = Math.abs(e.clientY - mouseDownPosRef.current.y);
      if (dx > 5 || dy > 5) {
        isMovedRef.current = true;
      }
      setPan({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      });
    }
  }

  function handleMouseDown(e: MouseEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    setIsMouseDown(true);
    isMovedRef.current = false;
    setShowGuide(false);
    mouseDownPosRef.current = { x: e.clientX, y: e.clientY };
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  }

  function handleMouseUp() {
    setIsMouseDown(false);
  }

  function resetView() {
    setZoom(INITIAL_ZOOM);
    setPan(getInitialPan());
  }

  function handlePrefClick(code: number) {
    if (isMovedRef.current) return;
    const popular = popularRoutes[code];
    if (popular?.route_id) {
      navigate(`/routes/${popular.route_id}`);
    } else {
      navigate(hrefForCode ? hrefForCode(code) : `/routes?prefecture_code=${code}`);
    }
  }

  // お気に入りカードクリック時：直接そのルートの詳細ページ（/routes/${route_id}）へ遷移
  function handleCardClick(e: MouseEvent, item: TopPrefecture) {
    e.stopPropagation();
    if (item.route_id) {
      navigate(`/routes/${item.route_id}`);
    } else {
      navigate(hrefForCode ? hrefForCode(item.prefecture_code) : `/routes?prefecture_code=${item.prefecture_code}`);
    }
  }

  // 投稿件数ON時の分かりやすい多段階ヒートマップ色分け
  function heatColor(count: number) {
    if (count <= 0) return '#E2E8F0'; // 0件: 未投稿（クールグレー）
    if (count <= 2) return '#6EE7B7'; // 1〜2件: ライトミントグリーン
    if (count <= 5) return '#34D399'; // 3〜5件: エメラルドグリーン
    if (count <= 10) return '#FACC15'; // 6〜10件: レモンイエロー
    if (count <= 20) return '#FB923C'; // 11〜20件: ビビッドオレンジ
    return '#EF4444';                  // 21件以上: ホットレッド
  }

  function coordsToPoints(coords: string) {
    const values = coords.split(',');
    const points = [];
    for (let index = 0; index < values.length; index += 2) {
      points.push(`${values[index]},${values[index + 1]}`);
    }
    return points.join(' ');
  }

  // ホバー中の都道府県のNo.1ルート情報（写真urlを確実に提供）
  const activeHoverRoute = useMemo(() => {
    if (!hoveredPref) return null;
    const prefName = formatPrefectureShortName(hoveredPref, prefectureMap[hoveredPref] || '');
    const region = getRegionByCode(hoveredPref);
    const count = counts[hoveredPref] || 0;

    // 1. 実データがあり写真もある場合
    if (popularRoutes[hoveredPref]) {
      const live = popularRoutes[hoveredPref];
      return {
        prefecture_code: hoveredPref,
        prefecture_name: prefName,
        region_name: region.name,
        route_id: live.route_id,
        title: live.title,
        like_count: live.like_count,
        image_url: live.image_url || FALLBACK_PREF_ROUTES[hoveredPref]?.image_url || '/src/assets/images/drive_shonan_coastal_1794028779907.jpg',
        count,
      };
    }

    // 2. フォールバック名所ルートがある場合
    const fallback = FALLBACK_PREF_ROUTES[hoveredPref];
    if (fallback) {
      return {
        prefecture_code: hoveredPref,
        prefecture_name: prefName,
        region_name: region.name,
        route_id: undefined,
        title: fallback.title,
        like_count: fallback.likes,
        image_url: fallback.image_url,
        count,
      };
    }

    // 3. 一般的なご案内（写真付き）
    return {
      prefecture_code: hoveredPref,
      prefecture_name: prefName,
      region_name: region.name,
      route_id: undefined,
      title: `${prefName}の絶景オーシャン＆マウンテンドライブ`,
      like_count: count > 0 ? count * 3 : 15,
      image_url: '/src/assets/images/drive_fuji_panorama_1794028779954.jpg',
      count,
    };
  }, [hoveredPref, popularRoutes, counts]);

  return (
    <div className="japan-map-component-root">
      {/* ゲーム盤面ビューポート（深みと透明感のあるマリンブルーグラデーション ＋ 薄いグリッドマス目） */}
      <div
        className="dm-map-viewport game-board-viewport"
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleContainerMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* 【新機能】お気に入りカード hover 連動：盤面背景写真バックドロップ */}
        <div
          className={`game-board-photo-backdrop ${hoveredCardPhoto ? 'is-active' : ''}`}
          style={{
            backgroundImage: hoveredCardPhoto ? `url("${hoveredCardPhoto}")` : undefined,
          }}
          aria-hidden="true"
        />

        {/* ゲームタイトルバッジ */}
        <div className="game-board-badge" aria-hidden="true">
          <span className="game-badge-icon">🏍️</span>
          <span className="game-badge-text">日本縦断ドライブ</span>
        </div>

        {/* モバイル専用：位置情報確認チップ */}
        {showLocationPrompt && (
          <div className="mobile-geo-prompt-chip">
            <span className="geo-prompt-icon">📍</span>
            <span className="geo-prompt-text">現在地の近くを表示しますか？</span>
            <div className="geo-prompt-actions">
              <button
                type="button"
                className="geo-btn-accept"
                onClick={executeGeolocation}
              >
                表示
              </button>
              <button
                type="button"
                className="geo-btn-decline"
                onClick={() => {
                  try {
                    localStorage.setItem('dm_geo_choice', 'denied');
                  } catch {
                    // ignore
                  }
                  setShowLocationPrompt(false);
                }}
              >
                全国のまま
              </button>
            </div>
          </div>
        )}

        {/* ガイダンス（ドラッグ案内） */}
        {showGuide && (
          <div className="drag-guide-overlay game-guide-overlay">
            <span className="drag-hand-icon">🎮</span>
            <span>ドラッグしてマップをスクロール！</span>
          </div>
        )}

        {/* コントロールボタン */}
        <div className="dm-map-controls game-controls">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(z * 1.2, 3.5))}
            className="game-round-btn zoom-in"
            title="拡大"
            aria-label="地図を拡大"
          >
            ＋
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(z * 0.8, 0.8))}
            className="game-round-btn zoom-out"
            title="縮小"
            aria-label="地図を縮小"
          >
            ー
          </button>
          <button
            type="button"
            onClick={resetView}
            className="game-round-btn reset-btn"
            title="全国表示に戻す"
          >
            リセット
          </button>
          {currentLocationPref && (
            <button
              type="button"
              onClick={() => focusPrefecture(currentLocationPref)}
              className="game-round-btn loc-btn"
              title="現在地にジャンプ"
            >
              📍
            </button>
          )}
        </div>

        {/* 左上海エリア：枠内にきれいに収まる注目ルートカードデッキ（重なり解消・ハート白抜き改善） */}
        <div className="dm-sea-deck game-card-deck" aria-label="人気ドライブコース">
          <div className="game-deck-header-ribbon">
            <span className="game-ribbon-tag">POPULAR ROUTES</span>
            <span className="game-ribbon-title">注目の人気ドライブコース</span>
          </div>
          <div className="dm-sea-deck-cards">
            {displayCards.map((item, idx) => {
              const isCardHovered = hoveredPref === item.prefecture_code;
              const prefLabel = formatPrefectureShortName(item.prefecture_code, prefectureMap[item.prefecture_code] || '');
              return (
                <div
                  key={`${item.prefecture_code}-${idx}`}
                  className={`dm-sea-card game-event-card card-index-${idx} ${isCardHovered ? 'is-hovered' : ''}`}
                  onMouseEnter={() => {
                    setHoveredPref(item.prefecture_code);
                    if (item.image_url) {
                      setHoveredCardPhoto(item.image_url);
                    }
                  }}
                  onMouseLeave={() => {
                    setHoveredPref(null);
                    setHoveredCardPhoto(null);
                  }}
                  onClick={(e) => handleCardClick(e, item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCardClick(e as unknown as MouseEvent, item);
                  }}
                  title="クリックしてルート詳細を見る"
                >
                  <div className="game-card-badge-top">CARD 0{idx + 1}</div>
                  <div className="dm-sea-card-photo-wrap game-card-photo-wrap">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="dm-sea-card-img"
                        draggable="false"
                      />
                    ) : (
                      <div className="dm-sea-card-placeholder">DRIVE PHOTO</div>
                    )}
                    <div className="dm-sea-card-overlay">
                      <span className="game-card-tag-pill">
                        📍 {prefLabel || 'おすすめ'}
                      </span>
                      <span className="game-card-likes-badge">
                        <span className="likes-heart-icon">♥</span> {item.like_count} pt
                      </span>
                    </div>
                  </div>
                  <div className="game-card-info">
                    <p className="game-card-title">{item.title}</p>
                    <div className="game-card-footer">
                      <span className="game-card-command">▶ ルート詳細を見る</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 投稿件数ヒートマップ凡例（投稿件数ON時に表示） */}
        {heatOn && (
          <div className="game-heat-legend" aria-label="投稿件数カラー凡例">
            <span className="legend-title">投稿件数:</span>
            <div className="legend-chips">
              <span className="legend-chip" style={{ backgroundColor: '#E2E8F0', color: '#0F172A' }}>0件</span>
              <span className="legend-chip" style={{ backgroundColor: '#6EE7B7', color: '#0F172A' }}>1-2</span>
              <span className="legend-chip" style={{ backgroundColor: '#34D399', color: '#0F172A' }}>3-5</span>
              <span className="legend-chip" style={{ backgroundColor: '#FACC15', color: '#0F172A' }}>6-10</span>
              <span className="legend-chip" style={{ backgroundColor: '#FB923C', color: '#FFFFFF' }}>11-20</span>
              <span className="legend-chip" style={{ backgroundColor: '#EF4444', color: '#FFFFFF' }}>21+</span>
            </div>
          </div>
        )}

        {/* 都道府県ホバー時の「No.1ルート詳細ミニポップアップ」（写真確実表示） */}
        {activeHoverRoute && (
          <div
            className="pref-hover-popover"
            style={{
              left: `${Math.min(Math.max(mousePos.x + 18, 20), (containerRef.current?.clientWidth || 900) - 275)}px`,
              top: `${Math.min(Math.max(mousePos.y - 65, 20), (containerRef.current?.clientHeight || 650) - 185)}px`,
            }}
            onClick={() => handlePrefClick(activeHoverRoute.prefecture_code)}
            role="button"
            tabIndex={0}
          >
            <div className="pref-hover-header">
              <span className="pref-hover-crown">👑</span>
              <span className="pref-hover-badge-title">
                {activeHoverRoute.prefecture_name} No.1 ルート
              </span>
              <span className="pref-hover-region">{activeHoverRoute.region_name}</span>
            </div>
            <div className="pref-hover-body">
              <div className="pref-hover-photo-wrap">
                <img
                  src={activeHoverRoute.image_url}
                  alt={activeHoverRoute.title}
                  className="pref-hover-img"
                />
              </div>
              <div className="pref-hover-text-wrap">
                <p className="pref-hover-route-title">{activeHoverRoute.title}</p>
                <div className="pref-hover-meta">
                  <span className="pref-hover-likes">
                    <span className="likes-heart-icon">♥</span> {activeHoverRoute.like_count} pt
                  </span>
                  <span className="pref-hover-count">投稿: {activeHoverRoute.count}件</span>
                </div>
              </div>
            </div>
            <div className="pref-hover-action">
              <span>▶ クリックして詳細を見る</span>
            </div>
          </div>
        )}

        {/* 地図本体ステージ（初期スケール拡大＆文字枠内中央配置） */}
        <div className={`dm-map-wrap ${heatOn ? 'heat-on' : ''}`}>
          <div
            className="dm-map-stage game-map-stage"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
              transition: isMouseDown ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* map.jpg（ref維持用） */}
            <img
              ref={imageRef}
              src="/map.jpg"
              alt=""
              style={{ display: 'none' }}
              aria-hidden="true"
            />

            {/* ボードゲームのマス目風 SVG日本地図 */}
            <svg
              className="game-svg-board"
              viewBox="0 0 894 894"
              width="894"
              height="894"
              aria-label="都道府県のマスを選択"
            >
              {areas.map(([code, name, coords], idx) => {
                const count = counts[code] || 0;
                const region = getRegionByCode(code);
                const isHovered = hoveredPref === code;
                const center = PREF_CENTERS[code];

                let fillColor: string;
                if (heatOn) {
                  fillColor = isHovered ? '#FEF08A' : heatColor(count);
                } else {
                  fillColor = isHovered ? '#FEF08A' : region.color;
                }

                const shortName = formatPrefectureShortName(code, name);
                const fontSize = getPrefectureFontSize(code, shortName);
                const pointsStr = coordsToPoints(coords);

                return (
                  <g
                    key={`${code}-${idx}`}
                    className={`game-pref-group ${isHovered ? 'is-hovered' : ''}`}
                    onClick={() => handlePrefClick(code)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') handlePrefClick(code);
                    }}
                    onMouseEnter={() => setHoveredPref(code)}
                    onMouseLeave={() => setHoveredPref(null)}
                    role="button"
                    tabIndex={0}
                    aria-label={`${name} (${count}件)`}
                  >
                    {/* 1. マスの立体的な厚み（3Dシャドウ層） */}
                    <polygon
                      points={pointsStr}
                      className="game-pref-shadow"
                      transform="translate(0, 5)"
                      fill="#0F172A"
                    />

                    {/* 2. マスの上面（ポップカラーのゲームコマ） */}
                    <polygon
                      points={pointsStr}
                      className="game-pref-top"
                      fill={fillColor}
                      stroke="#0F172A"
                      strokeWidth="2.5"
                      strokeLinejoin="round"
                    />

                    {/* 3. 都道府県名ラベル（「京都」「北海道」対応・マス内はみ出し防止自動サイズ＆中央配置） */}
                    {center && (
                      <text
                        x={center.x}
                        y={center.y}
                        fontSize={fontSize}
                        className="game-pref-label"
                        textAnchor="middle"
                        dominantBaseline="central"
                        pointerEvents="none"
                      >
                        {shortName}
                      </text>
                    )}

                    {/* 4. 投稿件数バッジ（ボードゲームのピン） */}
                    {center && count > 0 && (
                      <g
                        transform={`translate(${center.x + 9}, ${center.y - 10})`}
                        className="game-pref-badge"
                        pointerEvents="none"
                      >
                        <circle cx="0" cy="0" r="8" fill="#EF4444" stroke="#0F172A" strokeWidth="1.8" />
                        <text
                          x="0"
                          y="0.5"
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="#FFFFFF"
                          fontSize="8.5"
                          fontWeight="900"
                        >
                          {count > 99 ? '99+' : count}
                        </text>
                      </g>
                    )}

                    <title>{`${prefectureMap[code] || name}（${region.name}） / 投稿 ${count} 件`}</title>
                  </g>
                );
              })}

              {/* モバイル現在地ピン（マーカー＆波紋アニメーション） */}
              {currentLocationPref && PREF_CENTERS[currentLocationPref] && (
                <g
                  className="current-location-marker"
                  transform={`translate(${PREF_CENTERS[currentLocationPref].x}, ${PREF_CENTERS[currentLocationPref].y - 8})`}
                  pointerEvents="none"
                >
                  {/* アニメーション波紋リング */}
                  <circle cx="0" cy="0" r="12" className="loc-pulse-ring" />
                  <circle cx="0" cy="0" r="20" className="loc-pulse-ring-outer" />
                  {/* 立体的な現在地ピン */}
                  <path
                    d="M0 -22 C-9 -22 -15 -16 -15 -7 C-15 4 0 16 0 16 C0 16 15 4 15 -7 C15 -16 9 -22 0 -22 Z"
                    fill="#EF4444"
                    stroke="#0F172A"
                    strokeWidth="2.5"
                  />
                  <circle cx="0" cy="-8" r="5" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.8" />
                  {/* 「現在地」吹き出し */}
                  <g transform="translate(0, -32)">
                    <rect x="-28" y="-11" width="56" height="18" rx="9" fill="#0F172A" stroke="#FFFFFF" strokeWidth="1.5" />
                    <text x="0" y="0" textAnchor="middle" dominantBaseline="central" fill="#FFFFFF" fontSize="9" fontWeight="900">
                      📍現在地
                    </text>
                  </g>
                </g>
              )}
            </svg>
          </div>
        </div>
      </div>

      {/* スマートフォン専用：手札カードスワイプ風一覧 */}
      <div className="dm-mobile-cards-wrap game-mobile-cards-wrap">
        <div className="dm-mobile-cards-header">
          <span className="dm-mobile-cards-title">🎴 おすすめイベントカード</span>
          <span className="dm-mobile-cards-sub">タップして詳細を見る</span>
        </div>
        <div className="dm-mobile-cards-scroll">
          {displayCards.map((item, idx) => {
            const prefLabel = formatPrefectureShortName(item.prefecture_code, prefectureMap[item.prefecture_code] || '');
            return (
              <div
                key={`mobile-${item.prefecture_code}-${idx}`}
                className="dm-mobile-card game-mobile-card"
                onClick={(e) => handleCardClick(e, item)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCardClick(e as unknown as MouseEvent, item);
                }}
              >
                <div className="dm-mobile-card-thumb-wrap">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="dm-mobile-card-img"
                      draggable="false"
                    />
                  ) : (
                    <div className="dm-mobile-card-placeholder">NO IMAGE</div>
                  )}
                  <span className="game-mobile-card-tag">
                    📍 {prefLabel || 'スポット'}
                  </span>
                  <span className="game-mobile-card-likes">
                    <span className="likes-heart-icon">♥</span> {item.like_count} pt
                  </span>
                </div>
                <div className="dm-mobile-card-body">
                  <p className="dm-mobile-card-title">{item.title}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
