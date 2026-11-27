import type { ZoomArt } from './quiz';

/**
 * 줌인 퀴즈용 내장 SVG 그림 (외부 이미지 없음 → 링크 깨짐·저작권 걱정 없이 오프라인 동작)
 * 모두 100x100 좌표계. fx/fy 는 처음(400%) 보여줄 구역의 중심(%).
 * 브랜드 로고는 도형만으로 단순화한 학습·퀴즈용 그림입니다.
 */

export const svg = (inner: string, bg: string) =>
  `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" role="img"><rect width="100" height="100" fill="${bg}"/>${inner}</svg>`;

// ── 태극기 ──
function trigram(cx: number, cy: number, rot: number, pattern: (0 | 1)[]): string {
  // 1 = 이어진 막대, 0 = 끊어진 막대. 막대가 쌓이는 방향이 중심을 향하도록 회전
  const bars = pattern
    .map((solid, i) => {
      const y = (i - 1) * 5.2;
      return solid
        ? `<rect x="-8" y="${y - 1.3}" width="16" height="2.6" fill="#111"/>`
        : `<rect x="-8" y="${y - 1.3}" width="6.6" height="2.6" fill="#111"/><rect x="1.4" y="${y - 1.3}" width="6.6" height="2.6" fill="#111"/>`;
    })
    .join('');
  return `<g transform="translate(${cx} ${cy}) rotate(${rot})">${bars}</g>`;
}
const taegeukgi = svg(
  `<rect x="5" y="20" width="90" height="60" fill="#fff" stroke="#bbb" stroke-width=".6"/>
   <circle cx="50" cy="50" r="15" fill="#0047A0"/>
   <path d="M35,50 A15,15 0 0 1 65,50 A7.5,7.5 0 0 1 50,50 A7.5,7.5 0 0 0 35,50 Z" fill="#CD2E3A"/>
   ${trigram(23, 33, -57.5, [1, 1, 1])}${trigram(77, 33, 57.5, [0, 1, 0])}
   ${trigram(23, 67, 57.5, [1, 0, 1])}${trigram(77, 67, -57.5, [0, 0, 0])}`,
  '#e9edf2',
);

// ── 영국 국기 (유니언 잭) ──
const unionJack = svg(
  `<defs><clipPath id="uj"><rect x="5" y="20" width="90" height="60"/></clipPath></defs>
   <g clip-path="url(#uj)">
     <rect x="5" y="20" width="90" height="60" fill="#012169"/>
     <path d="M5,20 L95,80 M95,20 L5,80" stroke="#fff" stroke-width="12"/>
     <path d="M5,20 L95,80 M95,20 L5,80" stroke="#C8102E" stroke-width="4"/>
     <rect x="5" y="43" width="90" height="14" fill="#fff"/><rect x="43" y="20" width="14" height="60" fill="#fff"/>
     <rect x="5" y="46.5" width="90" height="7" fill="#C8102E"/><rect x="46.5" y="20" width="7" height="60" fill="#C8102E"/>
   </g>`,
  '#e9edf2',
);

// ── 올림픽 오륜기 ──
const rings = svg(
  `<g fill="none" stroke-width="3.4">
     <circle cx="29" cy="43" r="11" stroke="#0085C7"/><circle cx="50" cy="43" r="11" stroke="#111"/><circle cx="71" cy="43" r="11" stroke="#DF0024"/>
     <circle cx="39.5" cy="56" r="11" stroke="#F4C300"/><circle cx="60.5" cy="56" r="11" stroke="#009F3D"/>
   </g>`,
  '#ffffff',
);

// ── 유튜브 ──
const youtube = svg(
  `<rect x="8" y="24" width="84" height="52" rx="15" fill="#FF0000"/><path d="M41,38 L41,62 L63,50 Z" fill="#fff"/>`,
  '#ffffff',
);

// ── 카카오톡 ──
const kakaotalk = svg(
  `<rect x="8" y="8" width="84" height="84" rx="22" fill="#FEE500"/>
   <ellipse cx="50" cy="46" rx="32" ry="25" fill="#3C1E1E"/>
   <path d="M35,64 L30,82 L54,69 Z" fill="#3C1E1E"/>
   <text x="50" y="52" font-family="Arial, sans-serif" font-size="16" font-weight="900" fill="#FEE500" text-anchor="middle">TALK</text>`,
  '#f4f1ea',
);

