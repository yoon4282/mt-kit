import { TEAM_IDS, type GameState, type TeamId } from '../types';
import type { GameAction } from './reducer';
import { uid } from '../lib/ids';

/**
 * 시연용 가짜 참가자 봇.
 * 네트워크를 거치지 않고, 실제 참가자 메시지와 "같은 액션"(PLAYER_JOIN / BUZZ)을
 * 호스트 리듀서에 직접 넣는다 → 점수·순위·버저 로직을 폰 없이 그대로 검증 가능.
 */

const BOT_NAMES = [
  '졸린판다', '배고픈곰', '신난토끼', '용감한햄찌', '수줍은여우', '춤추는펭귄', '엉뚱한고양이',
  '느긋한거북', '빠른치타', '똑똑한부엉이', '웃는돌고래', '씩씩한사자', '말랑젤리', '바삭치킨',
  '초코송이', '딸기우유', '매운떡볶이', '반짝별', '구름빵', '꿀벌이', '호기심냥', '멍뭉이',
  '새벽감성', '과잠요정', '막내라인', '총무님', '학회장', 'MT요정', '노래방왕', '밤샘러',
];

export const isBotId = (id: string) => id.startsWith('bot-');

export function makeBots(state: GameState, count: number): GameAction[] {
  const used = new Set(Object.values(state.players).map((p) => p.name));
  const pool = BOT_NAMES.filter((n) => !used.has(n)).sort(() => Math.random() - 0.5);
  const now = Date.now();
  const actions: GameAction[] = [];
  const botCount = Object.values(state.players).filter((p) => p.isBot).length;
  for (let i = 0; i < count; i++) {
    const name = pool[i] ?? `봇${botCount + i + 1}`;
    // 팀은 순서대로 고르게 배정
    const team = TEAM_IDS[(botCount + i) % TEAM_IDS.length] as TeamId;
    actions.push({ type: 'PLAYER_JOIN', id: `bot-${uid()}`, name, team, isBot: true, at: now + i });
  }
  return actions;
}

export interface BotSettings {
  /** 버저가 열렸을 때 누를 확률 (0~1) */
  buzzChance: number;
  minDelayMs: number;
  maxDelayMs: number;
}

export const DEFAULT_BOT_SETTINGS: BotSettings = { buzzChance: 0.75, minDelayMs: 400, maxDelayMs: 3000 };

/**
 * O/X·4지선다 문제가 시작되면 봇들이 랜덤 시점에 답 제출.
 * 호스트 내부 봇이라 정답을 알고 있으므로 correctChance 확률로 정답, 나머지는 오답.
 */
export function scheduleBotAnswers(
  state: GameState,
  correct: string,
  options: string[],
  dispatch: (a: GameAction) => void,
  correctChance = 0.6,
  /** 이 시간 안에 제출 (제한 시간보다 짧게) */
  maxDelayMs = 5800,
): () => void {
  const timers: number[] = [];
  const wrong = options.filter((o) => o !== correct);
  for (const p of Object.values(state.players)) {
    if (!p.isBot) continue;
    const value = Math.random() < correctChance || !wrong.length ? correct : wrong[Math.floor(Math.random() * wrong.length)];
    const delay = 500 + Math.random() * Math.max(500, maxDelayMs - 500);
    timers.push(window.setTimeout(() => dispatch({ type: 'SUBMIT', playerId: p.id, value, at: Date.now() }), delay));
  }
  return () => timers.forEach((t) => window.clearTimeout(t));
}

/**
 * 버저가 열리면 각 봇이 랜덤 시점에 버저를 누르도록 예약.
 * 반환값: 예약 취소 함수 (버저가 닫히거나 화면이 사라질 때 호출)
 */
export function scheduleBotBuzzes(
  state: GameState,
  dispatch: (a: GameAction) => void,
  settings: BotSettings = DEFAULT_BOT_SETTINGS,
): () => void {
  const timers: number[] = [];
  for (const p of Object.values(state.players)) {
    if (!p.isBot || Math.random() > settings.buzzChance) continue;
    const delay = settings.minDelayMs + Math.random() * (settings.maxDelayMs - settings.minDelayMs);
    timers.push(window.setTimeout(() => dispatch({ type: 'BUZZ', playerId: p.id, at: Date.now() }), delay));
  }
  return () => timers.forEach((t) => window.clearTimeout(t));
}
