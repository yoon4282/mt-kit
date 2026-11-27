// MC 컨트롤 콘솔: MC 폰(?role=mc)과 전광판 하단 접이식 패널이 똑같이 사용한다.
// state 는 호스트 전체 상태, send(action) 으로 명령을 보낸다.
import { useMemo, useState } from 'react';
import { CATEGORIES, QUIZ_BY_CATEGORY, getQuiz } from '../data/quizzes.js';
import { PRESETS, rankPlayers, rankTeams } from '../core/game.js';
import { SOUNDBOARD, unlockAudio } from '../audio/sfx.js';
import { useNow, fmtSec, TEAM_COLORS } from '../core/util.js';
import Scoreboard, { TeamBadge } from './Scoreboard.jsx';

const signed = (n) => (n > 0 ? `+${n}` : `${n}`);

export default function McConsole({ state, send, offset = 0, secretDefault = true, localSound = false }) {
  const [tab, setTab] = useState('song');
  const [delta, setDelta] = useState(10);
  const [custom, setCustom] = useState('');
  const [penalty, setPenalty] = useState(-10);
  const [secret, setSecret] = useState(secretDefault);
  const [target, setTarget] = useState('');
  const [speedWho, setSpeedWho] = useState('');
  const now = useNow(250, offset);

  const quiz = state.q ? getQuiz(state.q.qid) : null;
  const cat = state.q?.category;
  const team = state.mode === 'team';
  const players = useMemo(() => rankPlayers(state), [state]);
  const teams = useMemo(() => rankTeams(state), [state]);
  const name = (pid) => state.players[pid]?.name || '?';
  const tid = (pid) => state.players[pid]?.team;

  const pickCustom = (v) => {
    setCustom(v);
    const n = parseInt(v, 10);
    if (Number.isFinite(n) && n !== 0) setDelta(n);
  };
  const timerLeft = state.timer ? fmtSec(state.timer.endsAt - now) : null;
  const firstPending = state.buzz.find((b) => b.status === 'pending');

  const sfx = async (id) => {
    send({ type: 'FX', id });
    if (localSound) { await unlockAudio(); }
  };

  const ScorePad = (
    <section className="card">
      <h4>🎯 배점 선택 <small>현재 {signed(delta)}점</small></h4>
      <div className="preset-row">
        {PRESETS.map((p) => (
          <button key={p} className={`preset ${p < 0 ? 'neg' : ''} ${delta === p && !custom ? 'on' : ''}`}
            onClick={() => { setCustom(''); setDelta(p); }}>{signed(p)}</button>
        ))}
      </div>
      <div className="custom-row">
        <input type="number" inputMode="numeric" placeholder="직접 입력 (예: 15, -5)" value={custom}
          onChange={(e) => pickCustom(e.target.value)} />
        <span className="muted">{custom ? `직접 ${signed(delta)}점 적용 중` : '프리셋 사용 중'}</span>
      </div>
    </section>
  );

  const secretBox = quiz && (
    <section className="card secret">
      <h4>🤫 비밀 정답지 <button className="mini" onClick={() => setSecret(!secret)}>{secret ? '숨기기' : '보이기'}</button></h4>
      {secret ? (
        <div className="secret-body">
          {cat === 'song' && (<>
            <div className="answer">{quiz.title} <small>- {quiz.artist}</small></div>
            <p>힌트: {quiz.hint}</p>
            <p className="muted">시작 {quiz.startSec}초 · youtube/{quiz.youtubeId}</p>
          </>)}
          {(cat === 'typing' || cat === 'buzz') && (<>
            <div className="answer">{quiz.answers[0]}{quiz.answers.length > 1 && <small> (인정: {quiz.answers.join(', ')})</small>}</div>
            <p>💡 {quiz.explain}</p>
          </>)}
          {cat === 'speed' && (<>
            <div className="answer">{quiz.topic} 제시어 {quiz.words.length}개</div>
            <p className="muted">{quiz.words.map((w, i) => (i === state.speed?.idx ? `【${w}】` : w)).join(' · ')}</p>
          </>)}
        </div>
      ) : <p className="muted">프로젝터에 비치는 중이면 숨겨두세요.</p>}
    </section>
  );

  const revealRow = (
    <div className="btn-row">
      <button className="big" onClick={() => send({ type: 'REVEAL' })} disabled={state.revealed}>
        {state.revealed ? '✅ 전광판에 정답 공개됨' : '📺 전광판에 정답 공개'}
      </button>
      <button onClick={() => send({ type: 'BACK_LOBBY' })}>⏏ 문제 종료</button>
    </div>
  );

  const timerRow = (
    <div className="btn-row">
      {[15, 30, 60].map((s) => <button key={s} onClick={() => send({ type: 'TIMER_START', sec: s })}>⏱ {s}초</button>)}
      <button onClick={() => send({ type: 'TIMER_STOP' })}>정지{timerLeft != null ? ` (${timerLeft}s)` : ''}</button>
    </div>
  );

  const buzzList = (
    <section className="card">
      <h4>🔔 버저 순서 <small>{team ? '팀당 1회 · 선착순' : '개인 선착순'}</small>
        <button className="mini" onClick={() => send({ type: 'BUZZ_RESET' })}>초기화</button>
        <button className="mini" onClick={() => send({ type: 'BUZZ_TOGGLE', open: !state.buzzOpen })}>
          {state.buzzOpen ? '버저 잠금' : '버저 열기'}
        </button>
      </h4>
      <div className="penalty">오답 감점:
        {[0, -10, -20].map((p) => <button key={p} className={`mini ${penalty === p ? 'on' : ''}`} onClick={() => setPenalty(p)}>{p === 0 ? '없음' : p}</button>)}
      </div>
      {state.buzz.length === 0 && <p className="muted">{state.buzzOpen ? '누르는 사람을 기다리는 중…' : '버저가 잠겨 있어요'}</p>}
      {state.buzz.map((b, i) => {
        const current = firstPending && b.pid === firstPending.pid;
        return (
          <div key={b.pid} className={`row buzz-row ${b.status} ${current ? 'current' : ''}`}>
            <span className="medal">{['🥇', '🥈', '🥉'][i] || `${i + 1}`}</span>
            <span className="grow">{name(b.pid)} <TeamBadge team={tid(b.pid)} />
              {team && <small className="muted"> → {tid(b.pid)}팀 점수</small>}</span>
            {b.status === 'right' && <b className="ok-t">정답 {signed(b.delta)}</b>}
            {b.status === 'wrong' && <b className="ng-t">오답 {b.delta ? signed(b.delta) : ''}</b>}
            {current && (
              <span className="btn-row tight">
                <button className="good" onClick={() => send({ type: 'BUZZ_RESULT', pid: b.pid, correct: true, delta })}>정답 인정 {signed(delta)}</button>
                <button className="bad" onClick={() => send({ type: 'BUZZ_RESULT', pid: b.pid, correct: false, delta: penalty })}>오답{penalty ? ` ${penalty}` : ''} · 다음 순위</button>
              </span>
            )}
          </div>
        );
      })}
    </section>
  );

  const answerList = (
    <section className="card">
      <h4>⌨️ 제출 답안 <small>{Object.keys(state.answers).length}건 · 자동 채점</small>
        <button className="mini" onClick={() => send({ type: 'INPUT_TOGGLE', open: !state.inputOpen })}>{state.inputOpen ? '제출 마감' : '제출 열기'}</button>
      </h4>
      {Object.values(state.answers).length === 0 && <p className="muted">아직 제출된 답이 없어요</p>}
      {Object.values(state.answers).sort((a, b) => a.at - b.at).map((a) => (
        <div key={a.pid} className={`row ${a.correct ? 'match' : ''}`}>
          <span className="grow">{name(a.pid)} <TeamBadge team={tid(a.pid)} /> <b className="ans-text">“{a.text}”</b></span>
          <span className={a.correct ? 'ok-t' : 'ng-t'}>{a.correct ? '✅ 정답 일치' : '❌ 불일치'}</span>
          {a.awarded != null
            ? <b className="muted">{signed(a.awarded)} 완료</b>
            : <button className={a.correct ? 'good' : ''} onClick={() => send({ type: 'AWARD_ANSWER', pid: a.pid, delta })}>{signed(delta)} 부여</button>}
        </div>
      ))}
    </section>
  );

  const sp = state.speed;
  const speedPanel = quiz && cat === 'speed' && (
    <section className="card">
      <h4>⏱ 스피드 퀴즈 <small>{team ? '팀전 추천' : '개인 도전'}</small></h4>
      {!sp && (
        <>
          <div className="btn-row">
            {team ? teams.map((t) => (
              <button key={t.teamId} className={`teambtn ${String(speedWho) === String(t.teamId) ? 'on' : ''}`}
                style={{ '--c': TEAM_COLORS[t.teamId] }} onClick={() => setSpeedWho(t.teamId)}>{t.teamName}</button>
            )) : (
              <select value={speedWho} onChange={(e) => setSpeedWho(e.target.value)}>
                <option value="">도전자 선택</option>
                {players.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.team}팀)</option>)}
              </select>
            )}
          </div>
          <button className="big good" disabled={!speedWho}
            onClick={() => send(team ? { type: 'SPEED_START', teamId: Number(speedWho) } : { type: 'SPEED_START', pid: speedWho })}>
            ▶ {quiz.seconds}초 시작
          </button>
        </>
      )}
      {sp && (
        <>
          <div className="speed-now">
            <div className="muted">{sp.running ? `남은 ${fmtSec(sp.endsAt - now)}초` : '종료'} · 도전: {sp.who.teamId ? `${sp.who.teamId}팀` : name(sp.who.pid)}</div>
            <div className="word">{sp.running ? quiz.words[sp.idx] : '⏹ 끝!'}</div>
            <div className="muted">다음: {quiz.words[sp.idx + 1] || '-'}</div>
          </div>
          <div className="btn-row">
            <button className="big good" disabled={!sp.running} onClick={() => send({ type: 'SPEED_MARK', ok: true })}>정답 O</button>
            <button className="big bad" disabled={!sp.running} onClick={() => send({ type: 'SPEED_MARK', ok: false })}>패스 X</button>
          </div>
          <div className="count-row">통과 <b className="ok-t">{sp.correct}</b>개 · 패스 <b className="ng-t">{sp.passed}</b>개
            {sp.running && <button className="mini" onClick={() => send({ type: 'SPEED_END' })}>지금 종료</button>}
          </div>
          {!sp.running && sp.awarded == null && (
            <div className="btn-row">
              <button className="good" onClick={() => send({ type: 'SPEED_AWARD', delta: sp.correct * delta })}
                disabled={sp.correct * delta === 0}>
                개수×배점 = {signed(sp.correct * delta)}점 일괄 부여
              </button>
              <button onClick={() => send({ type: 'SPEED_AWARD', delta })}>총점으로 {signed(delta)}점</button>
            </div>
          )}
          {sp.awarded != null && <p className="ok-t">✅ {signed(sp.awarded)}점 부여 완료 ({team ? '팀 점수' : '개인 점수'})</p>}
          <button className="mini" onClick={() => send({ type: 'SELECT_Q', qid: quiz.id })}>↺ 이 세트 다시</button>
        </>
      )}
    </section>
  );

  const list = QUIZ_BY_CATEGORY[tab] || [];
  const label = (q) => {
    if (q.category === 'song') return secret ? `${q.title} - ${q.artist}` : `노래 #${q.id.slice(-2)}`;
    if (q.category === 'typing') return `${q.prompt}  (${q.topic})`;
    if (q.category === 'buzz') return q.question;
    return `${q.topic} (${q.words.length}개)`;
  };

  return (
    <div className="mc-console">
      <section className="card">
        <div className="mode-toggle">
          <button className={state.mode === 'solo' ? 'on' : ''} onClick={() => send({ type: 'SET_MODE', mode: 'solo' })}>👤 개인전</button>
          <button className={state.mode === 'team' ? 'on' : ''} onClick={() => send({ type: 'SET_MODE', mode: 'team' })}>👥 팀전</button>
        </div>
        <Scoreboard state={state} limit={5} compact />
        <button className="mini danger" onClick={() => window.confirm('모든 점수를 0으로 초기화할까요?') && send({ type: 'RESET_SCORES' })}>점수 초기화</button>
      </section>

      <section className="card">
        <h4>🎮 게임 선택</h4>
        <div className="tabs">
          {CATEGORIES.map((c) => (
            <button key={c.key} className={tab === c.key ? 'on' : ''} onClick={() => setTab(c.key)}>{c.icon} {c.label}</button>
          ))}
        </div>
        <div className="btn-row">
          <button className="big alt" onClick={() => send({ type: 'RANDOM_Q', category: tab, r: Math.random() })}>
            🎲 랜덤 출제 <small>(남은 {list.filter((q) => !state.used.includes(q.id)).length}/{list.length})</small>
          </button>
          <button className="mini" onClick={() => send({ type: 'RESET_USED' })}>출제 기록 초기화</button>
        </div>
        <div className="qlist">
          {list.map((q) => (
            <button key={q.id} className={`${state.q?.qid === q.id ? 'on' : ''} ${state.used.includes(q.id) ? 'used' : ''}`} onClick={() => send({ type: 'SELECT_Q', qid: q.id })}>
              <span className="qno">{q.id.slice(-2)}</span> {label(q)}{state.used.includes(q.id) && ' ✓'}
            </button>
          ))}
        </div>
      </section>

      {quiz && (
        <>
          <section className="card now">
            <h4>▶ 진행 중: {CATEGORIES.find((c) => c.key === cat)?.icon} {CATEGORIES.find((c) => c.key === cat)?.label} <small>#{quiz.id.slice(-2)}</small></h4>
            {cat === 'song' && (
              <div className="btn-row wrap">
                <button className="big" onClick={() => send({ type: 'SONG_PLAY', kind: 's1' })}>▶ 1초 듣기</button>
                <button className="big" onClick={() => send({ type: 'SONG_PLAY', kind: 's3' })}>▶ 3초 듣기</button>
                <button onClick={() => send({ type: 'SONG_PLAY', kind: 'replay' })}>🔁 다시 듣기</button>
                <button onClick={() => send({ type: 'HINT_SHOW' })}>💡 힌트 공개{state.hintShown ? ' ✓' : ''}</button>
                <button className="alt" onClick={() => send({ type: 'SONG_PLAY', kind: 'melody' })}>🎹 오프라인 멜로디</button>
                <button onClick={() => send({ type: 'SONG_PLAY', kind: 'stop' })}>⏹ 정지</button>
              </div>
            )}
            {(cat === 'typing' || cat === 'buzz') && timerRow}
            {cat !== 'speed' && revealRow}
            {cat === 'speed' && <div className="btn-row"><button onClick={() => send({ type: 'BACK_LOBBY' })}>⏏ 문제 종료</button></div>}
          </section>
          {secretBox}
          {speedPanel}
          {(cat === 'song' || cat === 'buzz') && buzzList}
          {cat === 'typing' && answerList}
        </>
      )}

      {ScorePad}

      <section className="card">
        <h4>➕ 직접 점수 부여 <small>{team ? '팀 점수에 반영' : '개인 점수에 반영'}</small></h4>
        {team ? (
          <div className="btn-row">
            {teams.map((t) => (
              <button key={t.teamId} className={`teambtn ${String(target) === String(t.teamId) ? 'on' : ''}`} style={{ '--c': TEAM_COLORS[t.teamId] }}
                onClick={() => setTarget(t.teamId)}>{t.teamName} ({t.teamScore})</button>
            ))}
          </div>
        ) : (
          <select value={target} onChange={(e) => setTarget(e.target.value)}>
            <option value="">참가자 선택</option>
            {players.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.team}팀 · {p.personalScore}점)</option>)}
          </select>
        )}
        <button className="big good" disabled={!target}
          onClick={() => send(team ? { type: 'AWARD', teamId: Number(target), delta } : { type: 'AWARD', pid: target, delta })}>
          {signed(delta)}점 부여
        </button>
      </section>

      <div className="spacer" />
      <div className={`sound-bar ${localSound ? 'sticky' : 'fixed'}`}>
        {SOUNDBOARD.map((s) => (
          <button key={s.id} onClick={() => sfx(s.id)}>
            <span>{s.emoji}</span><b>{s.label}</b><small>{s.sub}</small>
          </button>
        ))}
      </div>
    </div>
  );
}
