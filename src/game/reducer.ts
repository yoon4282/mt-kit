import { TEAM_IDS, type GameState, type Mode, type ScoreEvent, type SpeedResult, type TeamId, type TimerState } from '../types';
import type { QuizKind } from '../data/quiz';
import { findCategory, findQuestion, findType } from '../data/quizzes';
import { uid } from '../lib/ids';

// ───────────── 액션 ─────────────

/** MC(폰 또는 전광판 패널)가 보낼 수 있는 명령 */
export type McAction =
  // 점수
  | { type: 'SET_MODE'; mode: Mode }
  | { type: 'AWARD'; targetIds: string[]; points: number }
  | { type: 'UNDO' }
  | { type: 'RENAME_TEAM'; teamId: TeamId; name: string }
  | { type: 'RESET_SCORES'; mode: Mode }
  | { type: 'REMOVE_PLAYER'; id: string }
  | { type: 'SHOW_PODIUM'; on: boolean }
  // 버저
  | { type: 'BUZZER_OPEN' }
  | { type: 'BUZZER_LOCK' }
  | { type: 'BUZZER_RESET' }
  | { type: 'BUZZ_WRONG' }
  // 문제 진행
  | { type: 'PICK_CATEGORY'; kind: QuizKind; categoryId: string }
  | { type: 'LOAD_QUESTION'; questionId: string }
  | { type: 'NEXT_QUESTION' }
  /** 아직 안 낸 문제 중 무작위 출제. kind 만 주면 그 종류의 카테고리도 무작위, 생략하면 현재 카테고리 */
  | { type: 'RANDOM_QUESTION'; kind?: QuizKind; categoryId?: string }
  | { type: 'PREV_QUESTION' }
  | { type: 'START' }
  | { type: 'CLOSE' }
  | { type: 'REVEAL' }
  | { type: 'END_ROUND' }
  | { type: 'SET_SHUFFLE'; on: boolean }
  | { type: 'PLAY_CLIP'; sec: number | null }
  // 줌인 퀴즈: 1 = 400%, 2 = 200%, 3 = 전체(100%)
  | { type: 'ZOOM_SET'; level: 1 | 2 | 3 }
  | { type: 'ZOOM_WIDEN' }
  // 가사 TTS 낭독: rate 생략 시 직전 속도로 다시 읽기
  | { type: 'TTS_PLAY'; rate?: number }
  // 가사 TTS 힌트 단계 (줌인처럼 단계가 올라갈수록 권장 배점이 내려감)
  | { type: 'TTS_HINT_SET'; level: 1 | 2 | 3 }
  | { type: 'TTS_HINT_MORE' }
  // 타이머
  | { type: 'TIMER_SET'; sec: number }
  | { type: 'TIMER_RESUME' }
  | { type: 'TIMER_PAUSE' }
  | { type: 'TIMER_RESET' };

/** 호스트 내부에서만 발생하는 액션 (참가자 메시지·봇·접속 상태·타이머) */
export type SystemAction =
  /** id: 접속한 기기의 clientId, claimId: 이어받을 기존 참가자 ID (재입장) */
  | { type: 'PLAYER_JOIN'; id: string; name: string; team: TeamId; isBot?: boolean; at: number; claimId?: string }
  | { type: 'PLAYER_PRESENCE'; id: string; online: boolean }
  | { type: 'BUZZ'; playerId: string; at: number }
  | { type: 'SUBMIT'; playerId: string; value: string; at: number }
  | { type: 'TIMER_EXPIRE' }
  /** 전광판 음악 플레이어: seq 번째 재생이 끝남 */
  | { type: 'CLIP_ENDED'; seq: number }
  /** 전광판 가사 낭독기: seq 번째 낭독이 끝남 (또는 낭독 오류) */
  | { type: 'TTS_ENDED'; seq: number }
  | { type: 'LOAD'; state: GameState };

export type GameAction = McAction | SystemAction;

