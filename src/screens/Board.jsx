// 전광판(호스트) 화면: 기본 URL. 상태의 권위자 + PeerJS 허브 + 하단 접이식 MC 패널.
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { reducer, makeInitialState, rankPlayers } from '../core/game.js';
import { genRoom, genId, appUrl, useNow, fmtSec, TEAM_COLORS } from '../core/util.js';
import { createHost } from '../net/host.js';
import { createBots } from '../bots/bots.js';
import { getQuiz, CATEGORIES } from '../data/quizzes.js';
import { playSfx, playMelody, unlockAudio, audioReady } from '../audio/sfx.js';
import { playClip, stopYouTube } from '../audio/youtube.js';
import Scoreboard, { TeamBadge } from '../components/Scoreboard.jsx';
import McConsole from '../components/McConsole.jsx';

function loadSession() {
  let room = localStorage.getItem('mt-room');
  if (!room) {
    room = genRoom();
    localStorage.setItem('mt-room', room);
  }
  let mcKey = localStorage.getItem('mt-mckey');
  if (!mcKey) {
    mcKey = genId('k').slice(2);
    localStorage.setItem('mt-mckey', mcKey);
  }
  let st = makeInitialState();
  try {
    const raw = localStorage.getItem(`mt-state-${room}`);
    if (raw) st = { ...st, ...JSON.parse(raw) };
  } catch { /* 손상된 저장값 무시 */ }
  return { room, mcKey, st };
}

function createStore(initial) {
  let st = initial;
  const subs = new Set();
  return {
    get: () => st,
    dispatch(a) {
      const n = reducer(st, a);
      if (n !== st) {
        st = n;
        subs.forEach((f) => f());
      }
    },
    subscribe(f) {
      subs.add(f);
      return () => subs.delete(f);
    },
  };
}

