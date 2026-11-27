// 참가자 폰에 보내는 '공개용' 상태. 정답·문제 내용·타인 답안 등 비밀은 넣지 않는다.
import { rankPlayers, rankTeams } from './game.js';

export function playerView(s, pid, now) {
  const me = s.players[pid] || null;
  const team = me ? s.teams[me.team] : null;
  const key = (id) => (s.mode === 'team' ? `t${s.players[id]?.team}` : id);
  const myKey = me ? key(pid) : null;
  const rank = me ? s.buzz.findIndex((b) => key(b.pid) === myKey) : -1;
  const myBuzz = rank >= 0 ? { rank: rank + 1, status: s.buzz[rank].status } : null;
  const ans = s.answers[pid];
  const sp = s.speed;
  return {
    now,
    mode: s.mode,
    phase: s.phase,
    category: s.q?.category || null,
    nonce: s.nonce,
    inputOpen: s.inputOpen,
    buzzOpen: s.buzzOpen,
    myBuzz,
    myAnswer: ans ? { text: ans.text, awarded: ans.awarded } : null,
    speed: sp ? { running: sp.running, finished: sp.finished, endsAt: sp.endsAt } : null,
    timer: s.timer,
    me: me ? { id: me.id, name: me.name, team: me.team, personalScore: me.personalScore } : null,
    myTeam: team ? { teamId: team.teamId, teamName: team.teamName, teamScore: team.teamScore } : null,
    teams: rankTeams(s).map((t) => ({ teamId: t.teamId, teamName: t.teamName, teamScore: t.teamScore })),
    top: rankPlayers(s).slice(0, 5).map((p) => ({ id: p.id, name: p.name, team: p.team, personalScore: p.personalScore })),
  };
}
