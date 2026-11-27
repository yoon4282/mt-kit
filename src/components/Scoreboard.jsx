import { rankPlayers, rankTeams } from '../core/game.js';
import { TEAM_COLORS } from '../core/util.js';

export function TeamBadge({ team }) {
  return (
    <span className="team-badge" style={{ background: TEAM_COLORS[team] || '#666' }}>
      {team}팀
    </span>
  );
}

// 모드에 따라 개인 순위(personalScore) 또는 팀 순위(teamScore)만 보여준다.
export default function Scoreboard({ state, limit = 8, compact = false }) {
  if (state.mode === 'team') {
    const teams = rankTeams(state);
    const max = Math.max(1, ...teams.map((t) => Math.abs(t.teamScore)));
    return (
      <div className={`scoreboard ${compact ? 'compact' : ''}`}>
        <h3>🏆 팀전 순위 <small>(팀 점수)</small></h3>
        {teams.map((t, i) => (
          <div className="sb-row" key={t.teamId}>
            <span className="sb-rank">{i + 1}</span>
            <span className="sb-name" style={{ color: TEAM_COLORS[t.teamId] }}>{t.teamName}</span>
            <span className="sb-bar"><i style={{ width: `${(Math.max(0, t.teamScore) / max) * 100}%`, background: TEAM_COLORS[t.teamId] }} /></span>
            <b className="sb-score">{t.teamScore}</b>
          </div>
        ))}
      </div>
    );
  }
  const list = rankPlayers(state);
  const max = Math.max(1, ...list.map((p) => Math.abs(p.personalScore)));
  return (
    <div className={`scoreboard ${compact ? 'compact' : ''}`}>
      <h3>🏆 개인전 순위 <small>(개인 점수)</small></h3>
      {list.length === 0 && <p className="muted">아직 참가자가 없어요</p>}
      {list.slice(0, limit).map((p, i) => (
        <div className="sb-row" key={p.id}>
          <span className="sb-rank">{i + 1}</span>
          <span className="sb-name">{p.name} <TeamBadge team={p.team} /></span>
          <span className="sb-bar"><i style={{ width: `${(Math.max(0, p.personalScore) / max) * 100}%` }} /></span>
          <b className="sb-score">{p.personalScore}</b>
        </div>
      ))}
      {list.length > limit && <p className="muted">외 {list.length - limit}명</p>}
    </div>
  );
}
