import { useEffect, useMemo, useRef, useState } from 'react';
import { useClient, statusText } from '../../net/useClient';
import { getIdentity } from '../../net/clientPeer';
import { load, save } from '../../lib/storage';
import { uid } from '../../lib/ids';
import { rankPlayers, rankTeams } from '../../game/selectors';
import { TEAM_COLORS, TEAM_IDS, type Player, type PublicView, type TeamId } from '../../types';
import { teamStyle } from '../../components/TeamChip';
import { TimerRing } from '../../components/TimerRing';

interface Profile {
  name: string;
  team: TeamId;
}

const CHOICE_COLORS = ['#ff5d73', '#4dabff', '#ffc94d', '#4ee0a1'];
const BOT_NAMES = ['P2P봇', '원격봇', '탭봇', '테스트봇', '로봇군', '자동봇'];

/**
 * 참가자 리모컨 (?room=방ID)
 * bot=true (?room=방ID&bot=1): 실제 PeerJS 로 접속해 자동으로 입장·버저·답 제출하는 테스트 봇
 */
export function PlayerRemote({ room, bot = false }: { room: string; bot?: boolean }) {
  const profileKey = `mtkit.profile.${room}`;
  // 봇은 탭마다 다른 참가자가 되도록 저장하지 않는 임시 신원 사용
  const identity = useMemo(() => (bot ? { clientId: `p-bot-${uid()}`, secret: uid() + uid() } : getIdentity()), [bot]);
  // 전광판이 알려주는 내 참가자 ID (다른 폰/브라우저에서 같은 닉네임으로 재입장하면 기존 참가자를 이어받음)
  const [you, setYou] = useState<string | null>(null);
  const myId = you ?? identity.clientId;
  const [view, setView] = useState<PublicView | null>(null);
  const [profile, setProfile] = useState<Profile | null>(() =>
    bot
      ? { name: `${BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)]}${Math.floor(Math.random() * 90 + 10)}`, team: TEAM_IDS[Math.floor(Math.random() * 4)] }
      : load<Profile>(profileKey),
  );
  const [editing, setEditing] = useState(false);
  const [pressedRound, setPressedRound] = useState(-1);
  const [myAnswer, setMyAnswer] = useState<{ qid: string; value: string } | null>(null);

  const { status, send } = useClient(
    room,
    'player',
    undefined,
    (m) => {
      if (m.type === 'WELCOME' && profile) {
        // 재접속 시 저장된 프로필로 자동 입장
        send({ type: 'JOIN', name: profile.name, team: profile.team });
      }
      if (m.type === 'STATE') {
        setView(m.view);
        if (m.you) setYou(m.you);
      }
    },
    identity,
  );

  const me = view?.players.find((p) => p.id === myId);

  const join = (p: Profile) => {
    if (!bot) save(profileKey, p);
    setProfile(p);
    setEditing(false);
    send({ type: 'JOIN', name: p.name, team: p.team });
  };

  const q = view?.round.question;
  const buzzIdx = me && view ? view.buzzer.order.findIndex((b) => b.playerId === me.id) : -1;
  const isOut = !!me && !!view?.buzzer.out.includes(me.id);
  const pressed = buzzIdx >= 0 || (!!view && pressedRound === view.buzzer.round);
  const canBuzz = !!view && view.buzzer.open && !pressed && !isOut && status.kind === 'connected';
  const canAnswer = !!q && view?.round.phase === 'live' && q.input !== 'buzzer' && status.kind === 'connected';
  const mine = myAnswer && q && myAnswer.qid === q.id ? myAnswer.value : null;

  const buzz = () => {
    if (!canBuzz || !view) return;
    navigator.vibrate?.(60);
    if (send({ type: 'BUZZ' })) setPressedRound(view.buzzer.round);
  };

  const answer = (value: string) => {
    if (!canAnswer || !q) return;
    navigator.vibrate?.(30);
    if (send({ type: 'SUBMIT', value })) setMyAnswer({ qid: q.id, value });
  };

  // ── 테스트 봇 자동 행동 ──
  // 상태 스냅샷이 올 때마다 effect 가 다시 돌기 때문에, 예약 타이머는 화면이 사라질 때만 정리
  const botDone = useRef(new Set<string>());
  const botTimers = useRef<number[]>([]);
  const latest = useRef({ answer, send });
  latest.current = { answer, send };
  useEffect(() => () => botTimers.current.forEach((t) => window.clearTimeout(t)), []);
  useEffect(() => {
    if (!bot || !view || !me) return;
    const buzzKey = `b${view.buzzer.round}`;
    if (canBuzz && !botDone.current.has(buzzKey)) {
      botDone.current.add(buzzKey);
      if (Math.random() < 0.7) botTimers.current.push(window.setTimeout(() => latest.current.send({ type: 'BUZZ' }), 500 + Math.random() * 2500));
    }
    const ansKey = `a${q?.id}`;
    if (canAnswer && q && !botDone.current.has(ansKey)) {
      botDone.current.add(ansKey);
      const opts = q.input === 'ox' ? ['O', 'X'] : (q.choices ?? []).map((_, i) => String(i));
      const v = opts[Math.floor(Math.random() * opts.length)];
      botTimers.current.push(window.setTimeout(() => latest.current.answer(v), 1000 + Math.random() * 4000));
    }
  }, [bot, view, me, canBuzz, canAnswer, q]);

  if (!room) {
    return (
      <div className="phone center">
        <div className="card">
          <h2>방 코드가 없어요</h2>
          <p>전광판의 <b>참가자 입장 QR</b>을 찍어 주세요.</p>
        </div>
      </div>
    );
  }

  const header = (
    <header className="phone-head">
      <div>
        <b>{bot ? '🤖 테스트 봇' : '🎤 MT MC 키트'}</b> <span className="muted">방 {room}</span>
      </div>
      <span className={`conn ${status.kind}`}>{status.kind === 'connected' ? '● 연결됨' : '연결 중…'}</span>
    </header>
  );

  if (status.kind === 'rejected') {
    return (
      <div className="phone">
        {header}
        <div className="card error">{status.reason}</div>
      </div>
    );
  }

  if (!view) {
    return (
      <div className="phone">
        {header}
        <div className="card center-text">
          <div className="spinner" />
          <p>{statusText(status)}</p>
        </div>
      </div>
    );
  }

  if (!me || editing) {
    return (
      <div className="phone">
        {header}
        <JoinForm view={view} initial={profile} onSubmit={join} onCancel={me ? () => setEditing(false) : undefined} />
      </div>
    );
  }

  const quizOn = !!view.round.kind && !!q;

  return (
    // 폰 세로: 위아래로 쌓임 / 폰 가로·태블릿: 왼쪽 내 정보 + 오른쪽 입력 (CSS 에서 배치)
    <div className="phone player" style={teamStyle(me.team)}>
      {header}
      <div className="p-layout">
      <aside className="p-side">
        <MeCard view={view} me={me} compact={quizOn} onEdit={() => setEditing(true)} />
        {view.podium && <div className="p-podium">🏆 순위 발표 중! 전광판을 보세요</div>}
      </aside>

      <div className="p-main">
      {quizOn && q ? (
        <section className="p-quiz">
          <div className="p-quiz-head">
            <div>
              <div className="muted small">
                {view.round.kindEmoji} {view.round.kindTitle} · {view.round.categoryName}
              </div>
              <b>{view.round.number}번 문제</b>
            </div>
            {q.input !== 'buzzer' && <TimerRing timer={view.timer} size={56} showPaused={view.round.phase === 'live'} />}
          </div>

          {view.round.phase === 'ready' ? (
            <div className="p-wait">곧 문제가 나와요 👀</div>
          ) : (
            <>
              {q.prompt && !q.isMusic && q.input !== 'buzzer' && <div className="p-prompt">{q.prompt}</div>}

              {q.input === 'buzzer' && (
                <Buzzer
                  open={view.buzzer.open}
                  pressed={pressed}
                  isOut={isOut}
                  buzzIdx={buzzIdx}
                  onPress={buzz}
                  disabled={!canBuzz && !pressed}
                  red={q.isZoom || q.isTts}
                  waitHint={
                    q.isMusic && view.round.phase === 'live'
                      ? '🎧 노래가 끝나면 버저가 열려요'
                      : q.isTts && view.round.phase === 'live'
                        ? '🤖 MC가 가사를 읽으면 버저가 열려요'
                        : undefined
                  }
                />
              )}

              {q.input === 'ox' && (
                <div className="p-ox">
                  {(['O', 'X'] as const).map((v) => (
                    <button
                      type="button"
                      key={v}
                      className={`${v} ${mine === v ? 'sel' : ''} ${resultClass(view, v)}`}
                      disabled={!canAnswer}
                      onClick={() => answer(v)}
                    >
                      {v === 'O' ? '⭕' : '❌'}
                    </button>
                  ))}
                </div>
              )}

              {q.input === 'choice' && (
                <div className="p-choice">
                  {q.choices?.map((c, i) => (
                    <button
                      type="button"
                      key={i}
                      className={`${mine === String(i) ? 'sel' : ''} ${resultClass(view, String(i))}`}
                      style={{ ['--c' as string]: CHOICE_COLORS[i] }}
                      disabled={!canAnswer}
                      onClick={() => answer(String(i))}
                    >
                      <span className="num">{i + 1}</span>
                      <span>{c}</span>
                    </button>
                  ))}
                </div>
              )}

              <ResultLine view={view} me={me} mine={mine} />
            </>
          )}
        </section>
      ) : (
        <Buzzer open={view.buzzer.open} pressed={pressed} isOut={isOut} buzzIdx={buzzIdx} onPress={buzz} disabled={!canBuzz && !pressed} />
      )}
      </div>
      </div>
    </div>
  );
}

