import { useEffect, useState } from 'react';
import type { McAction } from '../game/reducer';
import { QUIZ_TYPES, findCategory } from '../data/quizzes';
import type { QuizKind } from '../data/quiz';
import type { McView } from '../types';
import { TimerRing } from './TimerRing';

const TIMER_PRESETS = [5, 10, 15, 20, 30, 60];

/**
 * 퀴즈 진행 컨트롤 (전광판 패널 · MC 폰 공용)
 * 종류 → 카테고리 → 문제 선택, 시작/마감/정답 공개/다음, 타이머, 음악 재생
 */
export function QuizControl({ view, send }: { view: McView; send: (a: McAction) => void }) {
  const { round, timer } = view;
  const [browseKind, setBrowseKind] = useState<QuizKind>(round.kind ?? QUIZ_TYPES[0].kind);
  const [showList, setShowList] = useState(false);

  useEffect(() => {
    if (round.kind) setBrowseKind(round.kind);
  }, [round.kind]);

  const browseType = QUIZ_TYPES.find((t) => t.kind === browseKind)!;
  const isBuzzerKind = QUIZ_TYPES.find((t) => t.kind === round.kind)?.input === 'buzzer';
  const cat = findCategory(round.kind, round.categoryId);
  const q = round.question;
  const usedInCat = cat ? cat.questions.filter((x) => view.used.includes(x.id)).length : 0;
  const allUsed = !!cat && usedInCat >= cat.questions.length;

  const mainAction = (() => {
    if (!cat) return null;
    if (!q) return { label: '▶ 첫 문제 불러오기', act: { type: 'NEXT_QUESTION' } as McAction, disabled: !cat.questions.length };
    switch (round.phase) {
      case 'ready':
        return { label: '▶ 문제 공개 + 시작', act: { type: 'START' } as McAction };
      case 'live':
        // 버저 문제는 MC가 답을 듣고 판정하므로 마감 단계 없이 바로 정답 공개
        return q.input === 'buzzer'
          ? { label: '👀 정답 공개', act: { type: 'REVEAL' } as McAction }
          : { label: '⏹ 마감', act: { type: 'CLOSE' } as McAction };
      case 'closed':
        return { label: '👀 정답 공개', act: { type: 'REVEAL' } as McAction };
      case 'revealed':
        return allUsed
          ? { label: '✅ 이 카테고리 끝!', act: { type: 'END_ROUND' } as McAction }
          : { label: '다음 문제 ▶', act: { type: 'NEXT_QUESTION' } as McAction };
    }
  })();

  return (
    <div className="quiz-ctl">
      {/* 종류 선택 */}
      <section className="ctl-section">
        <div className="kind-tabs">
          {QUIZ_TYPES.map((t) => (
            <button
              type="button"
              key={t.kind}
              className={`${browseKind === t.kind ? 'on' : ''} ${round.kind === t.kind ? 'active' : ''}`}
              onClick={() => setBrowseKind(t.kind)}
              title={t.title}
            >
              <span>{t.emoji}</span>
              <small>{t.title.replace(' 퀴즈', '')}</small>
            </button>
          ))}
        </div>
        <div className="cat-row">
          <button
            type="button"
            className="cat-btn random"
            disabled={browseType.categories.every((c) => c.questions.every((x) => view.used.includes(x.id)))}
            onClick={() => send({ type: 'RANDOM_QUESTION', kind: browseKind })}
            title="이 종류에서 안 낸 문제를 무작위로 출제"
          >
            🎲 랜덤 출제
          </button>
          {browseType.categories.map((c) => {
            const used = c.questions.filter((x) => view.used.includes(x.id)).length;
            const active = round.kind === browseKind && round.categoryId === c.id;
            return (
              <button
                type="button"
                key={c.id}
                className={`cat-btn ${active ? 'on' : ''}`}
                disabled={!c.questions.length}
                onClick={() => send({ type: 'PICK_CATEGORY', kind: browseKind, categoryId: c.id })}
              >
                {c.name}
                <small>
                  {used}/{c.questions.length}
                </small>
              </button>
            );
          })}
        </div>
      </section>

      {cat && (
        <section className="ctl-section">
          <h4>
            {round.kindEmoji} {round.kindTitle} · {cat.name}
            <span className="muted">
              {q ? ` · ${round.number}번째 문제` : ''} · 출제 {usedInCat}/{cat.questions.length}
            </span>
            <label className="toggle">
              <input type="checkbox" checked={view.shuffle} onChange={(e) => send({ type: 'SET_SHUFFLE', on: e.target.checked })} />
              랜덤
            </label>
            <button type="button" className="link-btn" onClick={() => setShowList((v) => !v)}>
              {showList ? '목록 닫기' : '문제 목록'}
            </button>
          </h4>

          {showList && (
            <div className="q-list">
              {cat.questions.map((x, i) => (
                <button
                  type="button"
                  key={x.id}
                  className={`${x.id === q?.id ? 'cur' : ''} ${view.used.includes(x.id) ? 'used' : ''}`}
                  onClick={() => send({ type: 'LOAD_QUESTION', questionId: x.id })}
                  title={`${i + 1}번 문제 불러오기`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}

          <div className="flow-row">
            <button type="button" className="btn ghost" disabled={round.number <= 1} onClick={() => send({ type: 'PREV_QUESTION' })}>
              ◀
            </button>
            {mainAction && (
              <button type="button" className={`btn go main-flow phase-${round.phase}`} disabled={mainAction.disabled} onClick={() => send(mainAction.act)}>
                {mainAction.label}
              </button>
            )}
            <button
              type="button"
              className="btn ghost"
              disabled={!q || (allUsed && round.number >= round.total)}
              onClick={() => send({ type: 'NEXT_QUESTION' })}
              title="다음 문제 (건너뛰기)"
            >
              ▶
            </button>
          </div>
          <button
            type="button"
            className="btn ghost sm"
            disabled={allUsed}
            onClick={() => send({ type: 'RANDOM_QUESTION' })}
            title="이 카테고리에서 안 낸 문제를 무작위로 출제"
          >
            🎲 랜덤 출제 ({cat.questions.length - usedInCat}문제 남음)
          </button>
          {q && round.phase === 'closed' && (
            <button type="button" className="btn ghost sm" onClick={() => send({ type: 'START' })}>
              ↻ 입력 다시 열기
            </button>
          )}

          {/* 음악 */}
          {q?.isMusic && (
            <div className="music-row">
              <span className="muted small">🎵 재생</span>
              {[1, 3, 5].map((s) => (
                <button type="button" key={s} className="btn sm" onClick={() => send({ type: 'PLAY_CLIP', sec: s })}>
                  {s}초
                </button>
              ))}
              <button type="button" className="btn sm" onClick={() => send({ type: 'PLAY_CLIP', sec: null })}>
                전체
              </button>
              <button type="button" className="btn ghost sm" onClick={() => send({ type: 'PLAY_CLIP', sec: 0 })}>
                ■ 정지
              </button>
            </div>
          )}
          {q && round.kind === 'music' && view.secret && !view.secret.hasMedia && <p className="warn">이 곡은 재생 정보(유튜브 ID)가 없어요.</p>}

          {/* 타이머 — 버저 문제(초성·이모지·스피드·음악)는 타이머 없이 MC가 진행 */}
          {isBuzzerKind ? (
            <div className="row">
              <span className="muted small">⏱ 버저 문제는 타이머 없이 진행돼요</span>
              <button type="button" className="btn ghost sm" onClick={() => send({ type: 'END_ROUND' })}>
                퀴즈 닫기
              </button>
            </div>
          ) : (
          <div className="timer-row">
            <TimerRing timer={timer} size={64} />
            <div className="timer-btns">
              <div className="row">
                {TIMER_PRESETS.map((s) => (
                  <button
                    type="button"
                    key={s}
                    className={`btn sm ${timer.durationMs === s * 1000 ? 'on' : ''}`}
                    onClick={() => send({ type: 'TIMER_SET', sec: s })}
                  >
                    {s}초
                  </button>
                ))}
              </div>
              <div className="row">
                {timer.running ? (
                  <button type="button" className="btn sm" onClick={() => send({ type: 'TIMER_PAUSE' })}>
                    ⏸ 일시정지
                  </button>
                ) : (
                  <button type="button" className="btn sm" disabled={timer.remainingMs <= 0} onClick={() => send({ type: 'TIMER_RESUME' })}>
                    ▶ 재개
                  </button>
                )}
                <button type="button" className="btn ghost sm" onClick={() => send({ type: 'TIMER_RESET' })}>
                  ↺ 리셋
                </button>
                <button type="button" className="btn ghost sm" onClick={() => send({ type: 'END_ROUND' })}>
                  퀴즈 닫기
                </button>
              </div>
            </div>
          </div>
          )}
        </section>
      )}
    </div>
  );
}
