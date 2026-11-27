import { useEffect, useMemo, useState } from 'react';
import type { McAction } from '../game/reducer';
import { correctPlayerIds, describeAward } from '../game/selectors';
import { TTS_HINT_SCORES } from '../data/quiz';
import type { McView, Mode } from '../types';
import { TeamChip, teamStyle } from './TeamChip';

const PRESETS = [10, 20, 30, 50, -10];
const ZOOM_PCT = { 1: 400, 2: 200, 3: 100 } as const;

interface Props {
  view: McView;
  send: (a: McAction) => void;
  /** 폰 화면용 세로 배치 */
  compact?: boolean;
}

/**
 * MC 컨트롤 패널 — 전광판 하단 접이식 패널과 MC 폰 리모컨이 "같은 컴포넌트"를 사용.
 * 차이는 send 뿐: 전광판은 dispatch 직접 호출, 폰은 PeerJS 로 MC_CMD 전송.
 */
export function ControlPanel({ view, send, compact }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [custom, setCustom] = useState('');

  // 모드가 바뀌면 선택 초기화 (개인 ID 와 팀 ID 가 섞이지 않게)
  useEffect(() => setSelected([]), [view.mode]);

  // 나간 참가자는 선택에서 제거
  useEffect(() => {
    if (view.mode !== 'individual') return;
    setSelected((s) => s.filter((id) => view.players.some((p) => p.id === id)));
  }, [view.players, view.mode]);

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const award = (points: number) => {
    if (!selected.length || !Number.isFinite(points) || points === 0) return;
    send({ type: 'AWARD', targetIds: selected, points });
    setSelected([]);
    setCustom('');
  };

  const setMode = (mode: Mode) => send({ type: 'SET_MODE', mode });

  // 줌인 퀴즈: 확대 단계별 권장 배점 (400% +30 → 200% +20 → 100% +10) 을 프리셋에서 강조
  // 가사 낭독 퀴즈도 같은 방식: 힌트 없음 +30 → 가수 공개 +20 → 제목 초성 +10
  const stepLive = !!view.round.question && view.round.phase !== 'ready' && view.round.phase !== 'revealed';
  const zoomLive = stepLive && view.round.kind === 'zoom';
  const ttsLive = stepLive && (view.round.kind === 'tts' || view.round.kind === 'music');
  const suggest = zoomLive ? ([30, 20, 10] as const)[view.round.zoom - 1] : ttsLive ? TTS_HINT_SCORES[view.round.ttsHint - 1] : null;

  const buzzOrder = view.buzzer.order;
  const firstBuzzer = buzzOrder[0];
  const firstBuzzTarget = useMemo(() => {
    if (!firstBuzzer) return null;
    const p = view.players.find((x) => x.id === firstBuzzer.playerId);
    if (!p) return null;
    return view.mode === 'individual' ? p.id : String(p.team);
  }, [firstBuzzer, view.players, view.mode]);

  // O/X·4지선다: 정답자(개인전) 또는 정답자가 있는 팀(팀전)
  const correctTargets = useMemo(() => {
    // 4지선다는 정답 공개 때 스피드 순으로 자동 채점되므로 중복 부여 방지
    if (view.round.question?.input === 'choice') return [];
    const ids = correctPlayerIds(view);
    if (view.mode === 'individual') return ids.filter((id) => view.players.some((p) => p.id === id));
    return [...new Set(ids.map((id) => view.players.find((p) => p.id === id)?.team).filter(Boolean).map(String))];
  }, [view]);

  const playersSorted = useMemo(() => {
    // 버저 누른 사람을 앞으로, 그 다음 팀/입장 순
    const rank = new Map(buzzOrder.map((b, i) => [b.playerId, i]));
    return [...view.players].sort(
      (a, b) => (rank.get(a.id) ?? 999) - (rank.get(b.id) ?? 999) || a.team - b.team || a.joinedAt - b.joinedAt,
    );
  }, [view.players, buzzOrder]);

  return (
    <div className={`control ${compact ? 'compact' : ''}`}>
      {/* ① 모드 전환 */}
      <section className="ctl-section">
        <div className="seg">
          <button type="button" className={view.mode === 'individual' ? 'on' : ''} onClick={() => setMode('individual')}>
            🙋 개인전
          </button>
          <button type="button" className={view.mode === 'team' ? 'on' : ''} onClick={() => setMode('team')}>
            👥 팀전
          </button>
        </div>
        <button type="button" className={`btn sm ${view.podium ? 'on' : ''}`} onClick={() => send({ type: 'SHOW_PODIUM', on: !view.podium })}>
          {view.podium ? '🏆 순위 발표 닫기' : `🏆 ${view.mode === 'individual' ? '개인' : '팀'} 순위 발표`}
        </button>
      </section>

      {/* ② 버저 */}
      <section className="ctl-section">
        <h4>
          버저 <span className={`dot ${view.buzzer.open ? 'live' : ''}`} /> {view.buzzer.open ? '열림' : '닫힘'}
        </h4>
        <div className="row">
          <button type="button" className="btn go" onClick={() => send({ type: 'BUZZER_OPEN' })}>
            {view.buzzer.open ? '다시 열기' : '버저 열기'}
          </button>
          <button type="button" className="btn" onClick={() => send({ type: 'BUZZER_LOCK' })} disabled={!view.buzzer.open}>
            잠금
          </button>
          <button type="button" className="btn ghost" onClick={() => send({ type: 'BUZZER_RESET' })} disabled={!buzzOrder.length}>
            순서 지우기
          </button>
        </div>
        {buzzOrder.length > 0 && (
          <button type="button" className="btn danger sm" onClick={() => send({ type: 'BUZZ_WRONG' })} title="1등을 제외하고 다음 사람에게 기회">
            ❌ 1등 오답 → 다음 순서
          </button>
        )}
        {buzzOrder.length > 0 && (
          <ol className="buzz-mini">
            {buzzOrder.slice(0, 5).map((b, i) => {
              const p = view.players.find((x) => x.id === b.playerId);
              if (!p) return null;
              return (
                <li key={b.playerId}>
                  <b>{i + 1}</b> {p.name} <TeamChip team={p.team} />
                  {i > 0 && <small>+{((b.at - buzzOrder[0].at) / 1000).toFixed(2)}초</small>}
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {/* ③ 점수 부여 대상 */}
      <section className="ctl-section grow">
        <h4>
          {view.mode === 'individual' ? '개인 점수 부여' : '팀 점수 부여'}
          <span className="muted"> · 대상 {selected.length}개 선택</span>
          {firstBuzzTarget && (
            <button type="button" className="link-btn" onClick={() => setSelected([firstBuzzTarget])}>
              버저 1등 선택
            </button>
          )}
          {correctTargets.length > 0 && (
            <button type="button" className="link-btn" onClick={() => setSelected(correctTargets)}>
              정답자 전원 선택({correctTargets.length})
            </button>
          )}
          {selected.length > 0 && (
            <button type="button" className="link-btn" onClick={() => setSelected([])}>
              선택 해제
            </button>
          )}
        </h4>

        {view.mode === 'team' ? (
          <div className="target-grid teams">
            {view.teams.map((t) => (
              <button
                type="button"
                key={t.teamId}
                className={`target team ${selected.includes(String(t.teamId)) ? 'sel' : ''}`}
                style={teamStyle(t.teamId)}
                onClick={() => toggle(String(t.teamId))}
              >
                <span>{t.teamName}</span>
                <b>{t.teamScore}</b>
              </button>
            ))}
          </div>
        ) : view.players.length === 0 ? (
          <p className="empty">참가자가 입장하면 여기에 표시돼요.</p>
        ) : (
          <div className="target-grid">
            {playersSorted.map((p) => (
              <button
                type="button"
                key={p.id}
                className={`target ${selected.includes(p.id) ? 'sel' : ''} ${p.online ? '' : 'offline'}`}
                style={teamStyle(p.team)}
                onClick={() => toggle(p.id)}
              >
                <span>{p.name}</span>
                <b>{p.personalScore}</b>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ④ 배점 */}
      <section className="ctl-section">
        <div className="presets">
          {PRESETS.map((pt) => (
            <button
              type="button"
              key={pt}
              className={`btn preset ${pt < 0 ? 'minus' : ''} ${pt === suggest ? 'suggest' : ''}`}
              disabled={!selected.length}
              onClick={() => award(pt)}
            >
              {pt > 0 ? `+${pt}` : pt}
            </button>
          ))}
        </div>
        <form
          className="row custom"
          onSubmit={(e) => {
            e.preventDefault();
            award(Number(custom));
          }}
        >
          <input
            type="number"
            inputMode="numeric"
            placeholder="직접 입력 (예: 100, -5)"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
          />
          <button type="submit" className="btn go" disabled={!selected.length || !custom || Number(custom) === 0}>
            부여
          </button>
        </form>
        {suggest !== null && zoomLive && <p className="hint">🔍 줌인 {view.round.zoom}단계({ZOOM_PCT[view.round.zoom]}%) 권장 배점: <b>+{suggest}점</b></p>}
        {suggest !== null && ttsLive && <p className="hint">💡 {view.round.kind === 'music' ? '음악' : '가사 낭독'} 힌트 {view.round.ttsHint}단계 권장 배점: <b>+{suggest}점</b></p>}
        {!selected.length && <p className="hint">위에서 {view.mode === 'individual' ? '참가자' : '팀'}를 먼저 선택하세요 (여러 명 동시 선택 가능)</p>}
        <div className="row undo-row">
          <button type="button" className="btn ghost" disabled={!view.canUndo} onClick={() => send({ type: 'UNDO' })}>
            ↩ 되돌리기
          </button>
          {view.lastAward && <span className="muted small">최근: {describeAward(view, view.lastAward)}</span>}
        </div>
      </section>
    </div>
  );
}