function resultClass(view: PublicView, value: string) {
  const r = view.round.reveal;
  if (!r?.correctValue) return '';
  return r.correctValue === value ? 'correct' : 'dim-out';
}

function ResultLine({ view, me, mine }: { view: PublicView; me: Player; mine: string | null }) {
  const { round } = view;
  const q = round.question!;
  if (round.phase === 'revealed' && round.reveal) {
    if (q.input === 'buzzer') return <div className="p-result">정답: <b>{round.reveal.answer}</b></div>;
    const submitted = round.reveal.answers[me.id];
    const ok = submitted !== undefined && submitted === round.reveal.correctValue;
    // 4지선다 스피드 채점: 내 순위와 받은 점수
    const speed = round.reveal.speed;
    const myIdx = speed ? speed.order.findIndex((o) => o.playerId === me.id) : -1;
    const myMs = myIdx >= 0 ? speed!.order[myIdx].ms : null;
    const gain = !speed || !ok ? undefined : speed.mode === 'individual' ? speed.points[me.id] : speed.points[String(me.team)];
    return (
      <div className={`p-result ${ok ? 'ok' : 'no'}`}>
        {submitted === undefined ? '제출하지 않았어요' : ok ? '🎉 정답!' : '😢 오답'}
        {ok && speed && (
          <span className="p-speed">
            ⚡ {myIdx + 1}등{myMs !== null ? ` · ${(myMs / 1000).toFixed(2)}초` : ''}
            {gain !== undefined && ` · ${speed.mode === 'individual' ? '' : '우리 팀 '}+${gain}점`}
          </span>
        )}
        <small>정답: {round.reveal.answer}</small>
      </div>
    );
  }
  if (q.input === 'buzzer') return null;
  if (round.phase === 'closed') return <div className="p-result">⏰ 마감! 정답 공개를 기다려요</div>;
  const received = round.answeredIds.includes(me.id);
  return <div className="p-result muted">{mine ? (received ? '제출 완료 · 마감 전까지 바꿀 수 있어요' : '전송 중…') : '정답을 골라 주세요'}</div>;
}

