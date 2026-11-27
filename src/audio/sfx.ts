/**
 * 효과음 — 음원 파일 없이 Web Audio API 로 실시간 합성.
 * 브라우저 정책상 사용자가 한 번 클릭한 뒤(unlock) 소리가 납니다.
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;

function ac(): AudioContext | null {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
  }
  return ctx;
}

/** 클릭 이벤트 안에서 호출 */
export function unlockAudio() {
  const c = ac();
  if (c?.state === 'suspended') void c.resume();
}

export function setMuted(m: boolean) {
  muted = m;
}

type Wave = OscillatorType;

/** 기본 음 하나: 주파수, 시작 시각(초, 지금 기준), 길이, 파형, 볼륨, 주파수 변화(glide) */
function tone(freq: number, at: number, dur: number, wave: Wave = 'sine', vol = 0.6, glideTo?: number) {
  const c = ac();
  if (!c || !master || muted) return;
  const t0 = c.currentTime + at;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = wave;
  osc.frequency.setValueAtTime(freq, t0);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t0 + dur);
  // 짧은 어택 + 지수 감쇠 엔벨로프
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

/** 화이트 노이즈 (박수·쉭 소리) */
function noise(at: number, dur: number, vol = 0.3, highpass = 1000) {
  const c = ac();
  if (!c || !master || muted) return;
  const t0 = c.currentTime + at;
  const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = 'highpass';
  f.frequency.value = highpass;
  const g = c.createGain();
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f).connect(g).connect(master);
  src.start(t0);
}

const N: Record<string, number> = {
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.0, B5: 987.77, C6: 1046.5, E6: 1318.5, G6: 1568.0,
};

export const sfx = {
  /** 버저 1등 — "띵동!" */
  buzz() {
    tone(N.E5, 0, 0.18, 'square', 0.35);
    tone(N.C5, 0.14, 0.35, 'square', 0.35);
  },
  /** 다른 사람 버저 — 짧은 틱 */
  buzzMinor() {
    tone(N.A5, 0, 0.08, 'triangle', 0.25);
  },
  /** 정답 — 상승 아르페지오 */
  correct() {
    [N.C5, N.E5, N.G5, N.C6].forEach((f, i) => tone(f, i * 0.08, 0.35, 'triangle', 0.45));
  },
  /** 오답 — "삐-빅" */
  wrong() {
    tone(220, 0, 0.22, 'sawtooth', 0.25, 180);
    tone(165, 0.22, 0.4, 'sawtooth', 0.25, 120);
  },
  /** 문제 시작 — 쉭 + 상승음 */
  start() {
    noise(0, 0.25, 0.15, 3000);
    tone(N.G4, 0, 0.3, 'sine', 0.4, N.G5);
  },
  /** 남은 5초 째깍 */
  tick(last = false) {
    tone(last ? 1320 : 1000, 0, 0.06, 'square', 0.18);
  },
  /** 시간 종료 — 긴 부저 */
  timeUp() {
    tone(330, 0, 0.6, 'square', 0.3);
    tone(262, 0, 0.6, 'square', 0.2);
  },
  /** 점수 획득 — 코인 */
  coin() {
    tone(N.B5, 0, 0.08, 'square', 0.25);
    tone(N.E6, 0.08, 0.3, 'square', 0.25);
  },
  /** 감점 */
  minus() {
    tone(N.E4, 0, 0.15, 'triangle', 0.35);
    tone(N.C4, 0.12, 0.3, 'triangle', 0.35);
  },
  /** 참가자 입장 — 뽁 */
  join() {
    tone(600, 0, 0.12, 'sine', 0.3, 1200);
  },
  /** 순위 발표 — 드럼롤 + 팡파르 + 박수 */
  fanfare() {
    for (let i = 0; i < 16; i++) noise(i * 0.06, 0.05, 0.12, 400);
    const t = 1.0;
    const notes: [number, number, number][] = [
      [N.G4, 0, 0.15], [N.C5, 0.15, 0.15], [N.E5, 0.3, 0.15], [N.G5, 0.45, 0.35],
      [N.E5, 0.8, 0.15], [N.G5, 0.95, 0.8],
    ];
    for (const [f, at, d] of notes) {
      tone(f, t + at, d + 0.1, 'sawtooth', 0.18);
      tone(f * 2, t + at, d + 0.1, 'triangle', 0.12);
    }
    tone(N.C4, t + 0.95, 0.9, 'triangle', 0.3);
    for (let i = 0; i < 30; i++) noise(t + 1.2 + Math.random() * 1.6, 0.04, 0.08, 1500);
  },
};

export type SfxName = keyof typeof sfx;
