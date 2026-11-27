import type { Category, Question, QuizKind, QuizType } from '../quiz';
import { chosungQuiz } from './chosung';
import { oxQuiz } from './ox';
import { choiceQuiz } from './choice';
import { emojiQuiz } from './emoji';
import { speedQuiz } from './speed';
import { musicQuiz } from './music';
import { zoomQuiz } from './zoom';
import { ttsQuiz } from './tts';

export const QUIZ_TYPES: QuizType[] = [chosungQuiz, oxQuiz, choiceQuiz, emojiQuiz, speedQuiz, musicQuiz, zoomQuiz, ttsQuiz];

export interface QuestionRef {
  type: QuizType;
  category: Category;
  question: Question;
  /** 카테고리 안에서의 순번 (0부터) */
  index: number;
}

const byId = new Map<string, QuestionRef>();
for (const type of QUIZ_TYPES) {
  for (const cat of type.categories) {
    cat.questions.forEach((question, index) => {
      if (byId.has(question.id)) console.warn('[quiz] 중복 문제 ID', question.id);
      byId.set(question.id, { type, category: cat, question, index });
    });
  }
}

/** 문제 데이터 검증 — 개발 모드에서 콘솔에 경고, window.__quizReport 로 요약 확인 */
export function validateQuizzes(): string[] {
  const problems: string[] = [];
  for (const type of QUIZ_TYPES) {
    for (const cat of type.categories) {
      // 줌인·가사 낭독 퀴즈는 샘플(각 10문제)이라 문항 수 검사를 건너뜀
      const expected = type.kind === 'music' ? 50 : 20;
      if (type.kind !== 'zoom' && type.kind !== 'tts' && cat.questions.length !== expected)
        problems.push(`${type.title}/${cat.name}: ${cat.questions.length}문항 (기대 ${expected})`);
      const answers = new Set<string>();
      for (const q of cat.questions) {
        if (!q.prompt.trim()) problems.push(`${q.id}: 문제 비어 있음`);
        if (q.input !== type.input) problems.push(`${q.id}: 입력 방식 불일치`);
        if (q.input === 'choice') {
          if (q.choices.length !== 4) problems.push(`${q.id}: 보기 ${q.choices.length}개`);
          if (!(q.answer >= 0 && q.answer < q.choices.length)) problems.push(`${q.id}: 정답 번호 범위 밖`);
          if (new Set(q.choices).size !== q.choices.length) problems.push(`${q.id}: 보기 중복`);
        }
        if (q.input === 'buzzer' && type.kind === 'music' && !q.media) problems.push(`${q.id}: 음악 영상 없음`);
        // 같은 문제가 두 번 들어갔는지 (음악·맞춤법처럼 문구가 같은 유형은 정답/보기로 비교)
        if (type.kind === 'zoom' && !(q.input === 'buzzer' && q.art)) problems.push(`${q.id}: 줌인 그림 없음`);
        if (type.kind === 'tts' && !(q.input === 'buzzer' && q.lyrics?.trim())) problems.push(`${q.id}: 가사 없음`);
        const key = type.kind === 'music' || type.kind === 'zoom' || type.kind === 'tts' ? String(q.answer) : q.input === 'choice' ? q.prompt + q.choices.join('|') : q.prompt;
        if (answers.has(key)) problems.push(`${q.id}: 같은 카테고리에 중복 (${key})`);
        answers.add(key);
      }
    }
  }
  return problems;
}

if (import.meta.env.DEV) {
  const problems = validateQuizzes();
  const total = QUIZ_TYPES.reduce((n, t) => n + t.categories.reduce((m, c) => m + c.questions.length, 0), 0);
  (window as unknown as { __quizReport: unknown }).__quizReport = { total, problems };
  if (problems.length) console.warn('[quiz] 데이터 문제', problems);
}

export const findQuestion =(id: string | null | undefined) => (id ? byId.get(id) : undefined);
export const findType = (kind: QuizKind | null | undefined) => QUIZ_TYPES.find((t) => t.kind === kind);
export const findCategory = (kind: QuizKind | null | undefined, catId: string | null | undefined) =>
  findType(kind)?.categories.find((c) => c.id === catId);
