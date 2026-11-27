import type { ZoomArt } from './quiz';
import { svg } from './zoomArt';

/**
 * 줌인 퀴즈 — 브랜드·앱 로고 "스타일" 그림 19종 (도형만으로 단순화한 퀴즈용 일러스트, 100x100)
 * fx/fy = 처음(400%) 보여줄 구역의 중심(%)
 */

const nike = svg(
  `<path d="M10,52 C14,44 22,42 30,48 C42,57 60,52 92,32 C66,66 40,80 22,70 C14,66 10,58 10,52 Z" fill="#111"/>`,
  '#ffffff',
);

const mcdonalds = svg(
  `<path d="M19,80 V47 C19,18 45,18 50,46 C55,18 81,18 81,47 V80" fill="none" stroke="#FFC72C" stroke-width="13" stroke-linejoin="round"/>`,
  '#DA291C',
);

const starbucks = svg(
  `<circle cx="50" cy="50" r="44" fill="#00704A"/>
   <circle cx="50" cy="50" r="38" fill="none" stroke="#fff" stroke-width="2"/>
   <circle cx="50" cy="50" r="28" fill="#fff"/>
   <polygon points="38,34 42,26 46,32 50,24 54,32 58,26 62,34" fill="#00704A"/>
   <circle cx="50" cy="44" r="9" fill="#00704A"/>
   <path d="M41,46 C34,52 32,62 38,70 M59,46 C66,52 68,62 62,70" fill="none" stroke="#00704A" stroke-width="5" stroke-linecap="round"/>
   <path d="M42,58 C46,64 54,64 58,58 L56,72 C52,76 48,76 44,72 Z" fill="#00704A"/>
   <circle cx="50" cy="44" r="3.2" fill="#fff"/>`,
  '#ffffff',
);

const apple = svg(
  `<path d="M50,31 C40,22 22,29 22,51 C22,70 34,87 44,87 C48,87 49,85 52,85 C55,85 57,87 61,87 C72,87 82,70 82,53 C82,37 70,27 60,31 C56,33 54,33 50,31 Z" fill="#111"/>
   <circle cx="85" cy="48" r="11" fill="#ffffff"/>
   <path d="M52,27 C49,16 56,9 66,9 C68,19 61,27 52,27 Z" fill="#111"/>`,
  '#ffffff',
);

const samsung = svg(
  `<ellipse cx="50" cy="50" rx="45" ry="21" fill="#1428A0"/>
   <text x="50" y="57" font-family="Arial, Helvetica, sans-serif" font-size="17" font-weight="900" fill="#fff" text-anchor="middle" textLength="70" lengthAdjust="spacingAndGlyphs">SAMSUNG</text>`,
  '#ffffff',
);

const gArc = (a: [number, number], b: [number, number], color: string) =>
  `<path d="M${a[0]},${a[1]} A28,28 0 0 1 ${b[0]},${b[1]}" fill="none" stroke="${color}" stroke-width="13"/>`;
const google = svg(
  `${gArc([23.7, 40.4], [69.8, 30.2], '#EA4335')}${gArc([32, 71.4], [23.7, 40.4], '#FBBC05')}${gArc([69.8, 69.8], [32, 71.4], '#34A853')}${gArc([78, 50], [69.8, 69.8], '#4285F4')}
   <rect x="50" y="43.5" width="31" height="13" fill="#4285F4"/>`,
  '#ffffff',
);

const instagram = svg(
  `<defs><linearGradient id="ig" x1="0" y1="1" x2="1" y2="0">
     <stop offset="0" stop-color="#FED373"/><stop offset=".25" stop-color="#F15245"/><stop offset=".55" stop-color="#D92E7F"/><stop offset=".8" stop-color="#9B36B7"/><stop offset="1" stop-color="#515ECF"/>
   </linearGradient></defs>
   <rect x="10" y="10" width="80" height="80" rx="24" fill="url(#ig)"/>
   <rect x="26" y="26" width="48" height="48" rx="16" fill="none" stroke="#fff" stroke-width="5"/>
   <circle cx="50" cy="50" r="11" fill="none" stroke="#fff" stroke-width="5"/>
   <circle cx="65" cy="35" r="3.2" fill="#fff"/>`,
  '#f4f1ea',
);

const xLogo = svg(
  `<rect x="10" y="10" width="80" height="80" rx="18" fill="#000"/>
   <path d="M29,28 L71,72" stroke="#fff" stroke-width="9" stroke-linecap="round"/>
   <path d="M71,28 L29,72" stroke="#fff" stroke-width="4.5" stroke-linecap="round"/>`,
  '#f4f1ea',
);

const netflix = svg(
  `<rect x="32" y="16" width="11" height="68" fill="#B20710"/><rect x="57" y="16" width="11" height="68" fill="#B20710"/>
   <polygon points="32,16 43,16 68,84 57,84" fill="#E50914"/>`,
  '#141414',
);

const cocacola = svg(
  `<path d="M0,66 C18,58 36,76 56,68 S88,60 100,66 V74 C88,68 70,80 54,76 S16,66 0,74 Z" fill="#fff"/>
   <text x="50" y="52" font-family="'Segoe Script','Brush Script MT','Lucida Handwriting',cursive" font-size="25" font-style="italic" font-weight="700" fill="#fff" text-anchor="middle">Coca-Cola</text>`,
  '#F40009',
);

const seven = svg(
  `<defs><clipPath id="sv"><polygon points="20,16 80,16 80,30 47,86 31,86 61,30 20,30"/></clipPath></defs>
   <g clip-path="url(#sv)"><rect x="0" y="0" width="100" height="36" fill="#F58220"/><rect x="0" y="36" width="100" height="26" fill="#00833E"/><rect x="0" y="62" width="100" height="40" fill="#EE1C25"/></g>`,
  '#ffffff',
);

