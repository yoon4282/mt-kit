// 내장 퀴즈 데이터 (외부 API 사용 없음)
// category: 'song' | 'typing' | 'buzz' | 'speed'
//
// ※ song.youtubeId 는 공개 영상 ID 를 최선으로 넣은 값입니다. 영상이 삭제/차단되면 재생이 실패하는데,
//    그 경우 전광판이 자동으로 notes(오프라인 멜로디)로 대체 재생합니다. 시연 전 한 번씩 [1초 듣기]로 확인하세요.
// ※ song.notes 는 [음이름, 길이(초)] 배열로, 곡의 도입부를 단순화한 근사 멜로디(약 1초)입니다. ['R', 초] = 쉼표.

export const CATEGORIES = [
  { key: 'song', label: '노래 1초 맞추기', icon: '🎵', mode: '버저 · 개인/팀' },
  { key: 'typing', label: '초성 & 이모지', icon: '⌨️', mode: '타이핑 · 개인/팀' },
  { key: 'buzz', label: '넌센스·상식 버저', icon: '🔔', mode: '선착순 · 개인/팀' },
  { key: 'speed', label: '스피드 퀴즈', icon: '⏱️', mode: '몸으로 말해요 · 팀전' },
];

export const SONGS = [
  { id: 'song-01', category: 'song', title: '강남스타일', artist: 'PSY', youtubeId: '9bZkp7q19f0', startSec: 46,
    hint: '2012년 전 세계를 말춤으로 휩쓴 곡', notes: [['D5', 0.12], ['D5', 0.12], ['A4', 0.12], ['D5', 0.12], ['E5', 0.12], ['D5', 0.12], ['A4', 0.12], ['D5', 0.16]] },
  { id: 'song-02', category: 'song', title: 'Dynamite', artist: 'BTS', youtubeId: 'gdZLi9oWNZg', startSec: 30,
    hint: '"Cos I-I-I\'m in the stars tonight"', notes: [['E5', 0.1], ['E5', 0.1], ['G5', 0.1], ['E5', 0.1], ['D5', 0.1], ['B4', 0.1], ['D5', 0.2], ['E5', 0.2]] },
  { id: 'song-03', category: 'song', title: 'Butter', artist: 'BTS', youtubeId: 'WMweEpGlu_U', startSec: 25,
    hint: '"Smooth like butter"', notes: [['F4', 0.12], ['F4', 0.12], ['A4', 0.12], ['C5', 0.18], ['A4', 0.12], ['F4', 0.12], ['G4', 0.22]] },
  { id: 'song-04', category: 'song', title: '봄날', artist: 'BTS', youtubeId: 'xEeFrLSkMm8', startSec: 60,
    hint: '"보고 싶다 이렇게 말하니까 더 보고 싶다"', notes: [['E4', 0.15], ['G4', 0.15], ['A4', 0.15], ['B4', 0.2], ['A4', 0.15], ['G4', 0.2]] },
  { id: 'song-05', category: 'song', title: '아기 상어', artist: '핑크퐁', youtubeId: 'XqZsoesa55w', startSec: 0,
    hint: '뚜루루뚜루~ 온 국민이 아는 동요', notes: [['D4', 0.13], ['E4', 0.13], ['G4', 0.13], ['G4', 0.13], ['G4', 0.13], ['G4', 0.13], ['G4', 0.13], ['G4', 0.19]] },
  { id: 'song-06', category: 'song', title: 'Despacito', artist: 'Luis Fonsi', youtubeId: 'kJQP7kiw5Fk', startSec: 70,
    hint: '유튜브 조회수 80억을 돌파한 라틴 팝', notes: [['B4', 0.15], ['A4', 0.15], ['F#4', 0.15], ['D4', 0.15], ['D4', 0.15], ['D4', 0.15], ['E4', 0.1]] },
  { id: 'song-07', category: 'song', title: 'Shape of You', artist: 'Ed Sheeran', youtubeId: 'JGwWNGJdvx8', startSec: 30,
    hint: '"I\'m in love with your body"', notes: [['C#5', 0.12], ['E5', 0.12], ['C#5', 0.12], ['B4', 0.12], ['C#5', 0.12], ['E5', 0.12], ['C#5', 0.12], ['B4', 0.16]] },
  { id: 'song-08', category: 'song', title: 'Uptown Funk', artist: 'Mark Ronson ft. Bruno Mars', youtubeId: 'OPf0YbXqDm0', startSec: 50,
    hint: '"Uptown funk you up!"', notes: [['D4', 0.1], ['D4', 0.1], ['D4', 0.1], ['F4', 0.1], ['D4', 0.1], ['C4', 0.1], ['D4', 0.2], ['A3', 0.2]] },
  { id: 'song-09', category: 'song', title: 'See You Again', artist: 'Wiz Khalifa ft. Charlie Puth', youtubeId: 'RgKAFK5djSk', startSec: 60,
    hint: '"It\'s been a long day without you my friend"', notes: [['C#5', 0.18], ['B4', 0.18], ['G#4', 0.18], ['E4', 0.18], ['G#4', 0.14], ['B4', 0.14]] },
  { id: 'song-10', category: 'song', title: 'Bohemian Rhapsody', artist: 'Queen', youtubeId: 'fJ9rUzIMcZQ', startSec: 20,
    hint: '"Is this the real life? Is this just fantasy?"', notes: [['Bb4', 0.14], ['Bb4', 0.14], ['G4', 0.14], ['Bb4', 0.14], ['C5', 0.14], ['Bb4', 0.14], ['G4', 0.16]] },
];

