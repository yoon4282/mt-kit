import { category, lyricQ, toChosung, type QuizType } from '../quiz';

/**
 * 가사 TTS 퀴즈 (총 50곡) — 음원 없이 브라우저 음성합성(speechSynthesis)이 가사를 감정 없이 읽어 줍니다.
 *
 * ※ 가사는 저작권이 있으므로 곡마다 "짧은 후렴 한 구절"만 넣었습니다 (퀴즈용 인용).
 *    더 길게 읽히고 싶으면 lyrics 문자열을 늘릴 수 있지만, 곡 전체/긴 구절은 넣지 않는 걸 권장해요.
 * ※ 가사·발매 연도는 기억에 의존해 적은 것이라 시연 전에 한 번씩 들어 보고 틀린 부분은 고쳐 주세요.
 *    (영어 후렴은 한국어 음성이 읽어서 더 웃기게 들려요 😄)
 * 정답 표시는 MC 화면에 "가수 - 제목" 으로 나옵니다 (answerText).
 */

const hasHangul = (s: string) => /[가-힣]/.test(s);
const hasLatin = (s: string) => /[A-Za-z]/.test(s);

/** 힌트: 발매 연도 + 초성 (영어가 섞인 제목은 정답이 새지 않도록 글자 수만) */
function hintOf(title: string, year?: number): string {
  const y = year ? `${year}년 발매` : '';
  const t = hasLatin(title)
    ? `제목 ${title.replace(/\s/g, '').length}글자${hasHangul(title) ? ' (영어 포함)' : ' (영어 제목)'}`
    : `초성 ${toChosung(title)}`;
  return [y, t].filter(Boolean).join(' · ');
}

const song = (title: string, artist: string, lyrics: string, year?: number, accept?: string[]) =>
  lyricQ(title, artist, lyrics, accept, hintOf(title, year));

