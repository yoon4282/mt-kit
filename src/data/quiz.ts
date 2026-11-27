// ───────────── 퀴즈 데이터 타입 & 작성 도우미 ─────────────

export type QuizKind = 'chosung' | 'ox' | 'choice' | 'emoji' | 'speed' | 'music' | 'zoom' | 'tts';
export type InputKind = 'buzzer' | 'ox' | 'choice';

export interface Media {
  youtubeId: string;
  /** 하이라이트(후렴) 시작 위치 (초) */
  startSec: number;
}

/** 줌인 퀴즈 그림: 100x100 좌표계의 SVG 마크업 + 처음 보여줄 확대 구역(fx, fy: 0~100 %) */
export interface ZoomArt {
  svg: string;
  fx: number;
  fy: number;
}

interface QBase {
  id: string;
  /** 전광판에 표시되는 문제 */
  prompt: string;
  explanation?: string;
  hint?: string;
}
export interface BuzzerQ extends QBase {
  input: 'buzzer';
  answer: string;
  /** 정답으로 인정할 다른 표기 */
  accept?: string[];
  /** 음악 퀴즈 전용 */
  media?: Media;
  /** 줌인 퀴즈 전용 */
  art?: ZoomArt;
  /** TTS 가사 퀴즈 전용: 브라우저 음성합성이 읽는 가사 (전광판·참가자 화면에는 표시하지 않음) */
  lyrics?: string;
  artist?: string;
  year?: number;
}
export interface OxQ extends QBase {
  input: 'ox';
  answer: 'O' | 'X';
}
export interface ChoiceQ extends QBase {
  input: 'choice';
  choices: string[];
  /** 정답 보기 인덱스 (0~3) */
  answer: number;
}
export type Question = BuzzerQ | OxQ | ChoiceQ;

export interface Category {
  id: string;
  name: string;
  questions: Question[];
}

export interface QuizType {
  kind: QuizKind;
  title: string;
  emoji: string;
  input: InputKind;
  /** 기본 제한 시간 (초) */
  defaultSec: number;
  desc: string;
  categories: Category[];
}

/** 정답 텍스트 (보기 번호 → 보기 내용) */
export function answerText(q: Question): string {
  if (q.input === 'choice') return `${q.answer + 1}번 · ${q.choices[q.answer]}`;
  if (q.input === 'buzzer' && q.lyrics && q.artist) return `${q.artist} - ${q.answer}`;
  if (q.input === 'buzzer' && q.artist) return `${q.answer} — ${q.artist}`;
  return q.answer;
}

// ───────────── 작성 도우미 (id 는 자동 부여) ─────────────

type Draft<T extends Question> = Omit<T, 'id'>;

export function category<T extends Question>(kind: QuizKind, id: string, name: string, items: Draft<T>[]): Category {
  return {
    id,
    name,
    questions: items.map((q, i) => ({ ...q, id: `${kind}-${id}-${String(i + 1).padStart(2, '0')}` }) as Question),
  };
}

const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
/** "떡볶이" → "ㄸㅂㅇ" (한글 외 문자는 그대로, 공백 유지) */
export function toChosung(text: string): string {
  return [...text]
    .map((ch) => {
      const c = ch.charCodeAt(0) - 0xac00;
      return c >= 0 && c < 11172 ? CHO[Math.floor(c / 588)] : ch;
    })
    .join('');
}

/** 초성 퀴즈: 정답만 적으면 초성 문제 자동 생성 */
export const cho = (answer: string, explanation?: string, hint?: string): Draft<BuzzerQ> => ({
  input: 'buzzer',
  prompt: toChosung(answer),
  answer,
  explanation,
  hint,
});

/** 일반 버저 문제 (이모지·스피드) */
export const buzz = (prompt: string, answer: string, explanation?: string, accept?: string[], hint?: string): Draft<BuzzerQ> => ({
  input: 'buzzer',
  prompt,
  answer,
  explanation,
  accept,
  hint,
});

export const ox = (prompt: string, answer: 'O' | 'X', explanation?: string): Draft<OxQ> => ({
  input: 'ox',
  prompt,
  answer,
  explanation,
});

export const choice = (prompt: string, choices: [string, string, string, string], answer: 0 | 1 | 2 | 3, explanation?: string): Draft<ChoiceQ> => ({
  input: 'choice',
  prompt,
  choices,
  answer,
  explanation,
});

/** 음악 퀴즈: 제목·가수·연도 + 유튜브 공식 영상 ID·후렴 시작 초 */
export const song = (title: string, artist: string, year: number, youtubeId: string, startSec: number, accept?: string[]): Draft<BuzzerQ> => ({
  input: 'buzzer',
  prompt: '🎵 이 노래의 제목은?',
  answer: title,
  artist,
  year,
  accept,
  media: youtubeId ? { youtubeId, startSec } : undefined,
  explanation: `${artist} · ${year}년`,
});

/** 줌인 퀴즈: 정답 + SVG 그림 + 처음 확대할 구역 */
export const zoomQ = (answer: string, art: ZoomArt, explanation?: string, accept?: string[], hint?: string): Draft<BuzzerQ> => ({
  input: 'buzzer',
  prompt: '🔍 이 그림은 무엇일까요?',
  answer,
  explanation,
  accept,
  hint,
  art,
});

/** 가사 TTS 퀴즈: 곡명 + 가수 + 읽어 줄 가사 */
export const lyricQ = (title: string, artist: string, lyrics: string, accept?: string[], hint?: string): Draft<BuzzerQ> => ({
  input: 'buzzer',
  prompt: '🤖 기계음 가사를 듣고 노래를 맞혀보세요!',
  answer: title,
  artist,
  lyrics,
  accept,
  hint,
  explanation: `${artist} - ${title}`,
});