export default function Board() {
  const session = useMemo(loadSession, []);
  const { room, mcKey } = session;
  const store = useMemo(() => createStore(session.st), [session]);
  const state = useSyncExternalStore(store.subscribe, store.get);
  const dispatch = store.dispatch;

  const [net, setNet] = useState({ online: false, players: 0, mc: false, error: null });
  const [audioOn, setAudioOn] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [songStatus, setSongStatus] = useState('');
  const hostRef = useRef(null);
  const botsRef = useRef(null);
  const seen = useRef({ fx: state.fx.n, play: state.play.n });
  const lastDur = useRef(1000);

  // PeerJS 호스트 + 봇
  useEffect(() => {
    const bots = createBots(dispatch, store.get);
    bots.adopt(store.get().players);
    botsRef.current = bots;
    const host = createHost({ room, mcKey, getState: store.get, dispatch, onStatus: (s) => setNet((n) => ({ ...n, ...s })) });
    hostRef.current = host;
    const tick = setInterval(() => dispatch({ type: 'TICK', now: Date.now() }), 250);
    return () => {
      clearInterval(tick);
      host.destroy();
    };
  }, [room, mcKey, dispatch, store]);

  // 상태 변경 → 전파 / 봇 / 저장
  useEffect(() => {
    hostRef.current && hostRef.current.broadcast();
    botsRef.current && botsRef.current.onState();
    const id = setTimeout(() => {
      try { localStorage.setItem(`mt-state-${room}`, JSON.stringify(state)); } catch { /* ignore */ }
    }, 300);
    return () => clearTimeout(id);
  }, [state, room]);

  // 효과음 이벤트
  useEffect(() => {
    if (state.fx.n !== seen.current.fx) {
      seen.current.fx = state.fx.n;
      if (state.fx.id) {
        if (state.fx.id === 'drum') { /* 긴 소리는 그대로 */ }
        playSfx(state.fx.id);
      }
    }
  }, [state.fx]);

  // 노래 재생 명령 (YouTube 숨김 재생 → 실패 시 오프라인 멜로디)
  useEffect(() => {
    if (state.play.n === seen.current.play) return;
    seen.current.play = state.play.n;
    const quiz = state.q ? getQuiz(state.q.qid) : null;
    const kind = state.play.kind;
    if (kind === 'stop' || !quiz || quiz.category !== 'song') {
      stopYouTube();
      setSongStatus('');
      return;
    }
    if (kind === 'melody') {
      stopYouTube();
      setSongStatus('🎹 오프라인 멜로디 재생');
      playMelody(quiz.notes);
      return;
    }
    const dur = kind === 's1' ? 1000 : kind === 's3' ? 3000 : lastDur.current;
    lastDur.current = dur;
    setSongStatus(`▶ ${dur / 1000}초 재생 중…`);
    playClip(quiz.youtubeId, quiz.startSec, dur)
      .then(() => setSongStatus(`⏸ ${dur / 1000}초 재생 후 정지`))
      .catch((e) => {
        if (e && e.message === '취소됨') return;
        setSongStatus('⚠ YouTube 재생 불가 → 오프라인 멜로디로 대체');
        playMelody(quiz.notes);
      });
  }, [state.play, state.q]);

  const enableAudio = async () => setAudioOn(await unlockAudio());
  useEffect(() => { setAudioOn(audioReady()); }, []);

  const joinUrl = appUrl({ room });
  const mcUrl = appUrl({ role: 'mc', room, key: mcKey });
  const newRoom = () => {
    if (!window.confirm('새 방을 만들면 현재 점수와 참가자가 초기화됩니다. 계속할까요?')) return;
    localStorage.removeItem('mt-room');
    localStorage.removeItem(`mt-state-${room}`);
    window.location.reload();
  };

  const cat = state.q?.category;
  const quiz = state.q ? getQuiz(state.q.qid) : null;

  return (
    <div className="board">
      <header className="board-head">
        <h1>🎤 MT 레크 MC 키트</h1>
        <div className="head-info">
          <span className={`pill ${net.online ? 'on' : 'off'}`}>{net.online ? '● 서버 연결됨' : net.error === 'retrying' ? '재연결 중…' : '○ 연결 안 됨'}</span>
          <span className="pill">방 {room}</span>
          <span className="pill">👥 {Object.keys(state.players).length}명 (폰 {net.players})</span>
          <span className={`pill ${net.mc ? 'on' : ''}`}>📱 MC {net.mc ? '연결됨' : '미연결'}</span>
          <span className="pill mode">{state.mode === 'team' ? '팀전' : '개인전'}</span>
          {!audioOn && <button className="sound-on" onClick={enableAudio}>🔊 소리 켜기 (클릭!)</button>}
        </div>
      </header>
      {['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname) && (
        <div className="alert warn">
          ⚠ 지금 <b>localhost</b> 로 열려 있어 QR 을 폰으로 스캔해도 접속되지 않습니다.
          배포 주소(https://…github.io/mt-kit/)로 여세요. (개발 중이면 같은 와이파이의 <code>http://PC의_IP:5173</code>)
        </div>
      )}
      {net.error && net.error !== 'retrying' && (
        <div className="alert">
          네트워크 오류: {net.error === 'unavailable-id' ? '같은 방 코드가 다른 창에서 사용 중입니다.' : net.error}
          <button onClick={newRoom}>새 방 만들기</button>
          <span className="muted"> (오프라인에서도 아래 MC 패널과 봇으로 시연은 가능합니다)</span>
        </div>
      )}

      <main className="board-main">
        <section className="stage">
          {!quiz && <Lobby state={state} joinUrl={joinUrl} mcUrl={mcUrl} mcKey={mcKey} />}
          {quiz && <QuestionStage state={state} quiz={quiz} cat={cat} songStatus={songStatus} />}
        </section>
        <aside className="side">
          {quiz && (
            <div className="card qr-mini">
              <QRCodeSVG value={joinUrl} size={110} marginSize={1} />
              <div><b>참가 QR</b><br /><small>방 {room}</small></div>
            </div>
          )}
          <Scoreboard state={state} limit={10} />
        </aside>
      </main>

      <div className={`mc-panel ${panelOpen ? 'open' : ''}`}>
        <button className="panel-toggle" onClick={() => setPanelOpen(!panelOpen)}>
          {panelOpen ? '▼ MC 패널 접기' : '▲ MC 패널 열기 (노트북 직접 조작 · 봇)'}
        </button>
        {panelOpen && (
          <div className="panel-body">
            <div className="bot-bar">
              <button onClick={() => botsRef.current.add(8)}>🤖 가짜 참가자 +8</button>
              <button onClick={() => botsRef.current.clearAll()}>봇 모두 제거</button>
              <details>
                <summary>📱 MC 폰 연결 QR</summary>
                <div className="mc-qr"><QRCodeSVG value={mcUrl} size={150} marginSize={1} /><small>{mcUrl}</small></div>
              </details>
              <button className="danger" onClick={newRoom}>새 방</button>
            </div>
            <McConsole state={state} send={dispatch} secretDefault={false} localSound />
          </div>
        )}
      </div>
    </div>
  );
}

function Lobby({ state, joinUrl, mcUrl, mcKey }) {
  const players = rankPlayers(state);
  return (
    <div className="lobby">
      <h2>📲 QR 로 입장하세요!</h2>
      <div className="qr-row">
        <div className="qr-card join">
          <QRCodeSVG value={joinUrl} size={260} marginSize={2} />
          <h3>참가자 입장</h3>
          <p>닉네임 + 팀(1~4팀) 선택</p>
        </div>
        <div className="qr-card mc">
          <QRCodeSVG value={mcUrl} size={170} marginSize={2} />
          <h3>MC 리모컨 연결</h3>
          <p>MC 폰으로만 스캔 · 코드 <b>{mcKey}</b></p>
        </div>
      </div>
      <div className="chips">
        {players.length === 0 && <span className="muted">아직 아무도 없어요. 하단 MC 패널의 [🤖 가짜 참가자]로 바로 시연할 수 있어요.</span>}
        {players.map((p) => (
          <span key={p.id} className="chip" style={{ borderColor: TEAM_COLORS[p.team] }}>{p.name} <TeamBadge team={p.team} /></span>
        ))}
      </div>
    </div>
  );
}

function BigTimer({ endsAt, label }) {
  const now = useNow(200);
  const left = fmtSec(endsAt - now);
  return <div className={`big-timer ${left <= 5 ? 'danger' : ''}`}>{label} {left}</div>;
}

function BuzzBoard({ state }) {
  const name = (pid) => state.players[pid]?.name || '?';
  const tm = (pid) => state.players[pid]?.team;
  return (
    <div className="buzz-board">
      {state.buzz.slice(0, 3).map((b, i) => (
        <div key={b.pid} className={`buzz-item r${i} ${b.status}`}>
          <span className="medal">{['🥇', '🥈', '🥉'][i]}</span>
          <span className="who">{state.mode === 'team' ? `${tm(b.pid)}팀` : name(b.pid)}</span>
          {state.mode !== 'team' && <TeamBadge team={tm(b.pid)} />}
          {b.status === 'right' && <b className="ok-t">정답!</b>}
          {b.status === 'wrong' && <b className="ng-t">오답</b>}
        </div>
      ))}
      {state.buzz.length > 3 && <div className="muted">… 외 {state.buzz.length - 3}명 버저</div>}
      {state.buzz.length === 0 && state.buzzOpen && <div className="buzz-wait">🔴 버저 대기 중…</div>}
    </div>
  );
}

function QuestionStage({ state, quiz, cat, songStatus }) {
  const meta = CATEGORIES.find((c) => c.key === cat);
  return (
    <div className="qstage">
      <div className="q-tag">{meta.icon} {meta.label} <small>{state.mode === 'team' ? '팀전' : '개인전'}</small></div>
      {state.timer && <BigTimer endsAt={state.timer.endsAt} label="⏱" />}

      {cat === 'song' && (
        <>
          <div className="q-main song">{state.revealed ? <>🎶 {quiz.title}<small>{quiz.artist}</small></> : '🎵 이 노래는?'}</div>
          {state.hintShown && !state.revealed && <div className="q-hint">💡 {quiz.hint}</div>}
          <BuzzBoard state={state} />
          {songStatus && <div className="song-status">{songStatus}</div>}
        </>
      )}
      {cat === 'typing' && (
        <>
          <div className="q-topic">주제: {quiz.topic}</div>
          <div className={`q-main typing ${quiz.kind}`}>{quiz.prompt}</div>
          <div className="q-sub">{state.inputOpen ? '📱 폰에 정답을 입력해 제출하세요!' : '제출 마감'} · 제출 {Object.keys(state.answers).length}명</div>
          {state.revealed && <div className="q-answer">정답: {quiz.answers[0]}</div>}
        </>
      )}
      {cat === 'buzz' && (
        <>
          <div className="q-main text">{quiz.question}</div>
          <BuzzBoard state={state} />
          {state.revealed && <div className="q-answer">정답: {quiz.answers[0]}</div>}
        </>
      )}
      {cat === 'speed' && <SpeedStage state={state} quiz={quiz} />}
    </div>
  );
}

function SpeedStage({ state, quiz }) {
  const sp = state.speed;
  if (!sp) {
    return (
      <>
        <div className="q-topic">주제</div>
        <div className="q-main text">{quiz.topic}</div>
        <div className="q-sub">몸으로 말해요! 도전자가 정해지면 시작합니다 ({quiz.seconds}초)</div>
      </>
    );
  }
  const who = sp.who.teamId ? `${sp.who.teamId}팀` : state.players[sp.who.pid]?.name;
  return (
    <>
      <div className="q-topic" style={{ color: sp.who.teamId ? TEAM_COLORS[sp.who.teamId] : undefined }}>{who} 도전! · {quiz.topic}</div>
      {sp.running ? (
        <>
          <BigTimer endsAt={sp.endsAt} label="⏱" />
          <div className="q-main speed">{quiz.words[sp.idx]}</div>
        </>
      ) : <div className="q-main text">⏹ 종료!</div>}
      <div className="speed-count">통과 <b>{sp.correct}</b>개 <small>패스 {sp.passed}</small></div>
    </>
  );
}
