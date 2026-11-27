// 참가자 폰 (?room=ID): 닉네임/팀 선택 → 텍스트 제출 또는 대형 버저
import { useEffect, useRef, useState } from 'react';
import { createClient } from '../net/client.js';
import { genId, useNow, fmtSec, TEAM_COLORS } from '../core/util.js';

const loadMe = (room) => {
  try { return JSON.parse(localStorage.getItem(`mt-me-${room}`)) || null; } catch { return null; }
};

export default function Player({ room }) {
  const [me, setMe] = useState(() => loadMe(room));
  const [name, setName] = useState('');
  const [team, setTeam] = useState(1);
  const [view, setView] = useState(null);
  const [offset, setOffset] = useState(0);
  const [conn, setConn] = useState({ connected: false });
  const [text, setText] = useState('');
  const clientRef = useRef(null);
  const now = useNow(250, offset);

  useEffect(() => {
    if (!me) return undefined;
    const c = createClient({
      room,
      hello: () => ({ t: 'JOIN', id: me.id, name: me.name, team: me.team }),
      onStatus: setConn,
      onMessage: (m) => {
        if (m.t === 'STATE' && m.view) {
          setView(m.view);
          setOffset(m.now - Date.now());
        }
      },
    });
    clientRef.current = c;
    return () => c.destroy();
  }, [room, me]);

  // 문제가 바뀌면 입력창 비우기
  useEffect(() => { setText(''); }, [view?.nonce]);

  const join = () => {
    const m = { id: loadMe(room)?.id || genId('p'), name: name.trim() || '익명', team };
    localStorage.setItem(`mt-me-${room}`, JSON.stringify(m));
    setMe(m);
  };

  if (!me) {
    return (
      <div className="phone join-form">
        <h1>🎉 게임 입장</h1>
        <p className="muted">방 {room}</p>
        <label>닉네임</label>
        <input value={name} maxLength={10} placeholder="예: 민준" onChange={(e) => setName(e.target.value)} />
        <label>소속 팀</label>
        <div className="team-pick">
          {[1, 2, 3, 4].map((t) => (
            <button key={t} className={team === t ? 'on' : ''} style={{ '--c': TEAM_COLORS[t] }} onClick={() => setTeam(t)}>{t}팀</button>
          ))}
        </div>
        <button className="big good" disabled={!name.trim()} onClick={join}>입장하기</button>
      </div>
    );
  }

  const send = (msg) => clientRef.current && clientRef.current.send(msg);
  const buzz = () => {
    if (navigator.vibrate) navigator.vibrate(60);
    send({ t: 'BUZZ' });
  };
  const submit = () => {
    if (!text.trim()) return;
    send({ t: 'ANSWER', text: text.trim() });
  };

  const v = view;
  const cat = v?.category;
  const spLeft = v?.speed?.running ? fmtSec(v.speed.endsAt - now) : null;
  const timerLeft = v?.timer ? fmtSec(v.timer.endsAt - now) : null;

  return (
    <div className="phone player">
      <div className={`conn-bar ${conn.connected ? 'ok' : ''}`}>
        {conn.connected ? '연결됨' : '연결 중…'} · 방 {room}
      </div>
      <div className="me-card" style={{ borderColor: TEAM_COLORS[me.team] }}>
        <b>{v?.me?.name || me.name}</b>
        <span className="team-badge" style={{ background: TEAM_COLORS[me.team] }}>{me.team}팀</span>
        <div className="scores">
          <span>내 점수 <b>{v?.me?.personalScore ?? 0}</b></span>
          <span>{me.team}팀 점수 <b>{v?.myTeam?.teamScore ?? 0}</b></span>
        </div>
      </div>

      <div className="play-area">
        {(!v || v.phase === 'lobby' || !cat) && <div className="wait">⏳ 곧 시작합니다!<br /><small>전광판을 봐주세요</small></div>}

        {(cat === 'song' || cat === 'buzz') && (
          v.myBuzz ? (
            <div className={`buzz-result ${v.myBuzz.status}`}>
              <div className="medal-big">{['🥇', '🥈', '🥉'][v.myBuzz.rank - 1] || `${v.myBuzz.rank}등`}</div>
              <div>{v.mode === 'team' ? '우리 팀' : '나'} {v.myBuzz.rank}번째!</div>
              {v.myBuzz.status === 'right' && <b className="ok-t">정답 인정! 🎉</b>}
              {v.myBuzz.status === 'wrong' && <b className="ng-t">아쉬워요… 오답</b>}
            </div>
          ) : (
            <button className={`buzzer ${v.buzzOpen ? 'live' : ''}`} disabled={!v.buzzOpen} onPointerDown={v.buzzOpen ? buzz : undefined}>
              {v.buzzOpen ? '버저 누르기!' : cat === 'song' ? '노래를 기다리는 중…' : '대기 중'}
            </button>
          )
        )}

        {cat === 'typing' && (
          <div className="typing-box">
            <div className="muted">전광판의 문제를 보고 정답을 입력하세요 {timerLeft != null && `· ${timerLeft}초`}</div>
            {v.inputOpen ? (
              <>
                <input value={text} placeholder="정답 입력" onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submit()} />
                <button className="big good" onClick={submit} disabled={!text.trim()}>정답 제출</button>
              </>
            ) : <div className="wait">제출이 마감되었어요</div>}
            {v.myAnswer && (
              <div className="my-answer">
                제출한 답: <b>{v.myAnswer.text}</b>
                {v.myAnswer.awarded != null && <span className="ok-t"> · {v.myAnswer.awarded > 0 ? '+' : ''}{v.myAnswer.awarded}점!</span>}
              </div>
            )}
          </div>
        )}

        {cat === 'speed' && (
          <div className="wait">
            🙌 스피드 퀴즈!<br />
            {spLeft != null ? <span className="big-num">{spLeft}</span> : <small>전광판을 보고 맞춰보세요</small>}
          </div>
        )}
      </div>

      {v && (
        <div className="mini-rank">
          {v.mode === 'team'
            ? v.teams.map((t, i) => <span key={t.teamId}>{i + 1}. {t.teamName} {t.teamScore}</span>)
            : v.top.map((p, i) => <span key={p.id}>{i + 1}. {p.name} {p.personalScore}</span>)}
        </div>
      )}
    </div>
  );
}
