import { rankPlayers, rankTeams } from '../game/selectors';
import type { PublicView } from '../types';
import { TeamChip, teamStyle } from './TeamChip';

const MEDALS = ['🥇', '🥈', '🥉'];

interface Props {
  view: PublicView;
  /** 개인전 표시 인원 제한 */
  limit?: number;
  highlightId?: string;
  size?: 'lg' | 'sm';
}

/** 모드에 따라 개인 personalScore 순위 / 팀 teamScore 순위를 표시 */
export function Leaderboard({ view, limit = 10, highlightId, size = 'lg' }: Props) {
  // 방금 점수를 받은 행은 key 를 바꿔 강조 애니메이션을 다시 재생
  const ev = view.lastAward;
  const recent = ev && Date.now() - ev.at < 2500 ? new Set(ev.targetIds) : null;
  const hit = (mode: 'individual' | 'team', id: string) => !!recent && ev!.mode === mode && recent.has(id);

  if (view.mode === 'team') {
    const ranked = rankTeams(view.teams);
    const max = Math.max(1, ...view.teams.map((t) => Math.abs(t.teamScore)));
    return (
      <ol className={`board-list team-list ${size}`}>
        {ranked.map(({ rank, item: t }) => (
          <li
            key={hit('team', String(t.teamId)) ? `${t.teamId}-${view.lastAward!.id}` : t.teamId}
            className={`team-row ${hit('team', String(t.teamId)) ? 'pulse' : ''}`}
            style={teamStyle(t.teamId)}
          >
            <span className="rank">{MEDALS[rank - 1] ?? rank}</span>
            <span className="team-name">{t.teamName}</span>
            <span className="team-bar">
              <span style={{ width: `${(Math.max(0, t.teamScore) / max) * 100}%` }} />
            </span>
            <span className="score">{t.teamScore}</span>
          </li>
        ))}
      </ol>
    );
  }

  const ranked = rankPlayers(view.players);
  if (!ranked.length) return <p className="empty">아직 참가자가 없어요. QR 코드로 입장해 주세요!</p>;
  const shown = ranked.slice(0, limit);
  const mine = highlightId ? ranked.find((r) => r.item.id === highlightId) : undefined;
  return (
    <ol className={`board-list ${size}`}>
      {shown.map(({ rank, item: p }) => (
        <li
          key={hit('individual', p.id) ? `${p.id}-${view.lastAward!.id}` : p.id}
          className={[
            'player-row',
            p.id === highlightId ? 'me' : '',
            !p.online ? 'offline' : '',
            hit('individual', p.id) ? 'pulse' : '',
          ].join(' ')}
        >
          <span className="rank">{MEDALS[rank - 1] ?? rank}</span>
          <span className="name">
            {p.name}
            {p.isBot && <small className="bot-tag">봇</small>}
          </span>
          <TeamChip team={p.team} />
          <span className="score">{p.personalScore}</span>
        </li>
      ))}
      {mine && !shown.includes(mine) && (
        <li className="player-row me">
          <span className="rank">{mine.rank}</span>
          <span className="name">{mine.item.name}</span>
          <TeamChip team={mine.item.team} />
          <span className="score">{mine.item.personalScore}</span>
        </li>
      )}
      {ranked.length > shown.length && <li className="more">외 {ranked.length - shown.length}명</li>}
    </ol>
  );
}
