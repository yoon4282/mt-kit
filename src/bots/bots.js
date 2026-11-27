// 시연용 가짜 참가자 봇. 네트워크 없이 호스트 dispatch 로 직접 JOIN/ANSWER/BUZZ 를 보낸다.
import { getQuiz } from '../data/quizzes.js';

const NAMES = ['민준', '서윤', '도윤', '하은', '지호', '수아', '예준', '지우', '시우', '채원', '현우', '다은', '준서', '유나', '건우', '소율'];
const WRONG = ['모르겠다', '혹시 이거?', '아닌데', 'ㅋㅋ', '흠...'];

export function createBots(dispatch, getState) {
  let bots = []; // { id, acc, speed }
  let timers = [];
  let lastKey = '';
  let timerNonce = -1;

  const clear = () => {
    timers.forEach(clearTimeout);
    timers = [];
  };
  const later = (ms, fn) => timers.push(setTimeout(fn, ms));

  function onState() {
    const s = getState();
    if (!bots.length || !s.q) return;
    if (s.nonce !== timerNonce) {
      clear();
      timerNonce = s.nonce;
      lastKey = '';
    }
    const cat = s.q.category;
    if (cat === 'typing' && s.inputOpen && lastKey !== `t${s.nonce}`) {
      lastKey = `t${s.nonce}`;
      const quiz = getQuiz(s.q.qid);
      bots.forEach((b) => {
        if (!s.players[b.id]) return;
        later(800 + Math.random() * 9000 * b.speed, () => {
          const right = Math.random() < b.acc;
          const text = right ? quiz.answers[0] : WRONG[Math.floor(Math.random() * WRONG.length)];
          dispatch({ type: 'ANSWER', pid: b.id, text, now: Date.now() });
        });
      });
    }
    if ((cat === 'buzz' || cat === 'song') && s.buzzOpen && lastKey !== `b${s.nonce}`) {
      lastKey = `b${s.nonce}`;
      bots.forEach((b) => {
        if (!s.players[b.id] || Math.random() > 0.65) return;
        later(300 + Math.random() * 4500 * b.speed, () => dispatch({ type: 'BUZZ', pid: b.id, now: Date.now() }));
      });
    }
  }

  return {
    onState,
    add(n = 8) {
      const start = bots.length;
      for (let i = 0; i < n; i++) {
        const k = start + i;
        const id = `bot-${k + 1}`;
        const name = `🤖${NAMES[k % NAMES.length]}${k >= NAMES.length ? k : ''}`;
        bots.push({ id, acc: 0.3 + Math.random() * 0.5, speed: 0.5 + Math.random() });
        dispatch({ type: 'JOIN', id, name, team: (k % 4) + 1, bot: true });
      }
    },
    count: () => bots.length,
    clearAll() {
      clear();
      bots.forEach((b) => dispatch({ type: 'KICK', id: b.id }));
      bots = [];
    },
    // 새로고침 후 복구된 봇 등록
    adopt(players) {
      Object.values(players).forEach((p) => {
        if (p.bot && !bots.find((b) => b.id === p.id)) bots.push({ id: p.id, acc: 0.3 + Math.random() * 0.5, speed: 0.5 + Math.random() });
      });
    },
  };
}
