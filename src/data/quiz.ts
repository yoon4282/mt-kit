// ───────────── 퀴즈 데이터 타입 & 작성 도우미 ─────────────

export type QuizKind = 'chosung' | 'ox' | 'choice' | 'emoji' | 'speed' | 'music' | 'zoom' | 'tts';
export type InputKind = 'buzzer' | 'ox' | 'choice';

export interface Media {
  youtubeId: string;
  /** 하이라이트(후렴) 시작 위치 (초) */
  startSec: number;
}

/** 줌인 퀴즈 그림: 100x100 좌표계의 SVG 마크업 + 처음 보여줄 확대 구역(fx, fy: 0~100 %) */
export interface ZoomPhoto {
  /** 사진 주소 (위키미디어 커먼즈 썸네일 등). 불러오지 못하면 svg 그림으로 대신 보여줌 */
  src: string;
  /** 'cover': 정사각형 프레임을 꽉 채움(사진) · 'contain': 전체가 보이게(로고·국기) */
  fit: 'cover' | 'contain';
  /** 출처 표기 (작성자 · 라이선스) */
  credit: string;
  /** 원본 파일 설명 페이지 */
  page: string;
}

export interface ZoomArt {
  /** 직접 그린 SVG — 사진이 없거나 불러오지 못할 때 대신 쓰는 그림 */
  svg: string;
  fx: number;
  fy: number;
  photo?: ZoomPhoto;
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
export const cho = (answer: string, explanation?: string, hint?: string, accept?: string[]): Draft<BuzzerQ> => ({
  input: 'buzzer',
  prompt: toChosung(answer),
  answer,
  explanation,
  hint,
  accept,
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

/** hint: MC 비밀 정답지에만 보이는 한 줄 코멘트 */
export const ox = (prompt: string, answer: 'O' | 'X', explanation?: string, hint?: string): Draft<OxQ> => ({
  input: 'ox',
  prompt,
  answer,
  explanation,
  hint,
});

export const choice = (prompt: string, choices: [string, string, string, string], answer: 0 | 1 | 2 | 3, explanation?: string, hint?: string): Draft<ChoiceQ> => ({
  input: 'choice',
  prompt,
  choices,
  answer,
  explanation,
  hint,
});

/** 노래 제목 힌트: 한글 제목은 초성, 영어가 섞인 제목은 정답이 새지 않도록 글자 수만 */
export function titleHint(title: string): string {
  return /[A-Za-z]/.test(title)
    ? `제목 ${title.replace(/[^0-9A-Za-z가-힣]/g, '').length}글자${/[가-힣]/.test(title) ? ' (영어 포함)' : ' (영어 제목)'}`
    : `제목 초성 ${toChosung(title)}`;
}

/** 음악 퀴즈: 제목·가수·연도 + 유튜브 공식 영상 ID·후렴 시작 초 (hint 생략 시 가수·연도·제목 힌트 자동 생성) */
export const song = (title: string, artist: string, year: number, youtubeId: string, startSec: number, accept?: string[], hint?: string): Draft<BuzzerQ> => ({
  input: 'buzzer',
  prompt: '🎵 이 노래의 제목은?',
  answer: title,
  artist,
  year,
  accept,
  hint: hint ?? `🎤 ${artist} · ${year}년 발매 · ${titleHint(title)}`,
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
export const lyricQ = (title: string, artist: string, lyrics: string, accept?: string[], hint?: string, year?: number): Draft<BuzzerQ> => ({
  input: 'buzzer',
  prompt: '🤖 기계음 가사를 듣고 노래를 맞혀보세요!',
  answer: title,
  artist,
  year,
  lyrics,
  accept,
  hint,
  explanation: `${artist} - ${title}`,
});

/** 가사 낭독·음악 퀴즈 힌트 단계: 1 = 힌트 없음, 2 = 가수 공개, 3 = 제목 초성(영어 제목은 글자 수) */
export const TTS_HINT_SCORES = [30, 20, 10] as const;

/** 단계별 전광판 힌트 문구 [2단계, 3단계] */
export function ttsHints(q: { answer: string; artist?: string; year?: number }): [string, string] {
  const singer = `🎤 가수: ${q.artist ?? '?'}${q.year ? ` · ${q.year}년 발매` : ''}`;
  return [singer, `🔤 ${titleHint(q.answer)}`];
}
