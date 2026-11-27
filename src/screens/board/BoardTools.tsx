import { useState } from 'react';
import { makeBots } from '../../game/bots';
import type { GameAction } from '../../game/reducer';
import type { GameState } from '../../types';
import type { Media } from '../../data/quiz';
import { defaultBaseUrl } from '../../lib/url';

interface Props {
  state: GameState;
  dispatch: (a: GameAction) => void;
  dispatchMany: (a: GameAction[]) => void;
  baseUrl: string;
  setBaseUrl: (u: string) => void;
  onNewRoom: () => void;
  playerUrl: string;
  /** 현재 음악 문제 (구간 조정용) */
  song: {
    id: string;
    title: string;
    media: Media | undefined;
    overridden: boolean;
    set: (o: Partial<Media>) => void;
    reset: () => void;
  } | null;
}

/** 유튜브 주소/ID 에서 영상 ID 추출 */
function parseYoutubeId(s: string): string | null {
  const t = s.trim();
  if (/^[\w-]{11}$/.test(t)) return t;
  const m = t.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/);
  return m ? m[1] : null;
}

/** 전광판 패널 전용 도구: 곡 구간 조정, 시연용 봇, 팀 이름, 초기화, QR 주소 */
export function BoardTools({ state, dispatch, dispatchMany, baseUrl, setBaseUrl, onNewRoom, playerUrl, song }: Props) {
  const [urlDraft, setUrlDraft] = useState(baseUrl);
  const [ytDraft, setYtDraft] = useState('');
  const bots = Object.values(state.players).filter((p) => p.isBot);

  const confirmDo = (msg: string, fn: () => void) => {
    if (window.confirm(msg)) fn();
  };

  const start = song?.media?.startSec ?? 0;
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="tools">
      {song && (
        <section className="ctl-section song-tune">
          <h4>
            🎵 곡 구간 조정 {song.overridden && <span className="muted">(수정됨)</span>}
          </h4>
          <div className="muted small">⚠ 빔프로젝터에 곡 제목이 보일 수 있어요: {song.title}</div>
          <div className="row">
            <span>시작 위치 <b>{fmt(start)}</b></span>
            {[-5, -1, 1, 5].map((d) => (
              <button type="button" key={d} className="btn sm" onClick={() => song.set({ startSec: Math.max(0, start + d) })}>
                {d > 0 ? `+${d}` : d}초
              </button>
            ))}
          </div>
          <div className="row">
            <button type="button" className="btn sm go" onClick={() => dispatch({ type: 'PLAY_CLIP', sec: 3 })}>
              ▶ 3초 미리듣기
            </button>
            <button type="button" className="btn ghost sm" onClick={() => dispatch({ type: 'PLAY_CLIP', sec: 0 })}>
              ■ 정지
            </button>
            {song.overridden && (
              <button type="button" className="btn ghost sm" onClick={song.reset}>
                기본값으로
              </button>
            )}
          </div>
          <form
            className="row"
            onSubmit={(e) => {
              e.preventDefault();
              const id = parseYoutubeId(ytDraft);
              if (id) {
                song.set({ youtubeId: id });
                setYtDraft('');
              } else window.alert('유튜브 주소나 영상 ID를 확인해 주세요');
            }}
          >
            <input value={ytDraft} onChange={(e) => setYtDraft(e.target.value)} placeholder="다른 유튜브 영상 주소로 바꾸기" />
            <button type="submit" className="btn sm">
              변경
            </button>
          </form>
        </section>
      )}
      <section className="ctl-section">
        <h4>🤖 시연용 봇 <span className="muted">· 현재 {bots.length}명</span></h4>
        <div className="row">
          {[1, 4, 8].map((n) => (
            <button type="button" key={n} className="btn" onClick={() => dispatchMany(makeBots(state, n))}>
              +{n}명
            </button>
          ))}
          <button
            type="button"
            className="btn ghost"
            disabled={!bots.length}
            onClick={() => bots.forEach((b) => dispatch({ type: 'REMOVE_PLAYER', id: b.id }))}
          >
            봇 모두 퇴장
          </button>
        </div>
        <p className="hint">버저가 열리면 0.4~3초 사이에 누르고, O/X·4지선다는 60% 확률로 정답을 골라요.</p>
        <p className="hint">
          실제 P2P 통신 테스트:{' '}
          <a href={`${playerUrl}&bot=1`} target="_blank" rel="noreferrer">
            P2P 봇 탭 열기
          </a>{' '}
          (탭 하나 = 참가자 한 명)
        </p>
      </section>

      <section className="ctl-section">
        <h4>팀 이름</h4>
        <div className="team-names">
          {state.teams.map((t) => (
            <input
              key={`${t.teamId}-${t.teamName}`}
              defaultValue={t.teamName}
              maxLength={10}
              onBlur={(e) => e.target.value !== t.teamName && dispatch({ type: 'RENAME_TEAM', teamId: t.teamId, name: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            />
          ))}
        </div>
      </section>

      <section className="ctl-section">
        <h4>QR 주소</h4>
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            setBaseUrl(urlDraft.trim() || defaultBaseUrl());
          }}
        >
          <input value={urlDraft} onChange={(e) => setUrlDraft(e.target.value)} placeholder="http://192.168.0.10:5173/" />
          <button type="submit" className="btn">적용</button>
          <button
            type="button"
            className="btn ghost"
            onClick={() => {
              setUrlDraft(defaultBaseUrl());
              setBaseUrl(defaultBaseUrl());
            }}
          >
            기본값
          </button>
        </form>
      </section>

      <section className="ctl-section">
        <h4>초기화</h4>
        <div className="row">
          <button type="button" className="btn ghost" onClick={() => confirmDo('개인 점수를 모두 0점으로 만들까요?', () => dispatch({ type: 'RESET_SCORES', mode: 'individual' }))}>
            개인 점수 초기화
          </button>
          <button type="button" className="btn ghost" onClick={() => confirmDo('팀 점수를 모두 0점으로 만들까요?', () => dispatch({ type: 'RESET_SCORES', mode: 'team' }))}>
            팀 점수 초기화
          </button>
          <button type="button" className="btn danger" onClick={() => confirmDo('새 방을 만들까요? 참가자·점수가 모두 사라지고 QR 코드가 바뀝니다.', onNewRoom)}>
            새 방 만들기
          </button>
        </div>
      </section>
    </div>
  );
}