const MC_ACTION_TYPES = new Set<McAction['type']>([
  'SET_MODE', 'AWARD', 'UNDO', 'RENAME_TEAM', 'RESET_SCORES', 'REMOVE_PLAYER', 'SHOW_PODIUM',
  'BUZZER_OPEN', 'BUZZER_LOCK', 'BUZZER_RESET', 'BUZZ_WRONG',
  'PICK_CATEGORY', 'LOAD_QUESTION', 'NEXT_QUESTION', 'RANDOM_QUESTION', 'PREV_QUESTION', 'START', 'CLOSE', 'REVEAL', 'END_ROUND',
  'SET_SHUFFLE', 'PLAY_CLIP', 'ZOOM_SET', 'ZOOM_WIDEN', 'TTS_PLAY', 'TTS_HINT_SET', 'TTS_HINT_MORE', 'TIMER_SET', 'TIMER_RESUME', 'TIMER_PAUSE', 'TIMER_RESET',
]);

/** 네트워크로 받은 MC 명령 검증 (참가자용 액션이 섞여 들어오지 않도록) */
export function isMcAction(a: unknown): a is McAction {
  return !!a && typeof a === 'object' && MC_ACTION_TYPES.has((a as McAction).type);
}

// ───────────── 초기 상태 ─────────────

const DEFAULT_SEC = 20;

const makeTimer = (sec: number): TimerState => ({
  durationMs: sec * 1000,
  running: false,
  endsAt: null,
  remainingMs: sec * 1000,
});

export function createInitialState(): GameState {
  return {
    mode: 'individual',
    players: {},
    teams: TEAM_IDS.map((teamId) => ({ teamId, teamName: `${teamId}팀`, teamScore: 0 })),
    history: [],
    buzzer: { open: false, order: [], out: [], round: 0 },
    round: {
      kind: null, categoryId: null, questionId: null, phase: 'ready',
      asked: [], used: [], shuffle: false, answers: {}, clip: { seq: 0, sec: null },
      zoom: 1, tts: { seq: 0, rate: 1 }, ttsHint: 1,
      startedAt: null, scored: [],
    },
    timer: makeTimer(DEFAULT_SEC),
    podium: false,
    aliases: {},
  };
}

const MAX_HISTORY = 300;
const clampPoints = (n: number) => Math.max(-9999, Math.min(9999, Math.round(n)));

/** 남은 시간 (호스트 시계 기준) */
export function remainingMs(t: TimerState, now = Date.now()): number {
  return t.running && t.endsAt ? Math.max(0, t.endsAt - now) : t.remainingMs;
}

const pauseTimer = (t: TimerState): TimerState =>
  t.running ? { ...t, running: false, endsAt: null, remainingMs: remainingMs(t) } : t;

const resumeTimer = (t: TimerState): TimerState => {
  const left = remainingMs(t);
  if (t.running || left <= 0) return t;
  return { ...t, running: true, endsAt: Date.now() + left, remainingMs: left };
};

/**
 * 점수 적용 — 개인전이면 personalScore 만, 팀전이면 teamScore 만 변경.
 * 두 점수를 연결하는 코드 경로는 의도적으로 존재하지 않는다.
 */
function applyScore(state: GameState, ev: ScoreEvent, sign: 1 | -1): GameState {
  const delta = (id: string) => (ev.perTarget?.[id] ?? ev.points) * sign;
  if (ev.mode === 'individual') {
    const players = { ...state.players };
    for (const id of ev.targetIds) {
      const p = players[id];
      if (p) players[id] = { ...p, personalScore: p.personalScore + delta(id) };
    }
    return { ...state, players };
  }
  const ids = new Set(ev.targetIds);
  return {
    ...state,
    teams: state.teams.map((t) =>
      ids.has(String(t.teamId)) ? { ...t, teamScore: t.teamScore + delta(String(t.teamId)) } : t,
    ),
  };
}

/** 4지선다 스피드 채점: 가장 빠른 정답자 30점, 그 뒤로 1점씩 감소 (최소 1점) */
export const SPEED_MAX_POINTS = 30;
/** 가사 낭독: [문제 공개 + 시작] 후 자동 낭독까지 대기 시간 */
export const TTS_AUTO_DELAY_MS = 1000;