const cu = svg(
  `<defs><linearGradient id="cug" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7B2D8E"/><stop offset="1" stop-color="#00A651"/></linearGradient></defs>
   <rect x="8" y="27" width="84" height="46" rx="14" fill="url(#cug)"/>
   <text x="50" y="62" font-family="Arial, Helvetica, sans-serif" font-size="36" font-weight="900" fill="#fff" text-anchor="middle">CU</text>`,
  '#f4f1ea',
);

const microsoft = svg(
  `<rect x="21" y="21" width="27" height="27" fill="#F25022"/><rect x="52" y="21" width="27" height="27" fill="#7FBA00"/>
   <rect x="21" y="52" width="27" height="27" fill="#00A4EF"/><rect x="52" y="52" width="27" height="27" fill="#FFB900"/>`,
  '#ffffff',
);

const pokeball = svg(
  `<circle cx="50" cy="50" r="40" fill="#fff"/>
   <path d="M10,50 A40,40 0 0 1 90,50 Z" fill="#E53935"/>
   <circle cx="50" cy="50" r="40" fill="none" stroke="#222" stroke-width="5"/>
   <path d="M10,50 H90" stroke="#222" stroke-width="6"/>
   <circle cx="50" cy="50" r="12" fill="#fff" stroke="#222" stroke-width="5"/><circle cx="50" cy="50" r="5" fill="#ddd"/>`,
  '#e3edf6',
);

const spotify = svg(
  `<circle cx="50" cy="50" r="42" fill="#1DB954"/>
   <path d="M27,38 Q50,30 75,41" fill="none" stroke="#191414" stroke-width="7.5" stroke-linecap="round"/>
   <path d="M30,52 Q50,46 70,55" fill="none" stroke="#191414" stroke-width="6" stroke-linecap="round"/>
   <path d="M34,65 Q50,60 66,67" fill="none" stroke="#191414" stroke-width="4.8" stroke-linecap="round"/>`,
  '#191414',
);

const stripe = (k: number) => {
  const x0 = 16 + k * 22;
  const h = [22, 38, 54][k];
  const dx = Math.round(h * 0.38);
  return `<polygon points="${x0},74 ${x0 + 12},74 ${x0 + dx + 12},${74 - h} ${x0 + dx},${74 - h}" fill="#111"/>`;
};
const adidas = svg(`${stripe(0)}${stripe(1)}${stripe(2)}<rect x="12" y="78" width="80" height="4" fill="#111"/>`, '#ffffff');

const bmw = svg(
  `<circle cx="50" cy="50" r="42" fill="#111"/><circle cx="50" cy="50" r="33" fill="#fff"/>
   <path d="M50,50 L50,17 A33,33 0 0 0 17,50 Z" fill="#1C69D4"/><path d="M50,50 L50,83 A33,33 0 0 0 83,50 Z" fill="#1C69D4"/>
   <circle cx="50" cy="50" r="33" fill="none" stroke="#111" stroke-width="1.5"/><path d="M50,17 V83 M17,50 H83" stroke="#111" stroke-width="1.5"/>
   <circle cx="50" cy="50" r="40" fill="none" stroke="#bfbfbf" stroke-width="1.2"/>`,
  '#ffffff',
);

const benz = svg(
  `<circle cx="50" cy="50" r="40" fill="none" stroke="#4a4a4a" stroke-width="4.5"/>
   <polygon points="46.5,50 53.5,50 50.8,13 49.2,13" fill="#4a4a4a"/>
   <polygon points="49,53 52.5,47 83,68 80.5,71.5" fill="#4a4a4a"/>
   <polygon points="51,53 47.5,47 17,68 19.5,71.5" fill="#4a4a4a"/>`,
  '#ffffff',
);

const ikea = svg(
  `<rect x="5" y="24" width="90" height="52" rx="4" fill="#0058A3"/><ellipse cx="50" cy="50" rx="41" ry="21" fill="#FFDA1A"/>
   <text x="50" y="59" font-family="Arial, Helvetica, sans-serif" font-size="27" font-weight="900" fill="#0058A3" text-anchor="middle" textLength="56" lengthAdjust="spacingAndGlyphs">IKEA</text>`,
  '#f4f1ea',
);

export const LOGO_ART = {
  nike: { svg: nike, fx: 78, fy: 42 },
  mcdonalds: { svg: mcdonalds, fx: 50, fy: 40 },
  starbucks: { svg: starbucks, fx: 50, fy: 38 },
  apple: { svg: apple, fx: 80, fy: 48 },
  samsung: { svg: samsung, fx: 12, fy: 48 },
  google: { svg: google, fx: 30, fy: 60 },
  instagram: { svg: instagram, fx: 66, fy: 34 },
  xLogo: { svg: xLogo, fx: 50, fy: 50 },
  netflix: { svg: netflix, fx: 50, fy: 48 },
  cocacola: { svg: cocacola, fx: 76, fy: 70 },
  seven: { svg: seven, fx: 58, fy: 46 },
  cu: { svg: cu, fx: 36, fy: 56 },
  microsoft: { svg: microsoft, fx: 50, fy: 50 },
  pokeball: { svg: pokeball, fx: 50, fy: 50 },
  spotify: { svg: spotify, fx: 50, fy: 48 },
  adidas: { svg: adidas, fx: 62, fy: 40 },
  bmw: { svg: bmw, fx: 46, fy: 46 },
  benz: { svg: benz, fx: 50, fy: 46 },
  ikea: { svg: ikea, fx: 88, fy: 40 },
} satisfies Record<string, ZoomArt>;
