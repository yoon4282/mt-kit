import { useState } from 'react';
import type { McView } from '../types';
import { ArtPreview, ZOOM_SCALE } from './ZoomFrame';

const OX_LABEL: Record<string, string> = { O: '⭕ O', X: '❌ X' };

/**
 * MC 비밀 정답지.
 * guarded: 전광판(빔프로젝터) 화면에서는 기본으로 가려 두고, 누르고 있는 동안만 표시
 */
export function SecretSheet({ view, guarded }: { view: McView; guarded?: boolean }) {
  const [peek, setPeek] = useState(false);
  const s = view.secret;
  const { round } = view;

  if (!s) {
    return (
      <section className="secret card">
        <div className="secret-label">🤫 비밀 정답지 · MC에게만 보여요</div>
        <p className="muted">문제를 불러오면 정답과 해설이 여기에 표시돼요.</p>
      </section>
    );
  }

  const hidden = guarded && !peek;
  const total = view.players.length;
  const submitted = Object.keys(s.answers).length;
  const counts: Record<string, number> = {};
  for (const v of Object.values(s.answers)) counts[v] = (counts[v] ?? 0) + 1;
  const correct = s.correctValue ? counts[s.correctValue] ?? 0 : 0;
  const options = round.question?.input === 'ox' ? ['O', 'X'] : (s.choices ?? []).map((_, i) => String(i));

  return (
    <section className="secret card">
      <div className="secret-label">
        🤫 비밀 정답지 <span className="muted">· {round.kindTitle} {round.number}번</span>
      </div>

      {hidden ? (
        <button
          type="button"
          className="btn peek"
          onPointerDown={() => setPeek(true)}
          onPointerUp={() => setPeek(false)}
          onPointerLeave={() => setPeek(false)}
        >
          👁 누르고 있는 동안 정답 보기
          <small>빔프로젝터 화면이라 기본으로 가려 뒀어요</small>
        </button>
      ) : (
        <>
          <div className="secret-q">{s.prompt}</div>
          {s.art && (
            <div className="secret-art">
              <ArtPreview svg={s.art} photo={s.artPhoto} />
              <small className="muted">전체 원본 {s.artPhoto ? '사진' : '그림'} · 전광판은 지금 {ZOOM_SCALE[round.zoom] * 100}% 로 보여 주는 중</small>
              {s.artPhoto && (
                <small className="muted">
                  📷 <a href={s.artPhoto.page} target="_blank" rel="noreferrer">{s.artPhoto.credit}</a>
                </small>
              )}
            </div>
          )}
          {s.lyrics && <div className="secret-lyrics">🗣 읽는 가사: “{s.lyrics}”</div>}
          {s.choices && (
            <ol className="secret-choices">
              {s.choices.map((c, i) => (
                <li key={i} className={String(i) === s.correctValue ? 'correct' : ''}>
                  {c}
                </li>
              ))}
            </ol>
          )}
          <div className="secret-answer">정답: {s.correctValue && OX_LABEL[s.correctValue] ? OX_LABEL[s.correctValue] : s.answer}</div>
          {s.accept?.length ? <div className="muted small">인정 답안: {s.accept.join(', ')}</div> : null}
          {s.explanation && <div className="secret-exp">💡 {s.explanation}</div>}
          {s.hint && <div className="muted small">힌트: {s.hint}</div>}
        </>
      )}

      {options.length > 0 && (
        <div className="tally">
          <div className="muted small">
            제출 {submitted}/{total}명 {!hidden && s.correctValue && `· 정답 ${correct}명`}
          </div>
          <div className="tally-bars">
            {options.map((o) => (
              <div key={o} className={!hidden && o === s.correctValue ? 'correct' : ''}>
                <span>{round.question?.input === 'ox' ? o : `${Number(o) + 1}번`}</span>
                <b>{counts[o] ?? 0}</b>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