/**
 * 정답자를 (마지막으로 고른) 시각 순으로 정렬해 점수 계산.
 *  - 개인전: 정답자 한 명 한 명에게 30, 29, 28 …
 *  - 팀전: 팀에서 가장 빨리 맞힌 사람 기준으로 팀 순위를 매겨 30, 29, 28, 27
 */
export function computeSpeedResult(state: GameState): SpeedResult | null {
  const q = findQuestion(state.round.questionId)?.question;
  if (!q || q.input !== 'choice') return null;
  const correct = String(q.answer);
  const order = Object.entries(state.round.answers)
    .filter(([id, a]) => a.value === correct && state.players[id])
    .sort((a, b) => a[1].at - b[1].at)
    .map(([playerId, a]) => ({ playerId, ms: state.round.startedAt ? Math.max(0, a.at - state.round.startedAt) : null }));
  const points: Record<string, number> = {};
  if (state.mode === 'individual') {
    order.forEach((o, i) => (points[o.playerId] = Math.max(1, SPEED_MAX_POINTS - i)));
  } else {
    const teams: string[] = [];
    for (const o of order) {
      const t = String(state.players[o.playerId].team);
      if (!teams.includes(t)) teams.push(t);
    }
    teams.forEach((t, i) => (points[t] = Math.max(1, SPEED_MAX_POINTS - i)));
  }
  return { mode: state.mode, order, points };
}

/** 정답 공개 시 4지선다 자동 채점 (문제당 한 번만, 되돌리기로 한꺼번에 취소 가능) */
function autoScoreChoice(state: GameState): GameState {
  const qid = state.round.questionId;
  if (!qid || state.round.scored.includes(qid)) return state;
  const result = computeSpeedResult(state);
  if (!result) return state;
  const marked = { ...state, round: { ...state.round, scored: [...state.round.scored, qid] } };
  const targetIds = Object.keys(result.points);
  if (!targetIds.length) return marked;
  const ev: ScoreEvent = {
    id: uid(), mode: state.mode, targetIds, points: SPEED_MAX_POINTS,
    perTarget: result.points, questionId: qid, at: Date.now(),
  };
  const next = applyScore(marked, ev, 1);
  return { ...next, history: [...state.history, ev].slice(-MAX_HISTORY) };
}

/** 문제 불러오기: ready 단계로 두고 입력·버저·타이머 초기화 */
function loadQuestion(state: GameState, questionId: string, pushHistory: boolean): GameState {
  const ref = findQuestion(questionId);
  if (!ref) return state;
  const sameCategory = state.round.kind === ref.type.kind && state.round.categoryId === ref.category.id;
  const asked = sameCategory ? state.round.asked : [];
  return {
    ...state,
    round: {
      ...state.round,
      kind: ref.type.kind,
      categoryId: ref.category.id,
      questionId,
      phase: 'ready',
      asked: pushHistory && !asked.includes(questionId) ? [...asked, questionId] : asked,
      used: state.round.used.includes(questionId) ? state.round.used : [...state.round.used, questionId],
      answers: {},
      startedAt: null,
      zoom: 1, // 줌인: 항상 400% 부터
      tts: { seq: state.round.tts?.seq ?? 0, rate: 1 },
      ttsHint: 1, // 가사 낭독: 항상 힌트 없이 시작
    },
    buzzer: { ...state.buzzer, open: false, order: [], out: [] },
    timer: makeTimer(ref.type.defaultSec),
  };
}

function validSubmit(state: GameState, value: string): boolean {
  const q = findQuestion(state.round.questionId)?.question;
  if (!q) return false;
  if (q.input === 'ox') return value === 'O' || value === 'X';
  if (q.input === 'choice') return /^[0-9]$/.test(value) && Number(value) < q.choices.length;
  return false;
}

// ───────────── 리듀서 ─────────────

/** 기기 ID(clientId) → 참가자 ID 변환. 재입장으로 이어받은 기기의 입력이 원래 참가자에게 가도록 */
export const resolvePlayerId = (state: GameState, clientId: string) => state.aliases[clientId] ?? clientId;

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'BUZZ':
    case 'SUBMIT':
      return reduce(state, { ...action, playerId: resolvePlayerId(state, action.playerId) });
    case 'PLAYER_PRESENCE':
      return reduce(state, { ...action, id: resolvePlayerId(state, action.id) });
    default:
      return reduce(state, action);
  }
}

