export default function BackgroundStamps() {
  return (
    <div className="bg-stamp-layer" aria-hidden="true">
      {/* 1. 左上：ポップなドライブカー */}
      <div className="bg-stamp bg-stamp-car">
        <svg viewBox="0 0 120 120" width="204" height="204">
          <g
            stroke="#0F172A"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              d="M20 70 L28 45 C31 37 38 33 47 33 L74 33 C82 33 88 37 92 45 L101 66 C106 68 109 72 109 77 L109 84 C109 87 106 89 103 89 L18 89 C14 89 12 86 12 82 L12 75 C12 72 15 70 20 70 Z"
              fill="#FACC15"
            />
            <path
              d="M36 44 L44 39 L74 39 L84 53 L31 53 Z"
              fill="#38BDF8"
            />
            <line x1="59" y1="39" x2="59" y2="53" />
            <circle cx="33" cy="89" r="13" fill="#0F172A" />
            <circle cx="33" cy="89" r="6" fill="#FFFFFF" />
            <circle cx="88" cy="89" r="13" fill="#0F172A" />
            <circle cx="88" cy="89" r="6" fill="#FFFFFF" />
            <rect x="96" y="68" width="10" height="7" rx="3.5" fill="#FFFFFF" />
            <rect x="14" y="69" width="8" height="6" rx="3" fill="#EF4444" />
          </g>
        </svg>
      </div>

      {/* 2. 右上：富士山＆太陽 */}
      <div className="bg-stamp bg-stamp-fuji">
        <svg viewBox="0 0 120 120" width="204" height="204">
          <g
            stroke="#0F172A"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="90" cy="30" r="14" fill="#EF4444" />
            <path
              d="M14 94 C29 76 41 55 47 36 C49 32 52 31 56 31 L66 31 C70 31 73 32 75 36 C81 55 93 76 108 94 Z"
              fill="#0284C7"
            />
            <path
              d="M47 36 C49 32 52 31 56 31 L66 31 C70 31 73 32 75 36 L79 49 L70 44 L61 52 L52 44 L43 50 Z"
              fill="#FFFFFF"
            />
            <path
              d="M10 94 L110 94"
              fill="none"
            />
          </g>
        </svg>
      </div>

      {/* 3. 左中：ツーリングバイク */}
      <div className="bg-stamp bg-stamp-bike">
        <svg viewBox="0 0 120 120" width="204" height="204">
          <g
            stroke="#0F172A"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="28" cy="84" r="16" fill="#0F172A" />
            <circle cx="28" cy="84" r="7" fill="#FFFFFF" />
            <circle cx="92" cy="84" r="16" fill="#0F172A" />
            <circle cx="92" cy="84" r="7" fill="#FFFFFF" />
            <path
              d="M28 84 L48 64 L76 62 L92 84"
              fill="none"
            />
            <path
              d="M36 58 L54 58 L62 48 L80 48 L86 58 L64 70 L40 70 Z"
              fill="#FB923C"
            />
            <path
              d="M72 36 L82 36 L88 52 L92 84"
              fill="none"
            />
            <circle cx="94" cy="49" r="7" fill="#FACC15" />
            <path
              d="M20 66 L38 66"
              fill="none"
            />
          </g>
        </svg>
      </div>

      {/* 4. 右中：日本の象徴 鳥居 */}
      <div className="bg-stamp bg-stamp-torii">
        <svg viewBox="0 0 120 120" width="204" height="204">
          <g
            stroke="#0F172A"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              d="M14 28 C40 34 80 34 106 28 L103 40 C78 44 42 44 17 40 Z"
              fill="#EF4444"
            />
            <rect x="24" y="48" width="72" height="10" rx="4" fill="#EF4444" />
            <rect x="33" y="40" width="11" height="58" rx="4" fill="#EF4444" />
            <rect x="76" y="40" width="11" height="58" rx="4" fill="#EF4444" />
            <rect x="55" y="40" width="10" height="14" rx="2" fill="#FACC15" />
            <rect x="29" y="92" width="19" height="8" rx="3" fill="#0F172A" />
            <rect x="72" y="92" width="19" height="8" rx="3" fill="#0F172A" />
          </g>
        </svg>
      </div>

      {/* 5. 左下：チェッカーフラッグ */}
      <div className="bg-stamp bg-stamp-flag">
        <svg viewBox="0 0 120 120" width="204" height="204">
          <g
            stroke="#0F172A"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="28" y1="22" x2="28" y2="104" />
            <circle cx="28" cy="20" r="5" fill="#FACC15" />
            <path
              d="M32 25 C48 18 66 32 82 26 C90 23 96 24 100 26 L96 68 C90 66 84 65 76 68 C60 74 44 60 32 66 Z"
              fill="#FFFFFF"
            />
            <path d="M32 26 L49 23 L49 38 L32 41 Z" fill="#0F172A" stroke="none" />
            <path d="M66 25 L82 26 L80 41 L64 40 Z" fill="#0F172A" stroke="none" />
            <path d="M49 38 L65 40 L63 55 L47 53 Z" fill="#0F172A" stroke="none" />
            <path d="M80 41 L97 39 L96 54 L79 56 Z" fill="#0F172A" stroke="none" />
            <path d="M32 53 L47 53 L47 65 L32 66 Z" fill="#0F172A" stroke="none" />
            <path d="M63 55 L79 56 L77 68 L61 68 Z" fill="#0F172A" stroke="none" />
            <path
              d="M32 25 C48 18 66 32 82 26 C90 23 96 24 100 26 L96 68 C90 66 84 65 76 68 C60 74 44 60 32 66 Z"
              fill="none"
            />
          </g>
        </svg>
      </div>

      {/* 6. 右下：ゴールの旗・ルートピン */}
      <div className="bg-stamp bg-stamp-goal">
        <svg viewBox="0 0 120 120" width="204" height="204">
          <g
            stroke="#0F172A"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <ellipse cx="60" cy="96" rx="34" ry="10" fill="#4ADE80" />
            <line x1="48" y1="22" x2="48" y2="95" />
            <circle cx="48" cy="20" r="5" fill="#FACC15" />
            <path
              d="M52 24 L98 39 C101 40 101 44 98 45 L52 60 Z"
              fill="#EF4444"
            />
            <circle cx="67" cy="42" r="5.5" fill="#FACC15" />
          </g>
        </svg>
      </div>
    </div>
  );
}
