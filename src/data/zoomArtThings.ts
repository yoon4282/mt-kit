import type { ZoomArt } from './quiz';
import { svg } from './zoomArt';

/** 줌인 퀴즈 — 음식·동물·사물·교통표지판 21종 (모두 직접 그린 SVG, 100x100) */

// ───────── 음식 · 동물 ─────────
const hamburger = svg(
  `<path d="M16,46 C16,18 84,18 84,46 Z" fill="#E3A24B"/>
   <g fill="#FFF3C9"><ellipse cx="36" cy="32" rx="3" ry="1.7" transform="rotate(-20 36 32)"/><ellipse cx="50" cy="26" rx="3" ry="1.7"/><ellipse cx="64" cy="32" rx="3" ry="1.7" transform="rotate(20 64 32)"/><ellipse cx="44" cy="38" rx="3" ry="1.7" transform="rotate(10 44 38)"/><ellipse cx="58" cy="38" rx="3" ry="1.7" transform="rotate(-10 58 38)"/></g>
   <path d="M12,48 q6,-6 12,0 q6,6 12,0 q6,-6 12,0 q6,6 12,0 q6,-6 12,0 q6,6 12,0 q6,-6 6,0 V54 H12 Z" fill="#6FBF3A"/>
   <rect x="16" y="54" width="68" height="8" rx="4" fill="#E53935"/>
   <path d="M14,62 H86 L80,70 L70,64 L58,72 L46,64 L34,72 L24,64 Z" fill="#FFC928"/>
   <rect x="14" y="62" width="72" height="10" rx="5" fill="#5B3425"/>
   <path d="M16,74 H84 V76 C84,86 16,86 16,76 Z" fill="#E3A24B"/>`,
  '#f6e7c8',
);

const sprinkle = (x: number, y: number, r: number, c: string) => `<rect x="${x - 3}" y="${y - 1}" width="6" height="2.2" rx="1" fill="${c}" transform="rotate(${r} ${x} ${y})"/>`;
const donut = svg(
  `<circle cx="50" cy="52" r="38" fill="#D9985B"/>
   <path d="M50,18 C70,16 86,32 84,52 C82,72 66,86 50,84 C32,86 16,70 16,52 C14,32 30,16 50,18 Z" fill="#F48FB1"/>
   <circle cx="50" cy="52" r="12" fill="#ffe3ec"/><circle cx="50" cy="52" r="12" fill="none" stroke="#D9985B" stroke-width="3"/>
   ${sprinkle(34, 36, 20, '#fff')}${sprinkle(62, 32, -30, '#FFEB3B')}${sprinkle(72, 52, 70, '#4FC3F7')}${sprinkle(64, 72, 10, '#fff')}
   ${sprinkle(38, 70, -40, '#FFEB3B')}${sprinkle(26, 54, 80, '#4FC3F7')}${sprinkle(48, 28, 0, '#7CB342')}${sprinkle(74, 66, 40, '#FFEB3B')}`,
  '#ffe9d6',
);

const iceCream = svg(
  `<polygon points="30,52 70,52 50,92" fill="#D9A441"/>
   <path d="M38,56 L56,84 M50,54 L62,76 M62,53 L44,84 M50,54 L38,76 M38,54 L58,88" stroke="#B9822B" stroke-width="1.6"/>
   <circle cx="50" cy="42" r="21" fill="#F8B4C8"/>
   <path d="M29,46 q4,10 8,2 q4,10 8,2 q4,10 8,2 q4,10 8,2 q4,8 8,0 V44 H29 Z" fill="#F8B4C8"/>
   <circle cx="50" cy="26" r="17" fill="#8B5A3C"/>
   <circle cx="50" cy="9" r="5.5" fill="#D32F2F"/><path d="M50,4 Q53,-2 58,0" stroke="#3e7d32" stroke-width="1.6" fill="none"/>`,
  '#e3f3fa',
);

const banana = svg(
  `<path d="M22,26 C20,70 54,90 84,68 C91,63 88,56 81,59 C58,72 38,60 36,24 C36,18 23,19 22,26 Z" fill="#FFD93B" stroke="#C9A20E" stroke-width="1.5"/>
   <path d="M30,30 C32,60 52,76 78,66" fill="none" stroke="#E6B800" stroke-width="2"/>
   <rect x="21" y="14" width="14" height="10" rx="3" fill="#6B4B1F"/><path d="M82,60 q8,-2 8,4 q-2,5 -8,3 Z" fill="#4a3412"/>`,
  '#cfe8ff',
);

