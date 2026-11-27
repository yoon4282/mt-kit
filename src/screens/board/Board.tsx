import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { createInitialState, gameReducer, resolvePlayerId, type GameAction } from '../../game/reducer';
import { toMcView, toPublicView } from '../../game/selectors';
import { scheduleBotAnswers, scheduleBotBuzzes } from '../../game/bots';
import { HostNet, type HostStatus } from '../../net/hostPeer';
import { newMcKey, newRoomId } from '../../lib/ids';
import { load, save } from '../../lib/storage';
import { defaultBaseUrl } from '../../lib/url';
import { findQuestion } from '../../data/quizzes';
import type { GameState } from '../../types';
import { QRCard } from '../../components/QRCard';
import { Leaderboard } from '../../components/Leaderboard';
import { ControlPanel } from '../../components/ControlPanel';
import { QuizControl } from '../../components/QuizControl';
import { SecretSheet } from '../../components/SecretSheet';
import { AwardToast } from '../../components/AwardToast';
import { Stage } from './Stage';
import { TtsSpeaker } from './TtsSpeaker';
import { BoardTools } from './BoardTools';
import { MusicPlayer } from './MusicPlayer';
import { Podium } from './Podium';
import { useBoardSounds } from './useBoardSounds';
import { setMuted, unlockAudio } from '../../audio/sfx';
import type { Media } from '../../data/quiz';

const SONG_KEY = 'mtkit.songOverrides';
export type SongOverrides = Record<string, Partial<Media>>;

const HOST_KEY = 'mtkit.host.v2';

/** 한 참가자를 조종하는 모든 기기 ID (원래 기기 + 재입장으로 이어받은 기기) */
function devicesOf(s: GameState, playerId: string): string[] {
  return [playerId, ...Object.entries(s.aliases).filter(([, pid]) => pid === playerId).map(([c]) => c)];
}
const BASE_KEY = 'mtkit.baseUrl';

interface HostSession {
  roomId: string;
  mcKey: string;
  state: GameState;
}

function freshSession(): HostSession {
  return { roomId: newRoomId(), mcKey: newMcKey(), state: createInitialState() };
}

/** 새로고침해도 방 ID·점수·진행 상황이 유지되도록 localStorage 에서 복원 */
function restoreSession(): HostSession {
  const saved = load<HostSession>(HOST_KEY) ?? load<HostSession>('mtkit.host.v1');
  if (!saved?.roomId || !saved.mcKey || !saved.state?.teams) return freshSession();
  const base = createInitialState();
  const s = saved.state;
  const players = Object.fromEntries(Object.entries(s.players ?? {}).map(([id, p]) => [id, { ...p, online: p.isBot }]));
  const timer = s.timer ?? base.timer;
  return {
    ...saved,
    state: {
      ...base,
      ...s,
      players,
      buzzer: { ...base.buzzer, ...s.buzzer, open: false },
      round: { ...base.round, ...s.round, phase: s.round?.phase === 'live' ? 'closed' : (s.round?.phase ?? 'ready') },
      // 새로고침하면 타이머는 일시정지 상태로
      timer: { ...timer, running: false, endsAt: null },
    },
  };
}