export const ttsQuiz: QuizType = {
  kind: 'tts',
  title: '가사 낭독 퀴즈',
  emoji: '🤖',
  input: 'buzzer',
  defaultSec: 30,
  desc: '기계음이 읽어 주는 가사를 듣고 버저를 눌러 노래를 맞히세요',
  categories: [
    category('tts', 'kpop', 'K-POP 가사', [
      // ── 01~10 (기존) ──
      lyricQ('강남스타일', '싸이', '오빤 강남스타일', ['강남 스타일'], '말춤'),
      lyricQ('봄날', '방탄소년단', '보고 싶다 이렇게 말하니까 더 보고 싶다', ['Spring Day', 'BTS 봄날'], '겨울 지나 봄이 오듯'),
      lyricQ('아무 노래', '지코', '아무 노래나 일단 틀어봐', ['아무노래'], '챌린지로 유명'),
      lyricQ('좋은 날', '아이유', '어쩜 이렇게 하늘은 더 파란 건지', ['좋은날'], '고음 파트로 유명'),
      lyricQ('밤편지', '아이유', '이 밤 그날의 반딧불을 당신의 창 가까이 보낼게요', ['밤 편지'], '잔잔한 발라드'),
      lyricQ('벚꽃 엔딩', '버스커 버스커', '봄바람 휘날리며 흩날리는 벚꽃 잎이', ['벚꽃엔딩'], '봄마다 역주행'),
      lyricQ('TT', '트와이스', '이러지도 저러지도 못하는 이런 내 맘', ['티티', 'TT 트와이스'], 'ㅠㅠ 표정 안무'),
      lyricQ('뚜두뚜두', '블랙핑크', '뚜두뚜두 뚜두뚜두', ['DDU-DU DDU-DU', '뚜두 뚜두'], '블랙핑크 대표곡'),
      lyricQ('다시 만난 세계', '소녀시대', '다시 만난 세계', ['다만세'], '데뷔 초 대표곡'),
      lyricQ('어머님이 누구니', '박진영', '어머님이 누구니', ['어머님이누구니'], '가수 겸 프로듀서'),

      // ── 11~50 (신규 40) ──
      // 아이브 · 에스파 · 뉴진스 · (여자)아이들 · 있지
      song('LOVE DIVE', '아이브', 'Love Dive, Love Dive', 2022, ['러브 다이브', '러브다이브', 'LOVEDIVE']),
      song('After LIKE', '아이브', 'After LIKE, After LIKE', 2022, ['애프터 라이크', '애프터라이크']),
      song('Next Level', '에스파', "I'm on the Next Level, 저 너머의 문을 열어", 2021, ['넥스트 레벨', '넥스트레벨', 'NEXT LEVEL']),
      song('Super Shy', '뉴진스', "I'm super shy, super shy", 2023, ['슈퍼 샤이', '슈퍼샤이']),
      song('Hype Boy', '뉴진스', 'Cause I know what you like boy', 2022, ['하입 보이', '하이프 보이', '하입보이']),
      song('Ditto', '뉴진스', 'Stay in the middle, like you a little', 2022, ['디토', '디또']),
      song('TOMBOY', '(여자)아이들', 'Tomboy, tomboy', 2022, ['톰보이', '아이들 톰보이']),
      song('DALLA DALLA', '있지', '달라 달라', 2019, ['달라달라', 'ITZY 달라달라']),

      // 빅뱅 · 지드래곤
      song('거짓말', '빅뱅', '거짓말 거짓말 거짓말 거짓말', 2007, ['거짓말 빅뱅', 'Lies']),
      song('뱅뱅뱅', '빅뱅', '뱅 뱅 뱅', 2015, ['뱅 뱅 뱅', 'BANG BANG BANG', '뱅뱅뱅 빅뱅']),
      song('판타스틱 베이비', '빅뱅', 'Wow, fantastic baby', 2012, ['Fantastic Baby', '판타스틱베이비']),

      // 방탄소년단
      song('Dynamite', '방탄소년단', "Cause I-I-I'm in the stars tonight", 2020, ['다이너마이트', 'BTS 다이너마이트']),
      song('Butter', '방탄소년단', 'Smooth like butter', 2021, ['버터', 'BTS 버터']),
      song('불타오르네', '방탄소년단', '싹 다 불태워라', 2016, ['FIRE', '파이어', '불타오르네 Fire']),

      // 아이유 · 윤하 · 볼빨간사춘기
      song('에잇', '아이유', 'So are you happy now', 2020, ['Eight', '에잇 아이유', '에이트']),
      song('삐삐', '아이유', '삐삐 삐삐 삐삐', 2018, ['BBIBBI', '삐삐 아이유']),
      song('사건의 지평선', '윤하', '사건의 지평선', undefined, ['사건의지평선']),
      song('우주를 줄게', '볼빨간사춘기', '우주를 줄게', 2016, ['우주를줄게', '볼빨간 사춘기 우주를 줄게']),

      // 데이식스 · 잔나비 · 버스커 버스커
      song('예뻤어', '데이식스', '예뻤어 예뻤어', 2015, ['데이식스 예뻤어', 'You Were Beautiful']),
      song('한 페이지가 될 수 있게', '데이식스', '한 페이지가 될 수 있게', 2017, ['한페이지가 될 수 있게', '한 페이지']),
      song('Welcome to the Show', '데이식스', 'Welcome to the show', 2024, ['웰컴 투 더 쇼', '웰컴투더쇼']),
      song('뜨거운 여름밤은 가고 남은 건 볼품없지만', '잔나비', '뜨거운 여름밤은 가고 남은 건 볼품없지만', undefined, ['뜨거운 여름밤은 가고', '뜨여가', '뜨거운 여름밤']),
      song('여수 밤바다', '버스커 버스커', '여수 밤바다 이 조명에 담긴 아름다운 얘기가', 2012, ['여수밤바다']),

      // 트와이스 · 세븐틴 · 블랙핑크
      song('Cheer Up', '트와이스', 'Cheer up baby, cheer up baby', 2016, ['치어업', '치어 업', '치얼업']),
      song('아주 NICE', '세븐틴', '아주 나이스', 2017, ['아주 나이스', '아주나이스', 'VERY NICE', 'Very Nice']),
      song('How You Like That', '블랙핑크', 'How you like that', 2020, ['하우 유 라이크 댓', '하우유라이크댓']),
      song('Kill This Love', '블랙핑크', 'Kill this love', 2019, ['킬 디스 러브', '킬디스러브']),

      // 걸그룹 레전드
      song('Gee', '소녀시대', 'Gee gee gee gee baby baby baby', 2009, ['지', '소녀시대 Gee', '지 지 지']),
      song('Tell Me', '원더걸스', 'Tell me tell me tell me tell me', 2007, ['텔미', '텔 미']),
      song('Nobody', '원더걸스', 'I want nobody nobody but you', 2008, ['노바디', '노바디 노바디']),
      song('I Am the Best', '2NE1', 'I am the best', 2011, ['아이 엠 더 베스트', '내가 제일 잘 나가', '아이엠더베스트']),
      song('Mr. Chu', '에이핑크', 'Mister Chu', 2014, ['미스터 츄', '미스터츄', 'Mr.Chu', 'Mr Chu']),
      song('빨간 맛', '레드벨벳', '빨간 맛 궁금해 Honey', 2017, ['Red Flavor', '빨간맛', '레드 플레이버']),
      song('음오아예', '마마무', '음 오 아 예', 2014, ['음 오 아 예', '음오아예 마마무', 'Mr. Ambiguous']),

      // 남자 아이돌 레전드
      song('Ring Ding Dong', '샤이니', 'Ring ding dong', 2009, ['링딩동', '링 딩 동']),
      song('Sorry Sorry', '슈퍼주니어', 'Sorry sorry sorry sorry', 2009, ['쏘리 쏘리', '쏘리쏘리', '소리소리']),
      song('사랑을 했다', '아이콘', '사랑을 했다 우리가 만나', 2018, ['사랑을했다', 'LOVE SCENARIO', '러브 시나리오']),
      song('으르렁', '엑소', '으르렁 으르렁 으르렁', 2013, ['Growl', '그로울', '으르렁 엑소']),

      // 옛날 노래 · 싸이
      song('젠틀맨', '싸이', "I'm a mother father gentleman", 2013, ['Gentleman', '젠틀 맨']),
      song('쿵따리 샤바라', '클론', '쿵따리 샤바라 빠빠빠 빠빠빠', 1996, ['쿵따리샤바라', '쿵따리 샤바라 클론']),
    ]),
  ],
};
