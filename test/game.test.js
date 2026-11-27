import test from 'node:test';
import assert from 'node:assert/strict';
import { reducer, makeInitialState, isCorrectText } from '../src/core/game.js';
import { playerView } from '../src/core/views.js';
import { ALL_QUIZZES, SONGS, TYPING, BUZZ, SPEED } from '../src/data/quizzes.js';

const run = (s, ...acts) => acts.reduce((st, a) => reducer(st, a), s);
const base = () =>
  run(makeInitialState(),
    { type: 'JOIN', id: 'a', name: 'A', team: 1 },
    { type: 'JOIN', id: 'b', name: 'B', team: 2 });

test('샘플 문제 카테고리별 10개, 총 40개', () => {
  assert.equal(SONGS.length, 10); assert.equal(TYPING.length, 10);
  assert.equal(BUZZ.length, 10); assert.equal(SPEED.length, 10);
  assert.equal(ALL_QUIZZES.length, 40);
  assert.equal(new Set(ALL_QUIZZES.map((q) => q.id)).size, 40);
  SONGS.forEach((q) => { assert.ok(q.youtubeId && q.notes.length && q.hint && q.title && q.artist); });
});

test('개인전 점수는 personalScore 에만, 팀 점수는 변하지 않는다', () => {
  let s = run(base(), { type: 'SET_MODE', mode: 'solo' }, { type: 'AWARD', pid: 'a', delta: 30 });
  assert.equal(s.players.a.personalScore, 30);
  assert.equal(s.teams[1].teamScore, 0);
});

test('팀전 점수는 teamScore 에만, 개인 점수는 변하지 않는다', () => {
  let s = run(base(), { type: 'SET_MODE', mode: 'team' }, { type: 'AWARD', teamId: 2, delta: 20 }, { type: 'AWARD', pid: 'a', delta: 10 });
  assert.equal(s.teams[2].teamScore, 20);
  assert.equal(s.teams[1].teamScore, 10); // 팀전에서 pid 로 부여하면 소속 팀 점수
  assert.equal(s.players.a.personalScore, 0);
  assert.equal(s.players.b.personalScore, 0);
});

test('개인전에서 teamId 만으로는 아무 점수도 오르지 않는다', () => {
  const s = run(base(), { type: 'AWARD', teamId: 1, delta: 50 });
  assert.equal(s.teams[1].teamScore, 0);
});

test('초성 퀴즈: 정답 자동 판정 + 중복 부여 방지', () => {
  assert.ok(isCorrectText(TYPING[0], ' 김치 찌개 '));
  let s = run(base(), { type: 'SELECT_Q', qid: 'typ-01' },
    { type: 'ANSWER', pid: 'a', text: '김치찌개', now: 1 },
    { type: 'ANSWER', pid: 'b', text: '된장찌개', now: 2 });
  assert.equal(s.answers.a.correct, true);
  assert.equal(s.answers.b.correct, false);
  s = run(s, { type: 'AWARD_ANSWER', pid: 'a', delta: 20 }, { type: 'AWARD_ANSWER', pid: 'a', delta: 20 });
  assert.equal(s.players.a.personalScore, 20);
});

test('버저: 선착순 기록, 오답이면 감점 후 다음 순위, 정답이면 잠금', () => {
  let s = run(base(), { type: 'SELECT_Q', qid: 'buz-01' },
    { type: 'BUZZ', pid: 'b', now: 1 }, { type: 'BUZZ', pid: 'a', now: 2 }, { type: 'BUZZ', pid: 'a', now: 3 });
  assert.deepEqual(s.buzz.map((x) => x.pid), ['b', 'a']);
  s = run(s, { type: 'BUZZ_RESULT', pid: 'b', correct: false, delta: -10 });
  assert.equal(s.players.b.personalScore, -10);
  assert.equal(s.buzzOpen, true);
  s = run(s, { type: 'BUZZ_RESULT', pid: 'a', correct: true, delta: 30 });
  assert.equal(s.players.a.personalScore, 30);
  assert.equal(s.buzzOpen, false);
});

test('노래: 재생 전에는 버저 잠김, 재생 명령과 동시에 열림', () => {
  let s = run(base(), { type: 'SELECT_Q', qid: 'song-01' }, { type: 'BUZZ', pid: 'a', now: 1 });
  assert.equal(s.buzz.length, 0);
  s = run(s, { type: 'SONG_PLAY', kind: 's1' }, { type: 'BUZZ', pid: 'a', now: 2 });
  assert.equal(s.buzz.length, 1);
});

test('팀전 버저는 팀당 1회만 기록', () => {
  let s = run(base(), { type: 'JOIN', id: 'c', name: 'C', team: 1 }, { type: 'SET_MODE', mode: 'team' },
    { type: 'SELECT_Q', qid: 'buz-02' }, { type: 'BUZZ', pid: 'a', now: 1 }, { type: 'BUZZ', pid: 'c', now: 2 }, { type: 'BUZZ', pid: 'b', now: 3 });
  assert.deepEqual(s.buzz.map((x) => x.pid), ['a', 'b']);
  s = run(s, { type: 'BUZZ_RESULT', pid: 'a', correct: true, delta: 30 });
  assert.equal(s.teams[1].teamScore, 30);
  assert.equal(s.players.a.personalScore, 0);
});

test('스피드 퀴즈: O/X 카운트, 종료 후 일괄 배점은 한 번만', () => {
  let s = run(base(), { type: 'SET_MODE', mode: 'team' }, { type: 'SELECT_Q', qid: 'spd-01' },
    { type: 'SPEED_START', teamId: 2, now: 1000 },
    { type: 'SPEED_MARK', ok: true }, { type: 'SPEED_MARK', ok: true }, { type: 'SPEED_MARK', ok: false });
  assert.equal(s.speed.correct, 2); assert.equal(s.speed.passed, 1); assert.equal(s.speed.idx, 3);
  s = run(s, { type: 'SPEED_AWARD', delta: 20 }); // 진행 중에는 무시
  assert.equal(s.teams[2].teamScore, 0);
  s = run(s, { type: 'TICK', now: 1000 + 61000 }, { type: 'SPEED_AWARD', delta: 40 }, { type: 'SPEED_AWARD', delta: 40 });
  assert.equal(s.teams[2].teamScore, 40);
  assert.equal(s.speed.running, false);
});

test('랜덤 출제: 같은 카테고리에서 10번 연속 중복 없이, 다 쓰면 다시 섞는다', () => {
  let s = base();
  const seen = new Set();
  for (let i = 0; i < 10; i++) {
    s = run(s, { type: 'RANDOM_Q', category: 'buzz', r: Math.random() });
    assert.equal(s.q.category, 'buzz');
    assert.ok(!seen.has(s.q.qid));
    seen.add(s.q.qid);
  }
  s = run(s, { type: 'RANDOM_Q', category: 'buzz', r: 0.5 });
  assert.equal(s.q.category, 'buzz');
  assert.equal(s.used.filter((id) => id.startsWith('buz')).length, 1);
  s = run(s, { type: 'RESET_USED' });
  assert.equal(s.used.length, 0);
});

test('참가자용 공개 상태에는 정답/문제 내용이 없다', () => {
  const s = run(base(), { type: 'SELECT_Q', qid: 'typ-01' });
  const json = JSON.stringify(playerView(s, 'a', 0));
  assert.ok(!json.includes('김치찌개'));
  assert.ok(!json.includes('ㄱㅊㅉㄱ'));
  assert.ok(!json.includes('typ-01'));
});