const seedAt = (x: number, y: number) => `<ellipse cx="${x}" cy="${y}" rx="1.7" ry="2.4" fill="#FFE082"/>`;
const strawberry = svg(
  `<path d="M50,90 C20,72 14,42 29,35 C40,30 46,35 50,37 C54,35 60,30 71,35 C86,42 80,72 50,90 Z" fill="#E53935"/>
   ${[[34, 48], [46, 48], [58, 48], [68, 48], [30, 58], [40, 58], [52, 58], [64, 58], [72, 58], [36, 68], [46, 68], [58, 68], [68, 68], [42, 78], [52, 78], [60, 78], [50, 86]].map(([x, y]) => seedAt(x, y)).join('')}
   <polygon points="50,40 38,28 44,38 30,36 42,45 50,43 58,45 70,36 56,38 62,28" fill="#43A047"/>
   <rect x="48" y="18" width="4" height="16" rx="2" fill="#2E7D32"/>`,
  '#f9f1e0',
);

const penguin = svg(
  `<ellipse cx="25" cy="58" rx="7" ry="20" fill="#1c262b" transform="rotate(15 25 58)"/><ellipse cx="75" cy="58" rx="7" ry="20" fill="#1c262b" transform="rotate(-15 75 58)"/>
   <ellipse cx="50" cy="54" rx="27" ry="36" fill="#263238"/>
   <ellipse cx="50" cy="62" rx="18" ry="26" fill="#fff"/>
   <circle cx="41" cy="36" r="6" fill="#fff"/><circle cx="59" cy="36" r="6" fill="#fff"/><circle cx="42" cy="37" r="2.8" fill="#111"/><circle cx="58" cy="37" r="2.8" fill="#111"/>
   <polygon points="43,44 57,44 50,54" fill="#FF9800"/>
   <ellipse cx="39" cy="91" rx="10" ry="4.5" fill="#FF9800"/><ellipse cx="61" cy="91" rx="10" ry="4.5" fill="#FF9800"/>`,
  '#cfe9f7',
);

const panda = svg(
  `<circle cx="24" cy="26" r="12" fill="#111"/><circle cx="76" cy="26" r="12" fill="#111"/>
   <circle cx="50" cy="54" r="33" fill="#fff" stroke="#e5e5e5" stroke-width="1"/>
   <ellipse cx="36" cy="49" rx="8.5" ry="11.5" fill="#111" transform="rotate(25 36 49)"/><ellipse cx="64" cy="49" rx="8.5" ry="11.5" fill="#111" transform="rotate(-25 64 49)"/>
   <circle cx="37" cy="48" r="3.2" fill="#fff"/><circle cx="63" cy="48" r="3.2" fill="#fff"/><circle cx="37.6" cy="48.4" r="1.5" fill="#111"/><circle cx="62.4" cy="48.4" r="1.5" fill="#111"/>
   <ellipse cx="50" cy="61" rx="6" ry="4" fill="#111"/>
   <path d="M50,65 V69 M50,69 q-5,5 -10,1 M50,69 q5,5 10,1" fill="none" stroke="#111" stroke-width="2" stroke-linecap="round"/>`,
  '#dff3e3',
);

const rubberDuck = svg(
  `<path d="M0,78 q12,-6 25,0 t25,0 t25,0 t25,0 V100 H0 Z" fill="#64B5F6"/>
   <ellipse cx="46" cy="66" rx="34" ry="21" fill="#FFD400"/>
   <path d="M24,66 C32,80 54,80 66,64 C60,70 44,70 24,66 Z" fill="#F5B800" opacity=".7"/>
   <circle cx="64" cy="38" r="18" fill="#FFD400"/>
   <ellipse cx="82" cy="43" rx="11" ry="5.5" fill="#FF8F00"/>
   <circle cx="67" cy="33" r="2.8" fill="#111"/><circle cx="68" cy="32" r="0.9" fill="#fff"/>
   <path d="M26,58 C20,48 30,42 40,52" fill="#F5B800" stroke="#E0A200" stroke-width="1.3"/>
   <path d="M0,86 q12,-6 25,0 t25,0 t25,0 t25,0" fill="none" stroke="#90CAF9" stroke-width="2"/>`,
  '#bfe6ff',
);

// ───────── 사물 ─────────
const lightbulb = svg(
  `<g stroke="#FFE066" stroke-width="3" stroke-linecap="round"><path d="M50,6 V14 M20,20 L26,26 M80,20 L74,26 M10,46 H18 M82,46 H90"/></g>
   <circle cx="50" cy="44" r="26" fill="#FFE066"/><circle cx="50" cy="44" r="26" fill="none" stroke="#FFF3B0" stroke-width="3"/>
   <path d="M42,70 C42,58 36,54 38,44 M58,70 C58,58 64,54 62,44 M38,44 C44,34 56,54 62,44" fill="none" stroke="#C98A00" stroke-width="2.4" stroke-linecap="round"/>
   <rect x="40" y="68" width="20" height="6" rx="2" fill="#B0BEC5"/><rect x="41" y="75" width="18" height="5" rx="2" fill="#90A4AE"/><rect x="43" y="81" width="14" height="5" rx="2.5" fill="#607D8B"/>`,
  '#1c2340',
);