function reduce(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'LOAD':
      return action.state;

    // ── 참가자 ──
    case 'PLAYER_JOIN': {
      // 이 기기가 예전에 이어받은 참가자가 있으면 그 참가자로
      let pid = state.aliases[action.id] ?? action.id;
      let aliases = state.aliases;
      // 새 기기(또는 저장소가 지워진 폰)가 나간 참가자와 같은 닉네임으로 들어오면 그 참가자를 이어받음
      const claim = action.claimId ? state.players[action.claimId] : undefined;
      if (!state.players[pid] && claim && !claim.isBot) {
        pid = claim.id;
        aliases = { ...aliases, [action.id]: pid };
      }
      const prev = state.players[pid];
      const name = action.name.trim().slice(0, 12) || '이름없음';
      return {
        ...state,
        aliases,
        players: {
          ...state.players,
          [pid]: prev
            ? { ...prev, name, team: action.team, online: true } // 재입장: 점수 유지
            : {
                id: pid, name, team: action.team, personalScore: 0,
                online: true, isBot: !!action.isBot, joinedAt: action.at,
              },
        },
      };
    }

    case 'PLAYER_PRESENCE': {
      const p = state.players[action.id];
      if (!p || p.online === action.online) return state;
      return { ...state, players: { ...state.players, [action.id]: { ...p, online: action.online } } };
    }

    case 'REMOVE_PLAYER': {
      if (!state.players[action.id]) return state;
      const players = { ...state.players };
      delete players[action.id];
      const answers = { ...state.round.answers };
      delete answers[action.id];
      // 이 참가자를 가리키던 기기 연결도 정리
      const aliases = Object.fromEntries(Object.entries(state.aliases).filter(([, pid]) => pid !== action.id));
      return {
        ...state,
        players,
        aliases,
        buzzer: { ...state.buzzer, order: state.buzzer.order.filter((b) => b.playerId !== action.id) },
        round: { ...state.round, answers },
      };
    }

    // ── 점수 ──
    case 'SET_MODE':
      return state.mode === action.mode ? state : { ...state, mode: action.mode };

    case 'AWARD': {
      const points = clampPoints(action.points);
      if (!points) return state;
      // 현재 모드에 맞는 대상만 남김
      const valid =
        state.mode === 'individual'
          ? action.targetIds.filter((id) => state.players[id])
          : action.targetIds.filter((id) => TEAM_IDS.some((t) => String(t) === id));
      const targetIds = [...new Set(valid)];
      if (!targetIds.length) return state;
      const ev: ScoreEvent = { id: uid(), mode: state.mode, targetIds, points, at: Date.now() };
      const next = applyScore(state, ev, 1);
      return { ...next, history: [...state.history, ev].slice(-MAX_HISTORY) };
    }

    case 'UNDO': {
      const last = state.history[state.history.length - 1];
      if (!last) return state;
      const next = applyScore(state, last, -1);
      return { ...next, history: state.history.slice(0, -1) };
    }

    case 'RENAME_TEAM': {
      const name = action.name.trim().slice(0, 10);
      if (!name) return state;
      return {
        ...state,
        teams: state.teams.map((t) => (t.teamId === action.teamId ? { ...t, teamName: name } : t)),
      };
    }

    case 'RESET_SCORES': {
      if (action.mode === 'individual') {
        const players = Object.fromEntries(
          Object.entries(state.players).map(([id, p]) => [id, { ...p, personalScore: 0 }]),
        );
        return { ...state, players, history: state.history.filter((h) => h.mode !== 'individual') };
      }
      return {
        ...state,
        teams: state.teams.map((t) => ({ ...t, teamScore: 0 })),
        history: state.history.filter((h) => h.mode !== 'team'),
      };
    }

    case 'SHOW_PODIUM':
      return state.podium === action.on ? state : { ...state, podium: action.on };

    // ── 버저 ──
    case 'BUZZER_OPEN':
      return { ...state, buzzer: { open: true, order: [], out: [], round: state.buzzer.round + 1 } };

    case 'BUZZER_LOCK':
      return state.buzzer.open ? { ...state, buzzer: { ...state.buzzer, open: false } } : state;

    case 'BUZZER_RESET':
      return { ...state, buzzer: { ...state.buzzer, order: [] } };

    case 'BUZZ': {
      const { buzzer } = state;
      if (!buzzer.open || !state.players[action.playerId]) return state;
      if (buzzer.out.includes(action.playerId)) return state;
      if (buzzer.order.some((b) => b.playerId === action.playerId)) return state;
      const first = buzzer.order.length === 0;
      return {
        ...state,
        buzzer: { ...buzzer, order: [...buzzer.order, { playerId: action.playerId, at: action.at }] },
        // 첫 버저가 들어오면 답변하는 동안 타이머 정지
        timer: first && state.round.phase === 'live' ? pauseTimer(state.timer) : state.timer,
      };
    }

    case 'BUZZ_WRONG': {
      // 1등 오답 → 제외하고 다음 사람에게 기회. 대기자가 없으면 타이머 재개
      const [first, ...rest] = state.buzzer.order;
      if (!first) return state;
      return {
        ...state,
        buzzer: { ...state.buzzer, order: rest, out: [...state.buzzer.out, first.playerId] },
        timer: rest.length === 0 && state.round.phase === 'live' ? resumeTimer(state.timer) : state.timer,
      };
    }

    // ── 문제 진행 ──
    case 'PICK_CATEGORY': {
      const cat = findCategory(action.kind, action.categoryId);
      const type = findType(action.kind);
      if (!cat || !type) return state;
      return {
        ...state,
        round: { ...state.round, kind: action.kind, categoryId: action.categoryId, questionId: null, phase: 'ready', asked: [], answers: {} },
        buzzer: { ...state.buzzer, open: false, order: [], out: [] },
        timer: makeTimer(type.defaultSec),
      };
    }

    case 'LOAD_QUESTION':
      return loadQuestion(state, action.questionId, true);

    case 'NEXT_QUESTION': {
      const cat = findCategory(state.round.kind, state.round.categoryId);
      if (!cat?.questions.length) return state;
      const ids = cat.questions.map((q) => q.id);
      // 이전 문제로 갔다가 다시 다음으로 오는 경우: 이미 낸 순서를 따라감
      const pos = state.round.asked.indexOf(state.round.questionId ?? '');
      if (pos >= 0 && pos < state.round.asked.length - 1) {
        return loadQuestion(state, state.round.asked[pos + 1], false);
      }
      const unused = ids.filter((id) => !state.round.used.includes(id));
      if (!unused.length) return state; // 모두 출제함
      let nextId: string;
      if (state.round.shuffle) {
        nextId = unused[Math.floor(Math.random() * unused.length)];
      } else {
        const cur = ids.indexOf(state.round.questionId ?? '');
        nextId = unused.find((id) => ids.indexOf(id) > cur) ?? unused[0];
      }
      return loadQuestion(state, nextId, true);
    }

    case 'RANDOM_QUESTION': {
      let base = state;
      const kind = action.kind ?? state.round.kind;
      let catId = action.categoryId ?? (action.kind ? null : state.round.categoryId);
      if (!kind) return state;
      const type = findType(kind);
      if (!type) return state;
      const unusedIn = (id: string) =>
        (findCategory(kind, id)?.questions ?? []).filter((q) => !state.round.used.includes(q.id));
      if (!catId) {
        // 종류만 지정: 안 낸 문제가 남은 카테고리 중 하나를 무작위로
        const cats = type.categories.filter((c) => unusedIn(c.id).length > 0);
        if (!cats.length) return state;
        catId = cats[Math.floor(Math.random() * cats.length)].id;
      }
      const pool = unusedIn(catId);
      if (!pool.length) return state; // 이 카테고리는 모두 출제함
      if (state.round.kind !== kind || state.round.categoryId !== catId) {
        base = reduce(state, { type: 'PICK_CATEGORY', kind, categoryId: catId });
      }
      return loadQuestion(base, pool[Math.floor(Math.random() * pool.length)].id, true);
    }

    case 'PREV_QUESTION': {
      const pos = state.round.asked.indexOf(state.round.questionId ?? '');
      if (pos <= 0) return state;
      return loadQuestion(state, state.round.asked[pos - 1], false);
    }

    case 'START': {
      const ref = findQuestion(state.round.questionId);
      if (!ref || state.round.phase === 'revealed') return state;
      const isBuzzer = ref.question.input === 'buzzer';
      const isMusic = !!(ref.question.input === 'buzzer' && ref.question.media);
      // 가사 낭독 문제는 낭독이 끝나면 버저가 열림 (TTS_ENDED)
      const isTts = !!(ref.question.input === 'buzzer' && ref.question.lyrics);
      const fresh = state.round.phase === 'ready';
      return {
        ...state,
        round: {
          ...state.round,
          phase: 'live',
          startedAt: fresh || !state.round.startedAt ? Date.now() : state.round.startedAt,
          // 음악 문제는 시작과 동시에 1초 재생
          clip: isMusic && fresh ? { seq: state.round.clip.seq + 1, sec: 1 } : state.round.clip,
          // 가사 낭독 문제는 [문제 공개 + 시작] 1초 뒤 자동 낭독
          tts: isTts && fresh ? { seq: (state.round.tts?.seq ?? 0) + 1, rate: 1, delayMs: TTS_AUTO_DELAY_MS } : state.round.tts,
        },
        // 버저 문제: 바로 열림. 음악 문제는 노래가 끝나면(CLIP_ENDED) 열림
        buzzer: isBuzzer
          ? fresh
            ? { open: !isMusic && !isTts, order: [], out: [], round: state.buzzer.round + 1 }
            : { ...state.buzzer, open: isTts ? state.buzzer.open : true }
          : { ...state.buzzer, open: false },
        // 버저 문제는 타이머 없이 진행 (MC가 판정). O/X·4지선다만 타이머
        timer: isBuzzer
          ? pauseTimer(state.timer)
          : // 시간이 다 된 상태에서 다시 시작하면 같은 길이로 새로 시작
            resumeTimer(state.timer.running || remainingMs(state.timer) > 0 ? state.timer : makeTimer(state.timer.durationMs / 1000)),
      };
    }

    case 'CLOSE':
      if (state.round.phase !== 'live') return state;
      return {
        ...state,
        round: { ...state.round, phase: 'closed' },
        buzzer: { ...state.buzzer, open: false },
        timer: pauseTimer(state.timer),
      };

    case 'REVEAL':
      if (!state.round.questionId) return state;
      return autoScoreChoice({
        ...state,
        round: { ...state.round, phase: 'revealed' },
        buzzer: { ...state.buzzer, open: false },
        timer: pauseTimer(state.timer),
      });

    case 'END_ROUND':
      // 퀴즈 화면을 닫고 대기 화면으로 (출제 기록은 유지)
      return {
        ...state,
        round: { ...state.round, kind: null, categoryId: null, questionId: null, phase: 'ready', asked: [], answers: {} },
        buzzer: { ...state.buzzer, open: false, order: [], out: [] },
        timer: pauseTimer(state.timer),
      };

    case 'SET_SHUFFLE':
      return { ...state, round: { ...state.round, shuffle: action.on } };

    case 'PLAY_CLIP': {
      // sec: null = 끝까지, 0 = 정지
      const sec = action.sec === null ? null : action.sec <= 0 ? 0 : Math.max(0.5, Math.min(60, action.sec));
      // 음악 문제 진행 중 다시 들려줄 때는 노래가 끝날 때까지 버저를 잠시 닫음 (누른 순서는 유지)
      const closeBuzzer = sec !== 0 && state.round.phase === 'live' && state.round.kind === 'music';
      return {
        ...state,
        round: { ...state.round, clip: { seq: state.round.clip.seq + 1, sec } },
        buzzer: closeBuzzer ? { ...state.buzzer, open: false } : state.buzzer,
      };
    }

    case 'ZOOM_SET': {
      if (state.round.kind !== 'zoom' || !state.round.questionId) return state;
      const level = action.level === 2 || action.level === 3 ? action.level : 1;
      return { ...state, round: { ...state.round, zoom: level } };
    }

    case 'ZOOM_WIDEN': {
      if (state.round.kind !== 'zoom' || !state.round.questionId) return state;
      const cur = state.round.zoom ?? 1;
      return cur >= 3 ? state : { ...state, round: { ...state.round, zoom: (cur + 1) as 2 | 3 } };
    }

    case 'TTS_PLAY': {
      if (state.round.kind !== 'tts' || !state.round.questionId || state.round.phase === 'revealed') return state;
      // 아직 문제가 공개 전이면 먼저 시작(공개)시킨 뒤 낭독
      const base = state.round.phase === 'ready' ? reduce(state, { type: 'START' }) : state;
      const rate = Math.max(0.5, Math.min(2, action.rate ?? base.round.tts?.rate ?? 1));
      return {
        ...base,
        round: { ...base.round, tts: { seq: (base.round.tts?.seq ?? 0) + 1, rate, delayMs: 0 } },
        // 1초 음악처럼 낭독이 끝날 때까지 버저를 닫아 둠 (이미 누른 순서는 유지) → TTS_ENDED 에서 열림
        buzzer: { ...base.buzzer, open: false },
      };
    }

    case 'TTS_ENDED': {
      if (action.seq !== state.round.tts?.seq || state.round.phase !== 'live' || state.round.kind !== 'tts') return state;
      if (state.buzzer.open) return state;
      return { ...state, buzzer: { ...state.buzzer, open: true } };
    }

    case 'TTS_HINT_SET': {
      if (state.round.kind !== 'tts' || !state.round.questionId) return state;
      const level = action.level === 2 || action.level === 3 ? action.level : 1;
      return { ...state, round: { ...state.round, ttsHint: level } };
    }

    case 'TTS_HINT_MORE': {
      if (state.round.kind !== 'tts' || !state.round.questionId) return state;
      const cur = state.round.ttsHint ?? 1;
      return cur >= 3 ? state : { ...state, round: { ...state.round, ttsHint: (cur + 1) as 2 | 3 } };
    }

    case 'CLIP_ENDED': {
      // 전광판에서 노래 재생이 끝남(또는 정지·재생 오류) → 음악 문제면 버저 열기
      if (action.seq !== state.round.clip.seq || state.round.phase !== 'live' || state.round.kind !== 'music') return state;
      if (state.buzzer.open) return state;
      return { ...state, buzzer: { ...state.buzzer, open: true } };
    }

    case 'SUBMIT': {
      if (state.round.phase !== 'live' || !state.players[action.playerId]) return state;
      if (!validSubmit(state, action.value)) return state;
      return {
        ...state,
        round: { ...state.round, answers: { ...state.round.answers, [action.playerId]: { value: action.value, at: action.at } } },
      };
    }

    // ── 타이머 ──
    case 'TIMER_SET': {
      const sec = Math.max(3, Math.min(600, Math.round(action.sec)));
      const t = makeTimer(sec);
      return { ...state, timer: state.timer.running ? { ...t, running: true, endsAt: Date.now() + t.durationMs } : t };
    }

    case 'TIMER_RESUME':
      return { ...state, timer: resumeTimer(state.timer) };

    case 'TIMER_PAUSE':
      return { ...state, timer: pauseTimer(state.timer) };

    case 'TIMER_RESET':
      return { ...state, timer: makeTimer(state.timer.durationMs / 1000) };

    case 'TIMER_EXPIRE': {
      if (!state.timer.running) return state;
      const timer = { ...state.timer, running: false, endsAt: null, remainingMs: 0 };
      if (state.round.phase !== 'live') return { ...state, timer };
      // 시간 종료 → 입력 마감
      return { ...state, timer, round: { ...state.round, phase: 'closed' }, buzzer: { ...state.buzzer, open: false } };
    }
  }
}
