import type { InputKind, QuizKind } from './data/quiz';

// ───────────── 공통 도메인 타입 ─────────────

export const TEAM_IDS = [1, 2, 3, 4] as const;
export type TeamId = (typeof TEAM_IDS)[number];

export const TEAM_COLORS: Record<TeamId, string> = {
  1: '#ff5d73',
  2: '#4dabff',
  3: '#ffc94d',
  4: '#4ee0a1',
};

/** 개인전 / 팀전 — 점수는 모드별로 완전히 독립 */
export type Mode = 'individual' | 'team';

/** 개인 점수 데이터: 개인전 라운드 점수만 personalScore 에 누적 */
export interface Player {
  id: string;
  name: string;
  team: TeamId;
  personalScore: number;
  online: boolean;
  isBot: boolean;
  joinedAt: number;
}

/** 팀 점수 데이터: 팀전 라운드 점수만 teamScore 에 누적 */
export interface Team {
  teamId: TeamId;
  teamName: string;
  teamScore: number;
}

/** 점수 부여 기록 (되돌리기용). mode 를 함께 저장하므로 되돌릴 때도 해당 점수만 정확히 복구 */
export interface ScoreEvent {
  id: string;
  mode: Mode;
  targetIds: string[]; // 개인전: playerId, 팀전: "1"~"4"
  points: number;
  /** 대상마다 점수가 다를 때 (4지선다 스피드 자동 채점) */
  perTarget?: Record<string, number>;
  /** 자동 채점한 문제 ID */
  questionId?: string;
  at: number;
}

export interface BuzzEntry {
  playerId: string;
  at: number;
}

/**
 * 문제 진행 단계
 *  ready    : 문제 선택됨, 내용은 아직 비공개
 *  live     : 문제 공개 + 타이머 진행 + 입력 받는 중
 *  closed   : 시간 종료/마감 — 입력 잠김, 정답은 아직 비공개
 *  revealed : 정답 공개
 */
export type Phase = 'ready' | 'live' | 'closed' | 'revealed';

export interface RoundState {
  kind: QuizKind | null;
  categoryId: string | null;
  questionId: string | null;
  phase: Phase;
  /** 현재 카테고리에서 출제한 순서 (이전 문제로 돌아가기용) */
  asked: string[];
  /** 전체 출제 기록 (MC 화면에서 회색 표시) */
  used: string[];
  shuffle: boolean;
  /** O/X·4지선다 제출 (playerId → 값). 마지막 제출이 유효 */
  answers: Record<string, { value: string; at: number }>;
  /** 음악 재생 트리거: seq 가 바뀌면 전광판이 sec 초만큼 재생 (null = 끝까지) */
  clip: { seq: number; sec: number | null };
  /** 줌인 퀴즈 확대 단계: 1 = 400% (일부만), 2 = 200%, 3 = 100% (전체) */
  zoom: 1 | 2 | 3;
  /** 가사 TTS 낭독 트리거: seq 가 바뀌면 전광판이 rate 배속으로 가사를 읽음 */
  tts: { seq: number; rate: number };
  /** 가사 TTS 힌트 단계: 1 = 힌트 없음, 2 = 가수 공개, 3 = 제목 초성 */
  ttsHint: 1 | 2 | 3;
  /** 문제가 공개된 시각 (반응 속도 계산용) */
  startedAt: number | null;
  /** 자동 채점을 이미 한 문제 ID (중복 채점 방지) */
  scored: string[];
}

export interface TimerState {
  durationMs: number;
  running: boolean;
  /** running 일 때만 의미 있음 (호스트 시계 기준) */
  endsAt: number | null;
  /** 멈춰 있을 때 남은 시간 */
  remainingMs: number;
}

export interface GameState {
  mode: Mode;
  players: Record<string, Player>;
  teams: Team[];
  history: ScoreEvent[];
  buzzer: {
    open: boolean;
    order: BuzzEntry[];
    /** 오답 처리되어 이번 문제에서 다시 누를 수 없는 참가자 */
    out: string[];
    /** 버저를 열 때마다 1씩 증가 (봇 예약·폰 화면 갱신 기준) */
    round: number;
  };
  round: RoundState;
  timer: TimerState;
  /** 전광판 순위 발표(시상대) 화면 */
  podium: boolean;
  /**
   * 기기 ID(clientId) → 참가자 ID. 폰을 바꾸거나 브라우저 저장소가 지워진 채 같은 닉네임으로
   * 다시 들어오면 기존 참가자를 이어받도록 연결 (전광판에만 저장, 폰으로 전송하지 않음)
   */
  aliases: Record<string, string>;
}