const key = svg(
  `<g transform="rotate(-35 50 50)" fill="#E0A81E" stroke="#B8860B" stroke-width="1.4">
     <circle cx="24" cy="50" r="15"/><circle cx="24" cy="50" r="6.5" fill="#f4efe2" stroke="#B8860B"/>
     <rect x="36" y="46" width="52" height="8" rx="2"/><rect x="68" y="54" width="7" height="12" rx="1.5"/><rect x="79" y="54" width="7" height="9" rx="1.5"/>
   </g>`,
  '#f4efe2',
);

const umbrella = svg(
  `<path d="M10,54 A40,40 0 0 1 90,54 Q80,63 70,54 Q60,63 50,54 Q40,63 30,54 Q20,63 10,54 Z" fill="#E53935"/>
   <path d="M50,14 L30,56 M50,14 L50,56 M50,14 L70,56" stroke="#B71C1C" stroke-width="1.6" fill="none"/>
   <path d="M50,14 C42,26 34,44 30,56 Q40,62 50,55 Q40,38 50,14 Z" fill="#fff" opacity=".28"/>
   <rect x="48.8" y="6" width="2.4" height="9" fill="#444"/>
   <path d="M50,55 V80 Q50,90 40,88" fill="none" stroke="#444" stroke-width="4.5" stroke-linecap="round"/>`,
  '#d9eefc',
);

const tick = (i: number) => `<line x1="50" y1="14" x2="50" y2="${i % 3 === 0 ? 22 : 18}" stroke="#222" stroke-width="${i % 3 === 0 ? 3 : 1.6}" transform="rotate(${i * 30} 50 50)"/>`;
const wallClock = svg(
  `<circle cx="50" cy="50" r="42" fill="#fff" stroke="#333" stroke-width="4.5"/>
   ${Array.from({ length: 12 }, (_, i) => tick(i)).join('')}
   <path d="M50,50 L35,41" stroke="#222" stroke-width="4.2" stroke-linecap="round"/><path d="M50,50 L74,36" stroke="#222" stroke-width="3" stroke-linecap="round"/>
   <path d="M50,56 L50,20" stroke="#E53935" stroke-width="1.4" stroke-linecap="round" transform="rotate(150 50 50)"/><circle cx="50" cy="50" r="3.4" fill="#E53935"/>`,
  '#f4f0e8',
);

const headphones = svg(
  `<path d="M20,60 V50 A30,30 0 0 1 80,50 V60" fill="none" stroke="#333" stroke-width="7" stroke-linecap="round"/>
   <rect x="12" y="52" width="18" height="32" rx="8" fill="#E53935"/><rect x="70" y="52" width="18" height="32" rx="8" fill="#E53935"/>
   <rect x="26" y="56" width="7" height="24" rx="3.5" fill="#3a3a3a"/><rect x="67" y="56" width="7" height="24" rx="3.5" fill="#3a3a3a"/>
   <rect x="15" y="58" width="4" height="12" rx="2" fill="#ff8a80" opacity=".7"/>`,
  '#e9e4f5',
);

const camera = svg(
  `<polygon points="34,22 66,22 71,33 29,33" fill="#263238"/>
   <rect x="10" y="30" width="80" height="52" rx="9" fill="#37474F"/><rect x="10" y="38" width="80" height="9" fill="#2b373d"/>
   <circle cx="50" cy="58" r="21" fill="#90A4AE"/><circle cx="50" cy="58" r="17" fill="#111"/><circle cx="50" cy="58" r="11" fill="#1E3A5F"/>
   <circle cx="45" cy="53" r="3.6" fill="#fff" opacity=".9"/><circle cx="55" cy="63" r="1.8" fill="#fff" opacity=".5"/>
   <rect x="72" y="35" width="10" height="6" rx="2" fill="#FFEB3B"/><circle cx="19" cy="40" r="2.6" fill="#E53935"/>`,
  '#e7eef4',
);

const trafficLight = svg(
  `<rect x="30" y="6" width="40" height="88" rx="12" fill="#263238"/>
   <circle cx="50" cy="26" r="10" fill="#4a1d1d"/><circle cx="50" cy="50" r="10" fill="#4a431d"/>
   <circle cx="50" cy="74" r="10" fill="#4CAF50"/><circle cx="50" cy="74" r="14" fill="#4CAF50" opacity=".25"/>
   <circle cx="46" cy="70" r="2.6" fill="#fff" opacity=".6"/>`,
  '#cfd8dc',
);

