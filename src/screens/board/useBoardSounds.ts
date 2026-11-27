import { useEffect, useRef } from 'react';
import { sfx } from '../../audio/sfx';
import { remainingMs } from '../../game/reducer';
import type { GameState } from '../../types';

/**
 * 전광판 효과음 — 상태 변화(이전 ↔ 현재)를 비교해서 재생.
 * 폰에서 온 명령이든 패널 클릭이든 같은 소리가 나도록 상태 기준으로 판단.
 */
export function useBoardSounds(state: GameState) {
  const prev = useRef(state);

  useEffect(() => {
    const p = prev.current;
    prev.current = state;
    if (p === state) return;

    // 참가자 입장
    if (Object.keys(state.players).length > Object.keys(p.players).length) sfx.join();

    // 버저
    if (state.buzzer.order.length > p.buzzer.order.length) {
      if (p.buzzer.order.length === 0) sfx.buzz();
      else sfx.buzzMinor();
    }
    if (state.buzzer.out.length > p.buzzer.out.length) sfx.wrong();

    // 진행 단계
    if (p.round.phase !== state.round.phase && p.round.questionId === state.round.questionId && state.round.questionId) {
      if (state.round.phase === 'live' && p.round.phase === 'ready') sfx.start();
      if (state.round.phase === 'closed' && state.timer.remainingMs === 0) sfx.timeUp();
      if (state.round.phase === 'revealed') sfx.correct();
    }

    // 점수 (되돌리기로 줄어든 경우는 무음)
    if (state.history.length > p.history.length) {
      const last = state.history[state.history.length - 1];
      if (last.points > 0) sfx.coin();
      else sfx.minus();
    }

    // 순위 발표
    if (state.podium && !p.podium) sfx.fanfare();
  }, [state]);

  // 마지막 5초 째깍
  const timerRef = useRef(state.timer);
  timerRef.current = state.timer;
  useEffect(() => {
    if (!state.timer.running) return;
    let lastSec = -1;
    const id = window.setInterval(() => {
      const left = remainingMs(timerRef.current);
      const sec = Math.ceil(left / 1000);
      if (sec !== lastSec && sec >= 1 && sec <= 5) sfx.tick(sec === 1);
      lastSec = sec;
    }, 100);
    return () => window.clearInterval(id);
  }, [state.timer.running, state.timer.endsAt]);
}