function Buzzer({
  open,
  pressed,
  isOut,
  buzzIdx,
  onPress,
  disabled,
  waitHint,
  red,
}: {
  open: boolean;
  pressed: boolean;
  isOut: boolean;
  buzzIdx: number;
  onPress: () => void;
  disabled: boolean;
  /** 버저가 닫혀 있을 때 안내 문구 */
  waitHint?: string;
  /** 줌인·가사 퀴즈: 대형 빨간 [버저 누르기!] */
  red?: boolean;
}) {
  return (
    <button type="button" className={`buzzer ${red ? 'red' : ''} ${open && !isOut ? 'open' : ''} ${pressed ? 'pressed' : ''} ${isOut ? 'out' : ''}`} onPointerDown={onPress} disabled={disabled}>
      {isOut ? '이번 문제 기회 끝' : pressed ? (buzzIdx >= 0 ? `${buzzIdx + 1}번째로 눌렀어요!` : '전송 중…') : open ? (red ? '버저 누르기!' : '누르기!') : '대기 중'}
      <small>
        {isOut ? '다른 사람의 답을 기다려요' : open ? (pressed ? 'MC의 판정을 기다려요' : '가장 먼저 누르세요') : (waitHint ?? 'MC가 버저를 열면 누를 수 있어요')}
      </small>
    </button>
  );
}