const scissors = svg(
  `<polygon points="50,50 22,8 30,6 56,44" fill="#CFD8DC" stroke="#78909C" stroke-width="1.6"/>
   <polygon points="50,50 78,8 70,6 44,44" fill="#B0BEC5" stroke="#78909C" stroke-width="1.6"/>
   <path d="M44,56 L28,70 M56,56 L72,70" stroke="#E53935" stroke-width="6" stroke-linecap="round"/>
   <circle cx="27" cy="77" r="11" fill="none" stroke="#E53935" stroke-width="7"/><circle cx="73" cy="77" r="11" fill="none" stroke="#E53935" stroke-width="7"/>
   <circle cx="50" cy="51" r="4" fill="#546E7A"/>`,
  '#fff2e0',
);

// ───────── 교통표지판 ─────────
const noEntry = svg(`<circle cx="50" cy="50" r="40" fill="#D32F2F"/><rect x="22" y="42" width="56" height="16" rx="3" fill="#fff"/>`, '#ffffff');

const speed50 = svg(
  `<circle cx="50" cy="50" r="38" fill="#fff" stroke="#D32F2F" stroke-width="10"/>
   <text x="50" y="64" font-family="Arial, Helvetica, sans-serif" font-size="40" font-weight="900" fill="#111" text-anchor="middle">50</text>`,
  '#ffffff',
);

const crosswalk = svg(
  `<rect x="10" y="10" width="80" height="80" rx="9" fill="#1565C0"/>
   <polygon points="50,20 80,76 20,76" fill="#fff"/><polygon points="50,28 71,70 29,70" fill="#1565C0"/>
   <circle cx="50" cy="40" r="4.3" fill="#fff"/><path d="M50,45 V57 M50,48 L43,54 M50,48 L57,52 M50,57 L44,66 M50,57 L56,66" stroke="#fff" stroke-width="3.2" stroke-linecap="round" fill="none"/>
   <g fill="#fff"><rect x="34" y="73" width="6" height="5"/><rect x="44" y="73" width="6" height="5"/><rect x="54" y="73" width="6" height="5"/><rect x="64" y="73" width="6" height="5"/></g>`,
  '#ffffff',
);

const parking = svg(
  `<rect x="10" y="10" width="80" height="80" rx="11" fill="#1565C0"/>
   <path d="M36,78 V22 H56 C70,22 75,32 75,40 C75,50 68,58 56,58 H47 V78 Z" fill="#fff"/><path d="M47,32 H55 C60,32 64,35 64,40 C64,45 60,48 55,48 H47 Z" fill="#1565C0"/>`,
  '#ffffff',
);

const stopSign = svg(
  `<polygon points="50,90 6,16 94,16" fill="#D32F2F" stroke="#D32F2F" stroke-width="4" stroke-linejoin="round"/>
   <polygon points="50,72 22,26 78,26" fill="#fff"/>
   <text x="50" y="52" font-family="'Malgun Gothic','Apple SD Gothic Neo',sans-serif" font-size="19" font-weight="900" fill="#D32F2F" text-anchor="middle">정지</text>`,
  '#ffffff',
);

export const THING_ART = {
  hamburger: { svg: hamburger, fx: 62, fy: 32 },
  donut: { svg: donut, fx: 66, fy: 38 },
  iceCream: { svg: iceCream, fx: 50, fy: 54 },
  banana: { svg: banana, fx: 52, fy: 72 },
  strawberry: { svg: strawberry, fx: 46, fy: 62 },
  penguin: { svg: penguin, fx: 50, fy: 46 },
  panda: { svg: panda, fx: 36, fy: 50 },
  rubberDuck: { svg: rubberDuck, fx: 68, fy: 38 },
  lightbulb: { svg: lightbulb, fx: 50, fy: 44 },
  key: { svg: key, fx: 78, fy: 40 },
  umbrella: { svg: umbrella, fx: 50, fy: 22 },
  wallClock: { svg: wallClock, fx: 62, fy: 40 },
  headphones: { svg: headphones, fx: 21, fy: 66 },
  camera: { svg: camera, fx: 46, fy: 54 },
  trafficLight: { svg: trafficLight, fx: 50, fy: 62 },
  scissors: { svg: scissors, fx: 36, fy: 70 },
  noEntry: { svg: noEntry, fx: 30, fy: 46 },
  speed50: { svg: speed50, fx: 44, fy: 46 },
  crosswalk: { svg: crosswalk, fx: 50, fy: 48 },
  parking: { svg: parking, fx: 60, fy: 40 },
  stopSign: { svg: stopSign, fx: 34, fy: 34 },
} satisfies Record<string, ZoomArt>;