// kind: 'chosung' | 'emoji'. answers 는 정답으로 인정하는 표현들(공백·대소문자 무시).
export const TYPING = [
  { id: 'typ-01', category: 'typing', kind: 'chosung', topic: '음식', prompt: 'ㄱㅊㅉㄱ', answers: ['김치찌개'], explain: '한국인의 소울푸드' },
  { id: 'typ-02', category: 'typing', kind: 'chosung', topic: '분식', prompt: 'ㄸㅂㅇ', answers: ['떡볶이', '떡볶기'], explain: '매콤달콤 대표 분식' },
  { id: 'typ-03', category: 'typing', kind: 'chosung', topic: '음식', prompt: 'ㅉㅈㅁ', answers: ['짜장면', '자장면'], explain: '이사 가는 날의 단골 메뉴' },
  { id: 'typ-04', category: 'typing', kind: 'chosung', topic: '이번 학기 과목', prompt: 'ㅇㄱㅈㄴ', answers: ['인공지능'], explain: '인공지능프로그래밍 수업!' },
  { id: 'typ-05', category: 'typing', kind: 'chosung', topic: '술/MT', prompt: 'ㅁㄱㄹ', answers: ['막걸리'], explain: '파전과 찰떡궁합' },
  { id: 'typ-06', category: 'typing', kind: 'emoji', topic: '영화', prompt: '🦁👑', answers: ['라이온킹', '라이언킹'], explain: '디즈니 애니메이션 〈라이온 킹〉' },
  { id: 'typ-07', category: 'typing', kind: 'emoji', topic: '영화', prompt: '🧊👸❄️', answers: ['겨울왕국'], explain: '"Let it go~"' },
  { id: 'typ-08', category: 'typing', kind: 'emoji', topic: '영화', prompt: '🕷️🕸️🧍', answers: ['스파이더맨'], explain: '마블 히어로' },
  { id: 'typ-09', category: 'typing', kind: 'emoji', topic: '영화', prompt: '🚢🧊💑', answers: ['타이타닉'], explain: '"I\'m the king of the world!"' },
  { id: 'typ-10', category: 'typing', kind: 'emoji', topic: '영화', prompt: '🐠🔎', answers: ['니모를찾아서', '니모'], explain: '디즈니·픽사 〈니모를 찾아서〉' },
];

export const BUZZ = [
  { id: 'buz-01', category: 'buzz', question: '세상에서 가장 뜨거운 바다는?', answers: ['열바다'], explain: '열(熱) + 바다' },
  { id: 'buz-02', category: 'buzz', question: '왕이 넘어지면?', answers: ['킹콩'], explain: '킹(King) + 콩!' },
  { id: 'buz-03', category: 'buzz', question: '거꾸로 읽어도 똑같은 과일은?', answers: ['토마토'], explain: '토-마-토' },
  { id: 'buz-04', category: 'buzz', question: '개가 사람을 가르치면?', answers: ['개인지도'], explain: '개 + 人 지도' },
  { id: 'buz-05', category: 'buzz', question: '태양계에서 가장 큰 행성은?', answers: ['목성'], explain: '지구 지름의 약 11배' },
  { id: 'buz-06', category: 'buzz', question: '훈민정음(한글)을 만든 임금님은?', answers: ['세종대왕', '세종'], explain: '1443년 창제, 1446년 반포' },
  { id: 'buz-07', category: 'buzz', question: '축구 경기에서 한 팀이 경기장에서 뛰는 선수는 모두 몇 명?', answers: ['11명', '11', '열한명'], explain: '골키퍼 포함 11명' },
  { id: 'buz-08', category: 'buzz', question: '올림픽 오륜기의 고리는 모두 몇 개?', answers: ['5개', '5', '다섯개'], explain: '5개 대륙을 상징' },
  { id: 'buz-09', category: 'buzz', question: '바나나가 웃으면?', answers: ['바나나킥'], explain: '바나나 + 킥킥' },
  { id: 'buz-10', category: 'buzz', question: '원의 둘레와 지름의 비, 3.14로 시작하는 수학 상수는?', answers: ['원주율', '파이', 'π'], explain: '무한히 이어지는 무리수' },
];