// ───────────── 네트워크 스냅샷 ─────────────

/** 기기마다 시계가 달라서 남은 시간(ms)으로 전송 → 받은 쪽이 자기 시계로 환산 */
export interface TimerView {
  durationMs: number;
  running: boolean;
  remainingMs: number;
}

/** 정답이 빠진 공개용 문제 */
export interface PublicQuestion {
  id: string;
  input: InputKind;
  /** ready 단계에서는 null (아직 비공개) */
  prompt: string | null;
  choices?: string[];
  isMusic: boolean;
  /** 줌인 퀴즈 (그림은 전광판이 자기 데이터에서 직접 그림 — 폰에는 전송하지 않음) */
  isZoom: boolean;
  /** 가사 TTS 퀴즈 (가사는 전송하지 않음) */
  isTts: boolean;
}

export interface RoundView {
  kind: QuizKind | null;
  categoryId: string | null;
  kindTitle: string;
  kindEmoji: string;
  categoryName: string;
  /** 이번 카테고리에서 몇 번째 문제인지 (1부터) */
  number: number;
  total: number;
  phase: Phase;
  /** 줌인 확대 단계 (1~3) */
  zoom: 1 | 2 | 3;
  /** 가사 낭독 횟수(seq)와 마지막 배속 — MC 화면 표시용 (가사 자체는 포함하지 않음) */
  tts: { seq: number; rate: number };
  /** 가사 TTS 힌트 단계 (1~3) */
  ttsHint: 1 | 2 | 3;
  /** 지금까지 공개된 가사 TTS 힌트 문구 (전광판·폰 표시용) */
  hints: string[];
  question: PublicQuestion | null;
  /** 제출한 사람 목록 (값은 정답 공개 전까지 비공개) */
  answeredIds: string[];
  /** 정답 공개 후에만 채워짐 */
  reveal: {
    answer: string;
    /** O/X: 'O'|'X', 4지선다: '0'~'3' */
    correctValue?: string;
    explanation?: string;
    answers: Record<string, string>;
    /** 4지선다 스피드 채점: 빠른 정답 순서 */
    speed?: SpeedResult;
  } | null;
}

/** 4지선다 스피드 채점 결과 */
export interface SpeedResult {
  mode: Mode;
  /** 정답자, 빠른 순 (ms: 문제 공개 후 걸린 시간) */
  order: { playerId: string; ms: number | null }[];
  /** 개인전: playerId → 점수 / 팀전: "1"~"4" → 점수 */
  points: Record<string, number>;
}

/** 전광판 → 폰 으로 전송되는 화면용 스냅샷 (정답 등 비밀 정보 없음) */
export interface PublicView {
  roomId: string;
  mode: Mode;
  players: Player[];
  teams: Team[];
  buzzer: GameState['buzzer'];
  lastAward: ScoreEvent | null;
  round: RoundView;
  timer: TimerView;
  podium: boolean;
}

export interface McSecret {
  /** MC 는 공개 전(ready)에도 문제를 미리 볼 수 있음 */
  prompt: string;
  choices?: string[];
  answer: string;
  correctValue?: string;
  accept?: string[];
  explanation?: string;
  hint?: string;
  /** 음악: 재생 가능 여부 */
  hasMedia?: boolean;
  /** 줌인: 전체 원본 그림 (SVG 마크업) — MC 에게만 전송 */
  art?: string;
  /** 줌인: 실제 사진 정보 (있으면 MC 비밀 정답지에 사진을 보여 줌) */
  artPhoto?: { src: string; fit: 'cover' | 'contain'; credit: string; page: string };
  /** 가사 TTS: 읽어 주는 가사 전문 — MC 에게만 전송 */
  lyrics?: string;
  /** 정답 공개 전에도 MC 는 제출 내용을 볼 수 있음 */
  answers: Record<string, string>;
}

/** MC 전용 스냅샷: PublicView + MC만 볼 수 있는 정보 */
export interface McView extends PublicView {
  canUndo: boolean;
  shuffle: boolean;
  used: string[];
  secret: McSecret | null;
}