// ── 네이버 ──
const naver = svg(
  `<rect x="8" y="8" width="84" height="84" rx="18" fill="#03C75A"/>
   <path d="M29,74 V26 H45 L57,48 V26 H71 V74 H55 L43,52 V74 Z" fill="#fff"/>`,
  '#f4f1ea',
);

// ── 피자 ──
const pepperoni = (x: number, y: number, r = 6) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="#C0392B"/><circle cx="${x - r * 0.3}" cy="${y - r * 0.25}" r="${r * 0.18}" fill="#8e2a20"/><circle cx="${x + r * 0.35}" cy="${y + r * 0.3}" r="${r * 0.15}" fill="#8e2a20"/>`;
const olive = (x: number, y: number) => `<circle cx="${x}" cy="${y}" r="3.2" fill="#2b2b2b"/><circle cx="${x}" cy="${y}" r="1.2" fill="#f6c453"/>`;
const pizza = svg(
  `<circle cx="50" cy="50" r="43" fill="#D9902F"/><circle cx="50" cy="50" r="37" fill="#F6C453"/>
   <g stroke="#E0A63A" stroke-width="1.2"><path d="M50,13 V87 M13,50 H87 M24,24 L76,76 M76,24 L24,76"/></g>
   ${pepperoni(35, 36)}${pepperoni(63, 33)}${pepperoni(70, 58)}${pepperoni(50, 67)}${pepperoni(31, 61)}${pepperoni(50, 48, 5)}
   ${olive(49, 26)}${olive(78, 44)}${olive(40, 78)}${olive(22, 47)}${olive(62, 48)}
   <path d="M44,56 q3,-5 6,0 q-3,3 -6,0 M70,40 q3,-5 6,0 q-3,3 -6,0" fill="#4caf50"/>`,
  '#f1e7d6',
);

// ── 고양이 ──
const cat = svg(
  `<polygon points="22,42 24,12 46,30" fill="#8d949a"/><polygon points="78,42 76,12 54,30" fill="#8d949a"/>
   <polygon points="28,36 29,19 41,30" fill="#f4a9b8"/><polygon points="72,36 71,19 59,30" fill="#f4a9b8"/>
   <ellipse cx="50" cy="56" rx="31" ry="27" fill="#9aa1a8"/>
   <path d="M44,32 v8 M50,30 v10 M56,32 v8" stroke="#6f767c" stroke-width="2.6" stroke-linecap="round"/>
   <ellipse cx="50" cy="66" rx="14" ry="10" fill="#e9eaec"/>
   <ellipse cx="37" cy="52" rx="8" ry="9" fill="#b6e04a" stroke="#333" stroke-width="1.2"/><ellipse cx="63" cy="52" rx="8" ry="9" fill="#b6e04a" stroke="#333" stroke-width="1.2"/>
   <ellipse cx="37" cy="52" rx="2.2" ry="7" fill="#111"/><ellipse cx="63" cy="52" rx="2.2" ry="7" fill="#111"/>
   <circle cx="39.5" cy="48" r="1.8" fill="#fff"/><circle cx="65.5" cy="48" r="1.8" fill="#fff"/>
   <polygon points="45.5,61 54.5,61 50,67" fill="#f08aa0"/>
   <path d="M50,67 v3 M50,70 q-5,5 -9,1 M50,70 q5,5 9,1" fill="none" stroke="#555" stroke-width="1.4" stroke-linecap="round"/>
   <g stroke="#fff" stroke-width="1" stroke-linecap="round"><path d="M33,66 L12,61 M33,70 L12,72 M67,66 L88,61 M67,70 L88,72"/></g>`,
  '#d8e9f6',
);

// ── 수박 ──
const half = (r: number) => `M${50 - r},40 A${r},${r} 0 0 0 ${50 + r},40 Z`;
const seed = (x: number, y: number, rot: number) => `<ellipse cx="${x}" cy="${y}" rx="1.7" ry="3.4" fill="#222" transform="rotate(${rot} ${x} ${y})"/>`;
const watermelon = svg(
  `<path d="${half(42)}" fill="#2E7D32"/>
   <path d="M20,60 Q28,70 38,76 M50,82 L50,70 M80,60 Q72,70 62,76" stroke="#1B5E20" stroke-width="2" fill="none" stroke-linecap="round"/>
   <path d="${half(37)}" fill="#E8F5E0"/><path d="${half(33)}" fill="#E53935"/>
   <path d="M17,40 H83" stroke="#fff" stroke-width="1.2" opacity=".5"/>
   ${seed(36, 52, -20)}${seed(50, 60, 0)}${seed(64, 52, 20)}${seed(43, 68, -10)}${seed(58, 68, 10)}${seed(50, 48, 0)}${seed(30, 45, -35)}${seed(70, 45, 35)}`,
  '#fff4d6',
);

// ── 무당벌레 ──
const ladybug = svg(
  `<path d="M50,18 L50,10 M44,20 Q36,10 28,12 M56,20 Q64,10 72,12" stroke="#222" stroke-width="2" fill="none" stroke-linecap="round"/>
   <circle cx="50" cy="58" r="32" fill="#D32F2F"/>
   <path d="M50,28 V90" stroke="#222" stroke-width="2.4"/>
   <path d="M20,40 A32,32 0 0 1 80,40 Q50,30 20,40 Z" fill="#B71C1C" opacity=".35"/>
   <circle cx="50" cy="28" r="15" fill="#1b1b1b"/><circle cx="43" cy="26" r="3.6" fill="#fff"/><circle cx="57" cy="26" r="3.6" fill="#fff"/>
   <circle cx="43.8" cy="26.6" r="1.4" fill="#111"/><circle cx="56.2" cy="26.6" r="1.4" fill="#111"/>
   <g fill="#1b1b1b"><circle cx="33" cy="52" r="5.6"/><circle cx="67" cy="52" r="5.6"/><circle cx="28" cy="70" r="4.8"/><circle cx="72" cy="70" r="4.8"/><circle cx="40" cy="80" r="4"/><circle cx="60" cy="80" r="4"/><circle cx="40" cy="38" r="3.4"/><circle cx="60" cy="38" r="3.4"/></g>
   <path d="M24,76 L12,82 M76,76 L88,82 M22,56 L10,56 M78,56 L90,56" stroke="#222" stroke-width="2" stroke-linecap="round"/>`,
  '#bfe3a4',
);

export const ART = {
  taegeukgi: { svg: taegeukgi, fx: 47, fy: 46 },
  unionJack: { svg: unionJack, fx: 28, fy: 36 },
  rings: { svg: rings, fx: 50, fy: 50 },
  youtube: { svg: youtube, fx: 62, fy: 42 },
  kakaotalk: { svg: kakaotalk, fx: 36, fy: 66 },
  naver: { svg: naver, fx: 44, fy: 40 },
  pizza: { svg: pizza, fx: 58, fy: 38 },
  cat: { svg: cat, fx: 38, fy: 52 },
  watermelon: { svg: watermelon, fx: 50, fy: 60 },
  ladybug: { svg: ladybug, fx: 40, fy: 46 },
} satisfies Record<string, ZoomArt>;

/** 사진 전용 문제(직접 그린 그림이 없는 문제)의 사진 로딩 실패 대체 그림 */
export const PLACEHOLDER_ART: ZoomArt = {
  svg: svg(
    `<circle cx="50" cy="40" r="22" fill="#d9d4f2"/><text x="50" y="50" font-family="Arial, sans-serif" font-size="30" font-weight="900" fill="#6b5fb5" text-anchor="middle">?</text>
     <text x="50" y="76" font-family="'Malgun Gothic','Apple SD Gothic Neo',sans-serif" font-size="7.5" font-weight="700" fill="#5b5780" text-anchor="middle">사진을 불러오지 못했어요</text>
     <text x="50" y="87" font-family="'Malgun Gothic','Apple SD Gothic Neo',sans-serif" font-size="6" fill="#7b7aa0" text-anchor="middle">MC 정답지를 보고 진행하세요</text>`,
    '#eeecf9',
  ),
  fx: 50,
  fy: 50,
};