export function Board() {
  const [session, setSession] = useState(restoreSession);
  const [state, dispatch] = useReducer(gameReducer, session.state);
  const [status, setStatus] = useState<HostStatus>({ kind: 'starting' });
  const [counts, setCounts] = useState({ players: 0, mcs: 0 });
  const [panelOpen, setPanelOpen] = useState(true);
  const [showTools, setShowTools] = useState(false);
  const [showQr, setShowQr] = useState(true);
  const [showMcQr, setShowMcQr] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const [mute, setMute] = useState(() => load<boolean>('mtkit.mute') ?? false);
  const [songOverrides, setSongOverrides] = useState<SongOverrides>(() => load<SongOverrides>(SONG_KEY) ?? {});
  const [baseUrl, setBaseUrl] = useState(() => load<string>(BASE_KEY) || defaultBaseUrl());
  const netRef = useRef<HostNet | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const { roomId, mcKey } = session;

  // 상태 저장
  useEffect(() => save(HOST_KEY, { roomId, mcKey, state }), [roomId, mcKey, state]);
  useEffect(() => save(BASE_KEY, baseUrl === defaultBaseUrl() ? '' : baseUrl), [baseUrl]);
  useEffect(() => save(SONG_KEY, songOverrides), [songOverrides]);
  useEffect(() => {
    setMuted(mute);
    save('mtkit.mute', mute);
  }, [mute]);

  // 효과음
  useBoardSounds(state);

  /**
   * 재입장 판단: 처음 보는 기기가 기존 참가자와 같은 닉네임으로 들어오면 그 참가자를 이어받음.
   * 단, 그 참가자의 기기가 지금 실제로 쓰이는 중이면(동명이인) 새 참가자로 등록.
   */
  const findRejoinTarget = (clientId: string, name: string): string | undefined => {
    const s = stateRef.current;
    if (s.players[resolvePlayerId(s, clientId)]) return undefined; // 이미 아는 기기
    const norm = (v: string) => v.trim().toLowerCase().replace(/\s+/g, '');
    const target = Object.values(s.players).find(
      (p) =>
        !p.isBot &&
        norm(p.name) === norm(name) &&
        !devicesOf(s, p.id).some((c) => c !== clientId && netRef.current?.isActive(c)),
    );
    return target?.id;
  };

  // 호스트 Peer 생성 (방이 바뀌면 다시 생성)
  useEffect(() => {
    const net = new HostNet(roomId, mcKey, {
      onStatus: setStatus,
      onJoin: (id, name, team) => dispatch({ type: 'PLAYER_JOIN', id, name, team, at: Date.now(), claimId: findRejoinTarget(id, name) }),
      onBuzz: (playerId) => dispatch({ type: 'BUZZ', playerId, at: Date.now() }),
      onSubmit: (playerId, value) => dispatch({ type: 'SUBMIT', playerId, value, at: Date.now() }),
      onMcCommand: dispatch,
      onPresence: (id, online) => {
        // 같은 참가자를 조종하는 다른 기기가 아직 연결돼 있으면 오프라인 처리하지 않음
        if (!online) {
          const s = stateRef.current;
          const pid = resolvePlayerId(s, id);
          if (devicesOf(s, pid).some((c) => c !== id && netRef.current?.isConnected(c))) return;
        }
        dispatch({ type: 'PLAYER_PRESENCE', id, online });
      },
      onConnections: setCounts,
    });
    netRef.current = net;
    return () => {
      net.destroy();
      netRef.current = null;
    };
  }, [roomId, mcKey]);

  // 상태가 바뀔 때마다 폰들에게 스냅샷 전송
  const publicView = useMemo(() => toPublicView(state, roomId), [state, roomId]);
  const mcView = useMemo(() => toMcView(state, roomId), [state, roomId]);
  useEffect(() => {
    netRef.current?.broadcast(publicView, mcView, (clientId) => resolvePlayerId(stateRef.current, clientId));
  }, [publicView, mcView]);

  // 타이머 종료 (호스트 시계 기준으로 한 곳에서만 판정)
  useEffect(() => {
    const { running, endsAt } = state.timer;
    if (!running || !endsAt) return;
    const t = window.setTimeout(() => dispatch({ type: 'TIMER_EXPIRE' }), Math.max(0, endsAt - Date.now()));
    return () => window.clearTimeout(t);
  }, [state.timer.running, state.timer.endsAt]); // eslint-disable-line react-hooks/exhaustive-deps

  // 봇: 버저가 열리면 랜덤 시점에 버저 누르기
  useEffect(() => {
    if (!state.buzzer.open) return;
    return scheduleBotBuzzes(stateRef.current, dispatch);
  }, [state.buzzer.open, state.buzzer.round]);

  // 봇: O/X·4지선다 문제가 시작되면 답 제출
  const current = findQuestion(state.round.questionId)?.question;  useEffect(() => {
    if (state.round.phase !== 'live' || !current || current.input === 'buzzer') return;
    if (Object.keys(stateRef.current.round.answers).length) return; // 재개 시 중복 제출 방지
    const correct = current.input === 'ox' ? current.answer : String(current.answer);
    const options = current.input === 'ox' ? ['O', 'X'] : current.choices.map((_, i) => String(i));
    const limit = stateRef.current.timer.durationMs * 0.9;
    return scheduleBotAnswers(stateRef.current, correct, options, dispatch, 0.6, Math.max(1500, limit));
  }, [state.round.phase, current]);

  const dispatchMany = (actions: GameAction[]) => actions.forEach(dispatch);

  const newRoom = () => {
    const s = freshSession();
    setSession(s);
    dispatch({ type: 'LOAD', state: s.state });
  };

  const sep = baseUrl.includes('?') ? '&' : '?';
  const playerUrl = `${baseUrl}${sep}room=${roomId}`;
  const mcUrl = `${baseUrl}${sep}role=mc&room=${roomId}&key=${mcKey}`;
  const isLocalhost = (() => {
    try {
      return /^(localhost|127\.0\.0\.1|\[::1\])$/.test(new URL(baseUrl, location.href).hostname);
    } catch {
      return false;
    }
  })();

  const isMusicRound = state.round.kind === 'music';
  const baseMedia = current?.input === 'buzzer' ? current.media : undefined;
  const ov = current ? songOverrides[current.id] : undefined;
  // 곡 구간 조정 값이 있으면 덮어씀 (객체를 매번 새로 만들지 않도록 memo)
  const media = useMemo<Media | undefined>(() => {
    if (!baseMedia && !ov?.youtubeId) return undefined;
    return { youtubeId: ov?.youtubeId ?? baseMedia!.youtubeId, startSec: ov?.startSec ?? baseMedia?.startSec ?? 0 };
  }, [baseMedia, ov?.youtubeId, ov?.startSec]);

  return (
    <div className={`board ${panelOpen ? 'panel-open' : ''}`}>
      {!audioReady && (
        <button
          type="button"
          className="audio-gate"
          onClick={() => {
            unlockAudio();
            setAudioReady(true);
          }}
        >
          <span>🔊</span>
          <b>화면을 한 번 클릭해 주세요</b>
          <small>브라우저 정책상 클릭해야 음악·효과음이 재생돼요</small>
        </button>
      )}

      <header className="board-head">
        <div className="brand">🎤 MT MC 키트</div>
        <div className="room-code">
          방 코드 <b>{roomId}</b>
        </div>
        <div className={`mode-pill ${state.mode}`}>{state.mode === 'individual' ? '🙋 개인전' : '👥 팀전'}</div>
        <div className="net-status">
          <StatusDot status={status} />
          <span>참가자 {publicView.players.filter((p) => p.online).length}명</span>
          <span className={counts.mcs ? 'ok' : 'muted'}>{counts.mcs ? '📱 MC 연결됨' : 'MC 폰 미연결'}</span>
          <button type="button" className="btn ghost sm" onClick={() => setMute((v) => !v)} title="효과음 켜기/끄기">
            {mute ? '🔇 효과음 꺼짐' : '🔊 효과음'}
          </button>
          <button type="button" className="btn ghost sm" onClick={() => setShowQr((v) => !v)}>
            {showQr ? 'QR 숨기기' : 'QR 보기'}
          </button>
        </div>
      </header>

      <main className={`board-main ${showQr ? '' : 'no-qr'}`}>
        {showQr && (
          <aside className="qr-col">
            <QRCard
              title="참가자 입장"
              subtitle="폰 카메라로 스캔!"
              url={playerUrl}
              accent="#4ee0a1"
              share={{ title: '🎤 MT 레크리에이션 입장!', text: `링크를 눌러 닉네임과 팀을 고르고 입장하세요 (방 코드 ${roomId})` }}
            />
            {/* MC 폰이 연결되면 MC QR 은 숨김 (참가자가 찍지 않도록) */}
            {counts.mcs === 0 || showMcQr ? (
              <QRCard title="MC 리모컨" subtitle="MC 전용 · 공유 금지" url={mcUrl} accent="#ff8a5b" size={150} />
            ) : (
              <div className="mc-connected-card">
                <b>📱 MC 리모컨 연결됨</b>
                <button type="button" className="link-btn" onClick={() => setShowMcQr(true)}>
                  MC QR 다시 보기
                </button>
              </div>
            )}
            {counts.mcs > 0 && showMcQr && (
              <button type="button" className="btn ghost sm" onClick={() => setShowMcQr(false)}>
                MC QR 숨기기
              </button>
            )}
            {isLocalhost && (
              <p className="warn">
                ⚠ 지금 주소가 localhost 라서 폰에서 접속할 수 없어요. 노트북 네트워크 주소(예: http://192.168.x.x:5173)로 열거나 아래 패널의
                [도구 → QR 주소]를 바꿔 주세요.
              </p>
            )}
          </aside>
        )}

        <section className="stage-col">
          <Stage view={publicView} art={current?.input === 'buzzer' ? current.art : undefined} />
          {/* 음악 플레이어는 문제 단계가 바뀌어도 다시 만들어지지 않도록 고정 위치에 둠 */}
          {state.round.kind === 'tts' && state.round.questionId && (
            <TtsSpeaker
              lyrics={current?.input === 'buzzer' ? current.lyrics : undefined}
              tts={state.round.tts ?? { seq: 0, rate: 1 }}
              revealed={state.round.phase === 'revealed'}
            />
          )}
          {isMusicRound && (
            <MusicPlayer
              media={media}
              clip={state.round.clip}
              revealed={state.round.phase === 'revealed'}
              onClipEnd={(seq) => dispatch({ type: 'CLIP_ENDED', seq })}
            />
          )}
        </section>

        <section className="rank-col">
          <h2 className="col-title">{state.mode === 'individual' ? '개인 순위' : '팀 순위'}</h2>
          <Leaderboard view={publicView} limit={12} />
        </section>
      </main>

      <AwardToast view={publicView} />
      {state.podium && <Podium view={publicView} onClose={() => dispatch({ type: 'SHOW_PODIUM', on: false })} />}

      <div className={`drawer ${panelOpen ? 'open' : ''}`}>
        <div className="drawer-bar">
          <button type="button" className="drawer-handle" onClick={() => setPanelOpen((v) => !v)}>
            {panelOpen ? '▼ MC 컨트롤 접기' : '▲ MC 컨트롤 (노트북에서 직접 진행)'}
          </button>
          {panelOpen && (
            <button type="button" className={`btn sm ${showTools ? 'on' : 'ghost'}`} onClick={() => setShowTools((v) => !v)}>
              🛠 도구 (봇·팀 이름·초기화)
            </button>
          )}
        </div>
        {panelOpen && (
          <div className="drawer-body">
            <div className="drawer-col">
              <QuizControl view={mcView} send={dispatch} />
              <SecretSheet view={mcView} guarded />
            </div>
            <div className="drawer-col">
              {showTools ? (
                <BoardTools
                  state={state}
                  dispatch={dispatch}
                  dispatchMany={dispatchMany}
                  baseUrl={baseUrl}
                  setBaseUrl={setBaseUrl}
                  onNewRoom={newRoom}
                  playerUrl={playerUrl}
                  song={
                    isMusicRound && current?.input === 'buzzer'
                      ? {
                          id: current.id,
                          title: `${current.answer} — ${current.artist ?? ''}`,
                          media,
                          overridden: !!ov,
                          set: (o) => setSongOverrides((s) => ({ ...s, [current.id]: { ...s[current.id], ...o } })),
                          reset: () =>
                            setSongOverrides((s) => {
                              const n = { ...s };
                              delete n[current.id];
                              return n;
                            }),
                        }
                      : null
                  }
                />
              ) : (
                <ControlPanel view={mcView} send={dispatch} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: HostStatus }) {
  const label =
    status.kind === 'ready'
      ? '온라인'
      : status.kind === 'starting'
        ? '방 여는 중…'
        : status.kind === 'id-taken'
          ? `방 ID 확보 중… (${status.attempt})`
          : status.message;
  return (
    <span className={`status ${status.kind}`} title={label}>
      <span className="dot live" /> {label}
    </span>
  );
}
