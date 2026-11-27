import { TEAM_COLORS, type TeamId } from '../types';

export function TeamChip({ team, label }: { team: TeamId; label?: string }) {
  return (
    <span className="team-chip" style={{ ['--team' as string]: TEAM_COLORS[team] }}>
      {label ?? `${team}팀`}
    </span>
  );
}

export const teamStyle = (team: TeamId) => ({ ['--team' as string]: TEAM_COLORS[team] });