// 스피드 퀴즈: 한 세트 = 제시어 목록 (제한 시간 동안 O/X 로 넘김)
export const SPEED = [
  { id: 'spd-01', category: 'speed', topic: '동물', seconds: 60, words: ['코끼리', '기린', '펭귄', '캥거루', '악어', '고슴도치', '원숭이', '토끼', '사자', '거북이', '다람쥐', '하마', '독수리', '문어', '카멜레온'] },
  { id: 'spd-02', category: 'speed', topic: '음식', seconds: 60, words: ['라면', '삼겹살', '피자', '초밥', '떡볶이', '햄버거', '냉면', '치킨', '붕어빵', '탕후루', '김밥', '아이스크림', '짬뽕', '샌드위치', '마라탕'] },
  { id: 'spd-03', category: 'speed', topic: '직업', seconds: 60, words: ['소방관', '의사', '요리사', '경찰관', '가수', '개발자', '유튜버', '선생님', '농부', '변호사', '파일럿', '미용사', '화가', '축구선수', '우주비행사'] },
  { id: 'spd-04', category: 'speed', topic: '영화·애니', seconds: 60, words: ['어벤져스', '토이스토리', '짱구는 못말려', '해리포터', '겨울왕국', '기생충', '쿵푸팬더', '인사이드 아웃', '포켓몬스터', '명탐정 코난', '슬램덩크', '원피스', '스파이더맨', '엘사', '미니언즈'] },
  { id: 'spd-05', category: 'speed', topic: '운동·스포츠', seconds: 60, words: ['축구', '수영', '볼링', '양궁', '스키', '태권도', '탁구', '배드민턴', '골프', '농구', '씨름', '줄넘기', '역도', '스케이트', '권투'] },
  { id: 'spd-06', category: 'speed', topic: '대학 생활', seconds: 60, words: ['MT', '중간고사', '학식', '과잠', '조별과제', '수강신청', '출석체크', '동아리방', '교수님', '밤샘', '학점', '장학금', '축제', '술게임', '기숙사'] },
  { id: 'spd-07', category: 'speed', topic: '생활용품', seconds: 60, words: ['칫솔', '우산', '냉장고', '선풍기', '리모컨', '가위', '거울', '이어폰', '쓰레기통', '청소기', '전자레인지', '충전기', '베개', '손톱깎이', '헤어드라이어'] },
  { id: 'spd-08', category: 'speed', topic: '나라·도시', seconds: 60, words: ['미국', '일본', '프랑스', '이집트', '브라질', '서울', '부산', '제주도', '뉴욕', '파리', '런던', '호주', '인도', '독일', '하와이'] },
  { id: 'spd-09', category: 'speed', topic: '동작·행동', seconds: 60, words: ['양치질', '악수', '낚시', '운전', '요가', '노래방', '세수', '빨래', '셀카', '게임', '청소', '댄스', '샤워', '줄다리기', '하품'] },
  { id: 'spd-10', category: 'speed', topic: '인공지능·IT', seconds: 60, words: ['챗GPT', '스마트폰', '와이파이', '유튜브', '인스타그램', '로봇청소기', '자율주행', '키보드', '마우스', '노트북', '카카오톡', '비밀번호', '해킹', '코딩', '이모티콘'] },
];

export const QUIZ_BY_CATEGORY = { song: SONGS, typing: TYPING, buzz: BUZZ, speed: SPEED };
export const ALL_QUIZZES = [...SONGS, ...TYPING, ...BUZZ, ...SPEED];
const INDEX = Object.fromEntries(ALL_QUIZZES.map((q) => [q.id, q]));
export const getQuiz = (id) => INDEX[id] || null;
