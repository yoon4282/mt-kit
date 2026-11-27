// Web Audio API 로 합성한 효과음/멜로디 (외부 오디오 파일 없음)
let ctx = null;

export function getCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

// 브라우저 자동재생 정책 때문에 사용자 클릭 후 호출해야 한다.
export async function unlockAudio() {
  const c = getCtx();
  if (!c) return false;
  if (c.state !== 'running') await c.resume();
  tone(440, 0, 0.02, 'sine', 0.001); // 무음에 가까운 핑으로 활성화
  return c.state === 'running';
}
export const audioReady = () => !!ctx && ctx.state === 'running';

function tone(freq, start, dur, type = 'sine', vol = 0.25, endFreq) {
  const c = getCtx();
  if (!c) return;
  const t0 = c.currentTime + start;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noiseBurst(start, dur, vol = 0.2, hp = 200) {
  const c = getCtx();
  if (!c) return;
  const t0 = c.currentTime + start;
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = 'highpass';
  f.frequency.value = hp;
  const g = c.createGain();
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f).connect(g).connect(c.destination);
  src.start(t0);
}

// 딩동댕~ (정답)
const correct = () => {
  tone(659.25, 0, 0.35, 'triangle', 0.3);
  tone(523.25, 0.3, 0.35, 'triangle', 0.3);
  tone(783.99, 0.6, 0.7, 'triangle', 0.32);
  tone(1567.98, 0.6, 0.7, 'sine', 0.08);
};
// 땡! (오답)
const wrong = () => {
  tone(196, 0, 0.55, 'sawtooth', 0.22);
  tone(185, 0, 0.55, 'square', 0.1);
};
// 두구두구두구~ (긴장)
const drum = () => {
  for (let i = 0; i < 28; i++) {
    const t = i * 0.095;
    noiseBurst(t, 0.07, 0.07 + i * 0.006, 80);
    tone(95 + (i % 2) * 8, t, 0.08, 'sine', 0.18 + i * 0.004);
  }
  tone(130, 2.7, 0.5, 'triangle', 0.3);
};
// 삐ㅡ 타임오버 부저
const timeover = () => {
  tone(440, 0, 0.9, 'square', 0.2);
  tone(442, 0, 0.9, 'sawtooth', 0.1);
};
const buzz = () => {
  tone(880, 0, 0.12, 'square', 0.18);
  tone(660, 0.1, 0.18, 'square', 0.16);
};
const join = () => tone(1046.5, 0, 0.12, 'sine', 0.12);
const ok = () => {
  tone(784, 0, 0.1, 'triangle', 0.22);
  tone(1046.5, 0.08, 0.14, 'triangle', 0.22);
};
const pass = () => tone(300, 0, 0.14, 'triangle', 0.18, 200);

const SFX = { correct, wrong, drum, timeover, buzz, join, ok, pass };
export const SOUNDBOARD = [
  { id: 'correct', label: '딩동댕', sub: '정답', emoji: '⭕' },
  { id: 'wrong', label: '땡', sub: '오답', emoji: '❌' },
  { id: 'drum', label: '두구두구', sub: '긴장', emoji: '🥁' },
  { id: 'timeover', label: '타임오버', sub: '부저', emoji: '⏰' },
];

export function playSfx(id) {
  if (!audioReady()) return;
  (SFX[id] || (() => {}))();
}

// ---- 오프라인 멜로디 ----
const SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
export function noteToFreq(name) {
  const m = /^([A-G])([#b]?)(\d)$/.exec(name);
  if (!m) return null;
  let semi = SEMI[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  const midi = 12 * (Number(m[3]) + 1) + semi;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// notes: [['D5',0.12], ...]  → 총 길이만큼 연주. 반환값은 총 길이(초)
export function playMelody(notes) {
  if (!audioReady()) return 0;
  let t = 0;
  for (const [n, d] of notes) {
    const f = noteToFreq(n);
    if (f) {
      tone(f, t, Math.max(0.06, d * 0.95), 'triangle', 0.3);
      tone(f * 2, t, Math.max(0.06, d * 0.8), 'sine', 0.06);
    }
    t += d;
  }
  return t;
}
