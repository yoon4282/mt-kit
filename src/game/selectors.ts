import { answerText } from '../data/quiz';
import { findCategory, findQuestion, findType } from '../data/quizzes';
import type { GameState, McView, Player, PublicView, RoundView, Team } from '../types';
import { computeSpeedResult, remainingMs } from './reducer';

function roundView(state: GameState): RoundView {
  const { round } = state;
  const type = findType(round.kind);
  const cat = findCategory(round.kind, round.categoryId);
  const ref = findQuestion(round.questionId);
  const q = ref?.question;
  const pos = round.asked.indexOf(round.questionId ?? '');

  let reveal: RoundView['reveal'] = null;
  if (q && round.phase === 'revealed') {
    reveal = {
      answer: answerText(q),
      correctValue: q.input === 'ox' ? q.answer : q.input === 'choice' ? String(q.answer) : undefined,
      explanation: q.explanation,
      answers: Object.fromEntries(Object.entries(round.answers).map(([id, a]) => [id, a.value])),
      speed: computeSpeedResult(state) ?? undefined,
    };
  }

  return {
    kind: round.kind,
    categoryId: round.categoryId,
    kindTitle: type?.title ?? '',
    kindEmoji: type?.emoji ?? '',
    categoryName: cat?.name ?? '',
    number: pos >= 0 ? pos + 1 : 0,
    total: cat?.questions.length ?? 0,
    phase: round.phase,
    question: q
      ? {
          id: q.id,
          input: q.input,
          // ready 단계에선 문제 내용 비공개
          prompt: round.phase === 'ready' ? null : q.prompt,
          choices: q.input === 'choice' && round.phase !== 'ready' ? q.choices : undefined,
          isMusic: q.input === 'buzzer' && !!q.media,
        }
      : null,
    answeredIds: Object.keys(round.answers),
    reveal,
  };
}

/** 참가자에게 보내는 공개 스냅샷 — 정답·음악 영상 ID 는 포함하지 않음 */
export function toPublicView(state: GameState, roomId: string): PublicView {
  return {
    roomId,
    mode: state.mode,
    players: Object.values(state.players).sort((a, b) => a.joinedAt - b.joinedAt),
    teams: state.teams,
    buzzer: state.buzzer,
    lastAward: state.history[state.history.length - 1] ?? null,
    round: roundView(state),
    timer: { durationMs: state.timer.durationMs, running: state.timer.running, remainingMs: remainingMs(state.timer) },
    podium: state.podium,
  };
}

/** MC 에게만 보내는 스냅샷 — 비밀 정답지 포함 */
export function toMcView(state: GameState, roomId: string): McView {
  const q = findQuestion(state.round.questionId)?.question;
  return {
    ...toPublicView(state, roomId),
    canUndo: state.history.length > 0,
    shuffle: state.round.shuffle,
    used: state.round.used,
    secret: q
      ? {
          prompt: q.prompt,
          choices: q.input === 'choice' ? q.choices : undefined,
          answer: answerText(q),
          correctValue: q.input === 'ox' ? q.answer : q.input === 'choice' ? String(q.answer) : undefined,
          accept: q.input === 'buzzer' ? q.accept : undefined,
          explanation: q.explanation,
          hint: q.hint,
          hasMedia: q.input === 'buzzer' ? !!q.media : undefined,
          answers: Object.fromEntries(Object.entries(state.round.answers).map(([id, a]) => [id, a.value])),
        }
      : null,
  };
}

/** O/X·4지선다 정답자 목록 */
export function correctPlayerIds(view: McView): string[] {
  const s = view.secret;
  if (!s?.correctValue) return [];
  return Object.entries(s.answers)
    .filter(([, v]) => v === s.correctValue)
    .map(([id]) => id);
}

export interface Ranked<T> {
  rank: number;
  item: T;
}

/** 동점자는 같은 순위 (1, 2, 2, 4 …) */
function rankBy<T>(items: T[], score: (t: T) => number, tiebreak: (a: T, b: T) => number): Ranked<T>[] {
  const sorted = [...items].sort((a, b) => score(b) - score(a) || tiebreak(a, b));
  let rank = 0;
  return sorted.map((item, i) => {
    if (i === 0 || score(item) !== score(sorted[i - 1])) rank = i + 1;
    return { rank, item };
  });
}

export const rankPlayers = (players: Player[]) =>
  rankBy(players, (p) => p.personalScore, (a, b) => a.joinedAt - b.joinedAt);

export const rankTeams = (teams: Team[]) =>
  rankBy(teams, (t) => t.teamScore, (a, b) => a.teamId - b.teamId);

export function describeAward(view: PublicView, ev: NonNullable<PublicView['lastAward']>): string {
  if (ev.perTarget) {
    const n = ev.targetIds.length;
    const top = Math.max(...Object.values(ev.perTarget));
    return `[${ev.mode === 'individual' ? '개인' : '팀'}] ⚡ 스피드 채점 ${n}${ev.mode === 'individual' ? '명' : '팀'} (1등 +${top}점)`;
  }
  const names =
    ev.mode === 'individual'
      ? ev.targetIds.map((id) => view.players.find((p) => p.id === id)?.name ?? '(나간 참가자)')
      : ev.targetIds.map((id) => view.teams.find((t) => String(t.teamId) === id)?.teamName ?? `${id}팀`);
  const shown = names.length > 3 ? `${names.slice(0, 3).join(', ')} 외 ${names.length - 3}명` : names.join(', ');
  return `[${ev.mode === 'individual' ? '개인' : '팀'}] ${shown} ${ev.points > 0 ? '+' : ''}${ev.points}점`;
}