function MeCard({ view, me, compact, onEdit }: { view: PublicView; me: Player; compact: boolean; onEdit: () => void }) {
  const myRank = rankPlayers(view.players).find((r) => r.item.id === me.id)?.rank;
  const myTeam = view.teams.find((t) => t.teamId === me.team)!;
  const teamRank = rankTeams(view.teams).find((r) => r.item.teamId === me.team)?.rank;
  return (
    <section className={`me-card ${compact ? 'compact' : ''}`}>
      <div className="me-name">
        {me.name}
        <span className="me-team"> · {myTeam.teamName}</span>
        <button type="button" className="link-btn" onClick={onEdit}>
          변경
        </button>
      </div>
      <div className="me-scores">
        <div className={view.mode === 'individual' ? 'active' : ''}>
          <small>내 개인 점수</small>
          <b>{me.personalScore}</b>
          <small>
            {myRank}위 / {view.players.length}명
          </small>
        </div>
        <div className={view.mode === 'team' ? 'active' : ''}>
          <small>우리 팀 점수</small>
          <b>{myTeam.teamScore}</b>
          <small>{teamRank}위 / 4팀</small>
        </div>
      </div>
      {!compact && (
        <div className="mode-note">
          지금은 <b>{view.mode === 'individual' ? '🙋 개인전' : '👥 팀전'}</b> 진행 중
        </div>
      )}
    </section>
  );
}

function JoinForm({
  view,
  initial,
  onSubmit,
  onCancel,
}: {
  view: PublicView;
  initial: Profile | null;
  onSubmit: (p: Profile) => void;
  onCancel?: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [team, setTeam] = useState<TeamId | null>(initial?.team ?? null);
  const ok = name.trim().length > 0 && team !== null;

  return (
    <form
      className="join card"
      onSubmit={(e) => {
        e.preventDefault();
        if (ok) onSubmit({ name: name.trim(), team: team! });
      }}
    >
      <h2>입장하기</h2>
      <p className="muted small">나갔다가 다시 들어왔다면 전과 <b>같은 닉네임</b>으로 입장하세요. 점수가 그대로 이어져요.</p>
      <label>
        닉네임
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={12} placeholder="최대 12자" autoFocus />
      </label>
      <div className="label">소속 팀</div>
      <div className="team-pick">
        {TEAM_IDS.map((t) => (
          <button
            type="button"
            key={t}
            className={team === t ? 'sel' : ''}
            style={{ ['--team' as string]: TEAM_COLORS[t] }}
            onClick={() => setTeam(t)}
          >
            {view.teams.find((x) => x.teamId === t)?.teamName ?? `${t}팀`}
            <small>{view.players.filter((p) => p.team === t).length}명</small>
          </button>
        ))}
      </div>
      <button type="submit" className="btn go big" disabled={!ok}>
        입장!
      </button>
      {onCancel && (
        <button type="button" className="btn ghost" onClick={onCancel}>
          취소
        </button>
      )}
    </form>
  );
}
