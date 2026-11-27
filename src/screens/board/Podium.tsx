import type { ReactNode } from 'react';
import { rankPlayers, rankTeams } from '../../game/selectors';
import { TEAM_COLORS, type PublicView } from '../../types';
import { TeamChip } from '../../components/TeamChip';

/** 순위 발표 화면 — 개인전: 상위 3명 시상대 / 팀전: 4팀 시상대 */
export function Podium({ view, onClose }: { view: PublicView; onClose?: () => void }) {
  const isTeam = view.mode === 'team';
  const entries = isTeam
    ? rankTeams(view.teams).map(({ rank, item }) => ({
        key: String(item.teamId),
        rank,
        name: item.teamName,
        score: item.teamScore,
        color: TEAM_COLORS[item.teamId],
        chip: null as ReactNode,
      }))
    : rankPlayers(view.players).map(({ rank, item }) => ({
        key: item.id,
        rank,
        name: item.name,
        score: item.personalScore,
        color: TEAM_COLORS[item.team],
        chip: (<TeamChip team={item.team} />) as ReactNode,
      }));

  const top = entries.slice(0, 3);
  // 시상대 배치: 2등 - 1등 - 3등
  const order = [top[1], top[0], top[2]].filter(Boolean);
  const rest = entries.slice(3, isTeam ? 4 : 8);

  return (
    <div className="podium-overlay" onClick={onClose}>
      <div className="podium-title">🏆 {isTeam ? '팀' : '개인'} 순위 발표 🏆</div>
      {entries.length === 0 ? (
        <p className="muted">아직 참가자가 없어요</p>
      ) : (
        <div className="podium">
          {order.map((e, i) => (
            <div key={e.key} className={`podium-col rank-${e.rank}`} style={{ ['--c' as string]: e.color, animationDelay: `${[1.2, 2.4, 0.4][i]}s` }}>
              <div className="podium-medal">{['🥇', '🥈', '🥉'][e.rank - 1] ?? e.rank}</div>
              <div className="podium-name">{e.name}</div>
              {e.chip}
              <div className="podium-score">{e.score}점</div>
              <div className="podium-block">{e.rank}</div>
            </div>
          ))}
        </div>
      )}
      {rest.length > 0 && (
        <ol className="podium-rest">
          {rest.map((e) => (
            <li key={e.key}>
              <b>{e.rank}위</b> {e.name} <span>{e.score}점</span>
            </li>
          ))}
        </ol>
      )}
      {onClose && <div className="muted small">화면을 클릭하면 닫혀요</div>}
    </div>
  );
}
