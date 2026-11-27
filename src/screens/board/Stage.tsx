import type { PublicView } from '../../types';
import { TeamChip } from '../../components/TeamChip';
import { TimerRing } from '../../components/TimerRing';

const CHOICE_COLORS = ['#ff5d73', '#4dabff', '#ffc94d', '#4ee0a1'];

/** 전광판 중앙 무대 — 대기 / 문제 / 마감 / 정답 공개 (음악 플레이어는 Board 에서 고정 위치에 렌더) */
export function Stage({ view }: { view: PublicView }) {
  const { round } = view;
  if (!round.kind) return <FreeStage view={view} />;

  const header = (
    <div className="q-head">
      <span className="q-kind">
        {round.kindEmoji} {round.kindTitle}
      </span>
      <span className="q-cat">{round.categoryName}</span>
      {round.number > 0 && (
        <span className="q-num">
          {round.number} / {round.total}
        </span>
      )}
    </div>
  );

  const q = round.question;
  if (!q || round.phase === 'ready') {
    return (
      <div className="stage quiz">
        {header}
        <div className="stage-center">
          <div className="stage-emoji">{round.kindEmoji}</div>
          <h1>{q ? `${round.number}번 문제` : round.categoryName}</h1>
          <p>{q ? '곧 문제가 공개됩니다!' : 'MC가 문제를 고르는 중…'}</p>
        </div>
      </div>
    );
  }

  const revealed = round.phase === 'revealed' ? round.reveal : null;
  const counts: Record<string, number> = {};
  if (revealed) for (const v of Object.values(revealed.answers)) counts[v] = (counts[v] ?? 0) + 1;
  const answered = round.answeredIds.length;
  const total = view.players.length;

  return (
    <div className={`stage quiz phase-${round.phase}`}>
      {header}
      <div className="q-body">
        <div className="q-main">
          {q.input === 'buzzer' && !q.isMusic && (
            <div className={`q-prompt ${round.kind === 'chosung' ? 'chosung' : round.kind === 'emoji' ? 'emoji' : ''}`}>
              {round.kind === 'chosung'
                ? [...(q.prompt ?? '')].map((ch, i) => (ch === ' ' ? <span key={i} className="gap" /> : <span key={i} className="tile">{ch}</span>))
                : q.prompt}
            </div>
          )}
          {q.isMusic && <div className="q-prompt">{q.prompt}</div>}

          {q.input === 'ox' && (
            <>
              <div className="q-prompt text">{q.prompt}</div>
              <div className="ox-grid">
                {(['O', 'X'] as const).map((v) => (
                  <div key={v} className={`ox-cell ${v} ${revealed ? (revealed.correctValue === v ? 'correct' : 'wrong') : ''}`}>
                    <span>{v === 'O' ? '⭕' : '❌'}</span>
                    {revealed && <b>{counts[v] ?? 0}명</b>}
                  </div>
                ))}
              </div>
            </>
          )}

          {q.input === 'choice' && (
            <>
              <div className="q-prompt text">{q.prompt}</div>
              <div className="choice-grid">
                {q.choices?.map((c, i) => (
                  <div
                    key={i}
                    className={`choice-cell ${revealed ? (revealed.correctValue === String(i) ? 'correct' : 'wrong') : ''}`}
                    style={{ ['--c' as string]: CHOICE_COLORS[i] }}
                  >
                    <span className="num">{i + 1}</span>
                    <span className="txt">{c}</span>
                    {revealed && <b>{counts[String(i)] ?? 0}명</b>}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <aside className="q-side">
          {q.input !== 'buzzer' && <TimerRing timer={view.timer} size={150} showPaused={round.phase === 'live'} />}
          {round.phase === 'closed' && <div className="closed-badge">⏰ 마감!</div>}
          {q.input !== 'buzzer' && !revealed && (
            <div className="answered">
              제출 <b>{answered}</b> / {total}
            </div>
          )}
          {q.input === 'buzzer' && <BuzzList view={view} />}
        </aside>
      </div>

      {revealed && (
        <div className="reveal-banner">
          <div className="reveal-answer">정답: {revealed.answer}</div>
          {revealed.explanation && <div className="reveal-exp">💡 {revealed.explanation}</div>}
        </div>
      )}
      {revealed?.speed && <SpeedBoard view={view} />}
    </div>
  );
}

/** 4지선다 스피드 채점 결과: 빨리 맞힌 순서와 받은 점수 */
function SpeedBoard({ view }: { view: PublicView }) {
  const speed = view.round.reveal!.speed!;
  if (!speed.order.length) return <div className="speed-board empty">이번 문제는 정답자가 없어요 😢</div>;
  const seenTeams = new Set<number>();
  const rows = speed.order
    .map((o) => ({ ...o, player: view.players.find((p) => p.id === o.playerId) }))
    .filter((o) => o.player)
    .map((o) => {
      // 팀전은 팀에서 가장 빠른 한 명에게만 팀 점수 표시
      let pts: number | undefined;
      if (speed.mode === 'individual') pts = speed.points[o.playerId];
      else if (!seenTeams.has(o.player!.team)) {
        seenTeams.add(o.player!.team);
        pts = speed.points[String(o.player!.team)];
      }
      return { ...o, pts };
    });
  return (
    <div className="speed-board">
      <div className="speed-title">⚡ 스피드 정답 순위 <small>({speed.mode === 'individual' ? '개인' : '팀'} 점수 자동 반영)</small></div>
      <ol>
        {rows.slice(0, 8).map((r, i) => (
          <li key={r.playerId} className={i === 0 ? 'first' : ''}>
            <span className="rank">{i + 1}</span>
            <span className="who">{r.player!.name}</span>
            <TeamChip team={r.player!.team} />
            {r.ms !== null && <small>{(r.ms / 1000).toFixed(2)}초</small>}
            {r.pts !== undefined && <b>+{r.pts}</b>}
          </li>
        ))}
      </ol>
      {rows.length > 8 && <div className="muted small">외 {rows.length - 8}명</div>}
    </div>
  );
}

/** 버저 순서 (문제 화면 사이드) */
function BuzzList({ view }: { view: PublicView }) {
  const order = view.buzzer.order
    .map((b) => ({ ...b, player: view.players.find((p) => p.id === b.playerId) }))
    .filter((b) => b.player);
  if (!order.length) {
    const musicWait = view.round.kind === 'music' && view.round.phase === 'live' && !view.buzzer.open;
    return <div className="answered">{view.buzzer.open ? '🔔 버저 오픈!' : musicWait ? '🎧 노래가 끝나면 버저가 열려요' : '버저 대기'}</div>;
  }
  const [first, ...rest] = order;
  return (
    <div className="side-buzz">
      <div className="side-first">
        <small>1등</small>
        <b>{first.player!.name}</b>
        <TeamChip team={first.player!.team} />
      </div>
      {rest.slice(0, 4).map((b, i) => (
        <div key={b.playerId} className="side-rest">
          {i + 2}. {b.player!.name} <small>+{((b.at - first.at) / 1000).toFixed(2)}s</small>
        </div>
      ))}
    </div>
  );
}

/** 퀴즈가 없을 때: 대기 화면 / 자유 버저 */
function FreeStage({ view }: { view: PublicView }) {
  const { buzzer } = view;
  const order = buzzer.order
    .map((b) => ({ ...b, player: view.players.find((p) => p.id === b.playerId) }))
    .filter((b) => b.player);

  if (!buzzer.open && !order.length) {
    return (
      <div className="stage idle">
        <div className="stage-emoji">🎉</div>
        <h1>MT 레크리에이션</h1>
        <p>QR 코드를 찍고 닉네임과 팀을 골라 입장하세요!</p>
        <div className="team-count">
          {view.teams.map((t) => (
            <div key={t.teamId}>
              <TeamChip team={t.teamId} label={t.teamName} />
              <b>{view.players.filter((p) => p.team === t.teamId).length}명</b>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const [first, ...rest] = order;
  return (
    <div className={`stage buzz ${buzzer.open ? 'open' : 'locked'}`}>
      <div className="buzz-state">{buzzer.open ? '🔔 버저 오픈! 지금 누르세요!' : '🔒 버저 잠김'}</div>
      {first ? (
        <>
          <div className="buzz-first">
            <span className="label">1등</span>
            <span className="who">{first.player!.name}</span>
            <TeamChip team={first.player!.team} />
          </div>
          {rest.length > 0 && (
            <ol className="buzz-rest" start={2}>
              {rest.slice(0, 6).map((b) => (
                <li key={b.playerId}>
                  {b.player!.name} <TeamChip team={b.player!.team} />
                  <small>+{((b.at - first.at) / 1000).toFixed(2)}초</small>
                </li>
              ))}
            </ol>
          )}
        </>
      ) : (
        <div className="buzz-wait">누가 먼저 누를까요?</div>
      )}
    </div>
  );
}
