// 호스트(전광판)가 보유하는 단일 게임 상태 + 순수 reducer.
// 모든 점수 규칙은 여기서만 처리한다.
//   - 개인전(solo): players[id].personalScore 에만 누적
//   - 팀전(team)  : teams[teamId].teamScore 에만 누적
//   → 두 점수는 서로 절대 영향을 주지 않는다.
import { getQuiz } from '../data/quizzes.js';

export const TEAM_IDS = [1, 2, 3, 4];
export const PRESETS = [10, 20, 30, 50, -10];

export const normalize = (s) =>
  String(s ?? '')
    .toLowerCase()
    .replace(/[\s.,!?~'"“”‘’·\-_]/g, '');

export function isCorrectText(quiz, text) {
  if (!quiz || !quiz.answers) return false;
  const t = normalize(text);
  if (!t) return false;
  return quiz.answers.some((a) => normalize(a) === t);
}

export function makeInitialState() {
  const teams = {};
  TEAM_IDS.forEach((id) => (teams[id] = { teamId: id, teamName: `${id}팀`, teamScore: 0 }));
  return {
    mode: 'solo', // 'solo' | 'team'
    phase: 'lobby', // lobby | question | reveal
    players: {}, // id -> { id, name, team, personalScore, bot }
    teams,
    q: null, // { qid, category }
    nonce: 0, // 문제 선택할 때마다 증가
    revealed: false, // 전광판에 정답 공개 여부
    hintShown: false,
    inputOpen: false, // 타이핑 제출 가능
    buzzOpen: false, // 버저 가능
    buzz: [], // [{ pid, at, status: 'pending'|'right'|'wrong', delta? }]
    answers: {}, // pid -> { pid, text, at, correct, awarded }
    play: { kind: null, n: 0 }, // 노래 재생 명령
    speed: null, // 스피드 퀴즈 진행 상태
    timer: null, // { endsAt, sec }
    fx: { id: null, n: 0 }, // 효과음 이벤트
    notice: '',
  };
}

const fx = (s, id) => ({ ...s, fx: { id, n: s.fx.n + 1 } });

// 현재 모드 규칙으로 점수 부여. 개인전이면 개인에게만, 팀전이면 팀에게만.
export function applyAward(s, { pid, teamId, delta }) {
  const d = Number(delta);
  if (!Number.isFinite(d) || d === 0) return s;
  if (s.mode === 'team') {
    const tid = teamId ?? s.players[pid]?.team;
    const t = s.teams[tid];
    if (!t) return s;
    return { ...s, teams: { ...s.teams, [tid]: { ...t, teamScore: t.teamScore + d } } };
  }
  const p = s.players[pid];
  if (!p) return s;
  return { ...s, players: { ...s.players, [pid]: { ...p, personalScore: p.personalScore + d } } };
}

const buzzKeyFor = (s, pid) => (s.mode === 'team' ? `t${s.players[pid]?.team}` : pid);

export function reducer(s, a) {
  switch (a.type) {
    case 'JOIN': {
      const prev = s.players[a.id];
      const team = TEAM_IDS.includes(Number(a.team)) ? Number(a.team) : 1;
      const name = String(a.name || '').trim().slice(0, 12) || '익명';
      const player = prev
        ? { ...prev, name, team }
        : { id: a.id, name, team, personalScore: 0, bot: !!a.bot };
      return fx({ ...s, players: { ...s.players, [a.id]: player } }, prev ? s.fx.id : 'join');
    }
    case 'KICK': {
      const players = { ...s.players };
      delete players[a.id];
      return { ...s, players };
    }
    case 'SET_MODE':
      return a.mode === 'solo' || a.mode === 'team' ? { ...s, mode: a.mode } : s;

    case 'SELECT_Q': {
      const quiz = getQuiz(a.qid);
      if (!quiz) return s;
      const c = quiz.category;
      return {
        ...s,
        phase: 'question',
        q: { qid: quiz.id, category: c },
        nonce: s.nonce + 1,
        revealed: false,
        hintShown: false,
        inputOpen: c === 'typing',
        buzzOpen: c === 'buzz',
        buzz: [],
        answers: {},
        play: { kind: null, n: s.play.n },
        speed: null,
        timer: null,
        notice: '',
      };
    }
    case 'BACK_LOBBY':
      return {
        ...s, phase: 'lobby', q: null, revealed: false, hintShown: false, inputOpen: false,
        buzzOpen: false, buzz: [], answers: {}, speed: null, timer: null,
        play: { kind: 'stop', n: s.play.n + 1 },
      };

    // ---- 노래 ----
    case 'SONG_PLAY': {
      if (s.q?.category !== 'song') return s;
      const kinds = ['s1', 's3', 'replay', 'melody', 'stop'];
      if (!kinds.includes(a.kind)) return s;
      const next = { ...s, play: { kind: a.kind, n: s.play.n + 1 } };
      if (a.kind !== 'stop') next.buzzOpen = true; // 재생과 동시에 버저 활성화
      return next;
    }
    case 'HINT_SHOW':
      return { ...s, hintShown: true };
    case 'REVEAL':
      return { ...s, revealed: true, phase: 'reveal', inputOpen: false, buzzOpen: false };

    // ---- 버저 ----
    case 'BUZZ': {
      if (!s.buzzOpen || !s.players[a.pid]) return s;
      const key = buzzKeyFor(s, a.pid);
      if (s.buzz.some((b) => buzzKeyFor(s, b.pid) === key)) return s; // 개인/팀당 1회
      const next = { ...s, buzz: [...s.buzz, { pid: a.pid, at: a.now, status: 'pending' }] };
      return s.buzz.length === 0 ? fx(next, 'buzz') : next;
    }
    case 'BUZZ_TOGGLE':
      return { ...s, buzzOpen: !!a.open };
    case 'BUZZ_RESET':
      return { ...s, buzz: [], buzzOpen: s.q?.category === 'buzz' || s.q?.category === 'song' ? true : s.buzzOpen };
    case 'BUZZ_RESULT': {
      const i = s.buzz.findIndex((b) => b.pid === a.pid && b.status === 'pending');
      if (i < 0) return s;
      const buzz = s.buzz.map((b, k) => (k === i ? { ...b, status: a.correct ? 'right' : 'wrong', delta: a.delta } : b));
      let next = { ...s, buzz };
      next = applyAward(next, { pid: a.pid, delta: a.delta });
      if (a.correct) next = { ...next, buzzOpen: false };
      return fx(next, a.correct ? 'correct' : 'wrong');
    }

    // ---- 타이핑 ----
    case 'INPUT_TOGGLE':
      return { ...s, inputOpen: !!a.open };
    case 'ANSWER': {
      if (!s.inputOpen || !s.players[a.pid] || s.q?.category !== 'typing') return s;
      const prev = s.answers[a.pid];
      if (prev && prev.awarded != null) return s;
      const text = String(a.text || '').trim().slice(0, 40);
      if (!text) return s;
      const correct = isCorrectText(getQuiz(s.q.qid), text);
      return { ...s, answers: { ...s.answers, [a.pid]: { pid: a.pid, text, at: a.now, correct, awarded: null } } };
    }
    case 'AWARD_ANSWER': {
      const ans = s.answers[a.pid];
      if (!ans || ans.awarded != null) return s;
      let next = { ...s, answers: { ...s.answers, [a.pid]: { ...ans, awarded: a.delta } } };
      next = applyAward(next, { pid: a.pid, delta: a.delta });
      return fx(next, a.delta > 0 ? 'correct' : 'wrong');
    }

    // ---- 점수 직접 부여 ----
    case 'AWARD': {
      const next = applyAward(s, a);
      return next === s ? s : fx(next, a.delta > 0 ? 'correct' : 'wrong');
    }
    case 'RESET_SCORES': {
      const players = {};
      Object.values(s.players).forEach((p) => (players[p.id] = { ...p, personalScore: 0 }));
      const teams = {};
      Object.values(s.teams).forEach((t) => (teams[t.teamId] = { ...t, teamScore: 0 }));
      return { ...s, players, teams };
    }

    // ---- 타이머 ----
    case 'TIMER_START':
      return { ...s, timer: { endsAt: a.now + a.sec * 1000, sec: a.sec } };
    case 'TIMER_STOP':
      return { ...s, timer: null };
    case 'TICK': {
      let next = s;
      if (s.timer && a.now >= s.timer.endsAt) {
        next = fx({ ...next, timer: null, inputOpen: s.q?.category === 'typing' ? false : next.inputOpen }, 'timeover');
      }
      if (next.speed?.running && a.now >= next.speed.endsAt) {
        next = fx({ ...next, speed: { ...next.speed, running: false, finished: true } }, 'timeover');
      }
      return next;
    }

    // ---- 스피드 퀴즈 ----
    case 'SPEED_START': {
      if (s.q?.category !== 'speed') return s;
      const quiz = getQuiz(s.q.qid);
      const sec = a.sec || quiz.seconds || 60;
      const who = s.mode === 'team' ? { teamId: Number(a.teamId) } : { pid: a.pid };
      if (s.mode === 'team' ? !s.teams[who.teamId] : !s.players[who.pid]) return s;
      return {
        ...s,
        speed: { running: true, finished: false, endsAt: a.now + sec * 1000, sec, idx: 0, correct: 0, passed: 0, who, awarded: null },
      };
    }
    case 'SPEED_MARK': {
      const sp = s.speed;
      if (!sp?.running) return s;
      const quiz = getQuiz(s.q.qid);
      const idx = sp.idx + 1;
      const done = idx >= quiz.words.length;
      const speed = {
        ...sp, idx,
        correct: sp.correct + (a.ok ? 1 : 0),
        passed: sp.passed + (a.ok ? 0 : 1),
        running: !done, finished: done,
      };
      return fx({ ...s, speed }, done ? 'timeover' : a.ok ? 'ok' : 'pass');
    }
    case 'SPEED_END':
      return s.speed?.running ? fx({ ...s, speed: { ...s.speed, running: false, finished: true } }, 'timeover') : s;
    case 'SPEED_AWARD': {
      const sp = s.speed;
      if (!sp || sp.running || sp.awarded != null) return s;
      let next = { ...s, speed: { ...sp, awarded: a.delta } };
      next = applyAward(next, { ...sp.who, delta: a.delta });
      return fx(next, a.delta > 0 ? 'correct' : 'wrong');
    }

    // ---- 효과음 ----
    case 'FX':
      return fx(s, a.id);
    default:
      return s;
  }
}

// MC(원격) 가 보낼 수 있는 액션만 허용
export const MC_ACTIONS = new Set([
  'SET_MODE', 'SELECT_Q', 'BACK_LOBBY', 'SONG_PLAY', 'HINT_SHOW', 'REVEAL', 'BUZZ_TOGGLE', 'BUZZ_RESET',
  'BUZZ_RESULT', 'INPUT_TOGGLE', 'AWARD_ANSWER', 'AWARD', 'RESET_SCORES', 'TIMER_START', 'TIMER_STOP',
  'SPEED_START', 'SPEED_MARK', 'SPEED_END', 'SPEED_AWARD', 'FX', 'KICK',
]);

// 순위표
export function rankPlayers(s) {
  return Object.values(s.players).sort((a, b) => b.personalScore - a.personalScore || a.name.localeCompare(b.name));
}
export function rankTeams(s) {
  return Object.values(s.teams).sort((a, b) => b.teamScore - a.teamScore || a.teamId - b.teamId);
}
