import { category, zoomQ, type QuizType } from '../quiz';
import { ART } from '../zoomArt';
import { LOGO_ART as L } from '../zoomArtLogos';
import { THING_ART as T } from '../zoomArtThings';
import { withPhoto } from '../zoomPhotos';

/**
 * 줌인 퀴즈 (총 50문제) — 그림의 일부만 400%로 확대해서 보여주고, MC가 [범위 넓히기]로 200% → 100% 로 넓혀 갑니다.
 *  · 로고·상징 25 : 국기·올림픽·앱·브랜드 로고 "스타일" 그림
 *  · 사물·동물·표지판 25 : 음식·동물·생활용품·교통표지판
 * 이미지는 위키미디어 커먼즈의 실제 사진·로고 (zoomPhotos.ts, 출처는 CREDITS.md) 를 외부 URL 로 불러와요.
 * 사진을 못 불러오면(오프라인 등) 직접 그린 SVG 그림(zoomArt*.ts)이 자동으로 대신 나와요.
 * 첫 확대 구역은 art.fx / art.fy (0~100 %) — 사진이 있으면 zoomPhotos.ts 의 값을 써요.
 * 권장 배점: 1단계(400%) +30 → 2단계(200%) +20 → 3단계(전체) +10
 */
export const zoomQuiz: QuizType = {
  kind: 'zoom',
  title: '줌인 퀴즈',
  emoji: '🔍',
  input: 'buzzer',
  defaultSec: 30,
  desc: '확대된 그림 조각을 보고 버저를 눌러 맞히세요',
  categories: [
    category('zoom', 'logo', '로고·상징', [
      // ── 01~06 (기존) ──
      zoomQ('태극기', withPhoto('태극기', ART.taegeukgi), '대한민국 국기 — 태극 문양과 4괘', ['대한민국 국기', '한국 국기', '태극기'], '우리나라 국기'),
      zoomQ('영국 국기', withPhoto('영국', ART.unionJack), '유니언 잭 (Union Jack)', ['유니언잭', '유니언 잭', '영국국기', '영국'], '영국'),
      zoomQ('올림픽 오륜기', withPhoto('오륜기', ART.rings), '5개 대륙을 상징하는 다섯 개의 고리', ['오륜기', '올림픽', '올림픽 마크', '오륜'], '스포츠 대축제'),
      zoomQ('유튜브', withPhoto('유튜브', ART.youtube), '빨간 재생 버튼 로고', ['YouTube', '유투브', 'youtube'], '동영상 플랫폼'),
      zoomQ('카카오톡', withPhoto('카카오톡', ART.kakaotalk), '노란 바탕에 갈색 말풍선', ['카톡', '카카오', 'KakaoTalk'], '국민 메신저'),
      zoomQ('네이버', withPhoto('네이버', ART.naver), '초록색 N 로고', ['Naver', '네이버 로고'], '국내 1위 포털'),
      // ── 07~25 (신규 19) ──
      zoomQ('나이키', withPhoto('나이키', L.nike), '"Just Do It" — 스우시(Swoosh) 로고', ['Nike', '나이키 스우시', '스우시'], '스포츠 브랜드'),
      zoomQ('맥도날드', withPhoto('맥도날드', L.mcdonalds), '골든 아치(M자) 로고', ['McDonald\'s', '맥날', '맥도날드 M'], '햄버거 가게'),
      zoomQ('스타벅스', withPhoto('스타벅스', L.starbucks), '초록 원 안의 사이렌(인어) 로고 스타일', ['Starbucks', '스벅', '스타벅스 커피'], '커피 전문점'),
      zoomQ('애플', withPhoto('애플', L.apple), '한 입 베어 문 사과 로고 스타일', ['Apple', '아이폰', '애플 로고'], '아이폰 만드는 회사'),
      zoomQ('삼성', withPhoto('삼성', L.samsung), '파란 타원 로고 스타일', ['삼성전자', 'Samsung', '갤럭시'], '갤럭시 만드는 회사'),
      zoomQ('구글', withPhoto('구글', L.google), '빨강·노랑·초록·파랑 G 로고 스타일', ['Google', '구글 G'], '검색 엔진'),
      zoomQ('인스타그램', withPhoto('인스타그램', L.instagram), '그라데이션 카메라 아이콘', ['Instagram', '인스타', 'insta'], '사진 SNS'),
      zoomQ('엑스(X)', withPhoto('엑스', L.xLogo), '예전 이름은 트위터', ['X', '트위터', 'Twitter', '엑스'], '검은 바탕의 X'),
      zoomQ('넷플릭스', withPhoto('넷플릭스', L.netflix), '빨간 리본 모양의 N', ['Netflix'], '구독형 영상 스트리밍'),
      zoomQ('코카콜라', withPhoto('코카콜라', L.cocacola), '빨간 바탕에 흰 필기체와 물결', ['Coca-Cola', '코카 콜라', '콜라'], '탄산음료'),
      zoomQ('세븐일레븐', withPhoto('세븐일레븐', L.seven), '주황·초록·빨강 줄무늬 7', ['7-Eleven', '세븐 일레븐', '세븐일레븐 로고'], '편의점'),
      zoomQ('CU', withPhoto('CU', L.cu), '보라·초록 그라데이션 편의점 로고 스타일', ['씨유', 'cu', 'CU 편의점'], '편의점'),
      zoomQ('마이크로소프트', withPhoto('마이크로소프트', L.microsoft), '네 가지 색 사각형 — 윈도우 창문 모양', ['Microsoft', 'MS', '윈도우', '윈도우즈'], '윈도우를 만드는 회사'),
      zoomQ('몬스터볼', withPhoto('몬스터볼', L.pokeball), '포켓몬을 잡는 빨강·하양 공', ['포켓볼', '포켓몬', '포켓몬 볼', '몬스터 볼'], '피카츄가 나오는 게임'),
      zoomQ('스포티파이', withPhoto('스포티파이', L.spotify), '초록 원 안의 세 줄 음파', ['Spotify', '스포티 파이'], '음악 스트리밍'),
      zoomQ('아디다스', withPhoto('아디다스', L.adidas), '비스듬한 세 줄 — 삼선 로고', ['adidas', 'Adidas', '삼선', '아디다스 삼선'], '삼선 슬리퍼'),
      zoomQ('BMW', withPhoto('BMW', L.bmw), '파랑·하양 4분할 원형 엠블럼', ['비엠더블유', '비엠', '비엠더블유 로고'], '독일 자동차'),
      zoomQ('벤츠', withPhoto('벤츠', L.benz), '세 꼭짓점 별을 감싼 원', ['메르세데스 벤츠', '메르세데스-벤츠', 'Mercedes-Benz', 'Benz', '메르세데스'], '독일 자동차'),
      zoomQ('이케아', withPhoto('이케아', L.ikea), '파란 바탕에 노란 타원', ['IKEA', '아이케아'], '조립 가구 매장'),
    ]),
    category('zoom', 'thing', '사물·동물·표지판', [
      // ── 01~04 (기존) ──
      zoomQ('피자', withPhoto('피자', ART.pizza), '페퍼로니와 올리브가 올라간 피자', ['pizza', '페퍼로니 피자'], '이탈리아 음식'),
      zoomQ('고양이', withPhoto('고양이', ART.cat), '회색 줄무늬 고양이 얼굴', ['냥이', '고양이 얼굴', '냥냥이'], '야옹~'),
      zoomQ('수박', withPhoto('수박', ART.watermelon), '여름 과일 수박 한 조각', ['수박 한 조각', '수박조각'], '여름 과일'),
      zoomQ('무당벌레', withPhoto('무당벌레', ART.ladybug), '빨간 등에 검은 점', ['칠성무당벌레', '무당 벌레'], '곤충'),
      // ── 05~25 (신규 21) ──
      zoomQ('햄버거', withPhoto('햄버거', T.hamburger), '번·양상추·토마토·치즈·패티', ['버거', 'hamburger', '치즈버거'], '패스트푸드'),
      zoomQ('도넛', withPhoto('도넛', T.donut), '분홍 아이싱과 스프링클', ['도너츠', '도넛츠', 'donut', '도나츠', '도넛'], '구멍 뚫린 간식'),
      zoomQ('아이스크림', withPhoto('아이스크림', T.iceCream), '와플콘 위의 두 스쿱', ['아이스크림 콘', '콘 아이스크림', '아이스콘'], '여름 간식'),
      zoomQ('바나나', withPhoto('바나나', T.banana), '노란 곡선 과일', ['banana'], '원숭이가 좋아하는 과일'),
      zoomQ('딸기', withPhoto('딸기', T.strawberry), '겉에 씨가 박힌 빨간 과일', ['strawberry', '딸기 한 알'], '빨간 과일'),
      zoomQ('펭귄', withPhoto('펭귄', T.penguin), '남극에 사는 새', ['penguin', '핑구'], '남극 동물'),
      zoomQ('판다', withPhoto('판다', T.panda), '검은 눈 · 귀의 대나무 곰', ['팬더', '자이언트 판다', '판다곰', '푸바오'], '푸바오'),
      zoomQ('고무오리', withPhoto('고무오리', T.rubberDuck), '목욕 장난감 오리', ['오리', '러버덕', '고무 오리', '오리 인형', '러버 덕'], '욕조 장난감'),
      zoomQ('전구', withPhoto('전구', T.lightbulb), '필라멘트가 빛나는 백열전구', ['전등', '백열등', '전구 하나', '불빛', '라이트'], '아이디어가 떠오를 때 머리 위에!'),
      zoomQ('열쇠', withPhoto('열쇠', T.key), '금빛 열쇠', ['key', '키', '열쇠 하나'], '문을 여는 도구'),
      zoomQ('우산', withPhoto('우산', T.umbrella), '빨간 우산', ['umbrella', '빨간 우산'], '비 오는 날'),
      zoomQ('벽시계', withPhoto('벽시계', T.wallClock), '10시 10분을 가리키는 시계', ['시계', '벽걸이 시계', '아날로그 시계', '괘종시계'], '시간을 알려줘요'),
      zoomQ('헤드폰', withPhoto('헤드폰', T.headphones), '빨간 헤드폰', ['헤드셋', '이어폰', 'headphone', '헤드폰 하나'], '음악 들을 때'),
      zoomQ('카메라', withPhoto('카메라', T.camera), '렌즈가 달린 카메라', ['camera', '사진기', '디카', '카메라 하나'], '찰칵'),
      zoomQ('신호등', withPhoto('신호등', T.trafficLight), '초록불이 켜진 신호등', ['횡단보도 신호등', '교통 신호등', '신호등 하나', '초록불'], '건너도 될까요?'),
      zoomQ('가위', withPhoto('가위', T.scissors), '빨간 손잡이 가위', ['scissors', '가위 하나'], '자르는 도구'),
      zoomQ('진입금지', withPhoto('진입금지', T.noEntry), '빨간 원에 흰 가로 막대 표지판', ['진입 금지', '진입금지 표지판', '통행금지', '들어가지 마시오', '일방통행 반대'], '들어가면 안 돼요'),
      zoomQ('속도제한 50', withPhoto('속도제한', T.speed50), '최고 속도 제한 표지판', ['속도제한', '제한속도', '속도 제한', '속도제한 표지판', '50'], '시속 50km'),
      zoomQ('횡단보도', withPhoto('횡단보도', T.crosswalk), '파란 사각 표지판 속 보행자', ['횡단보도 표지판', '건널목', '횡단 보도', '보행자'], '길 건너는 곳'),
      zoomQ('주차장', withPhoto('주차장', T.parking), '파란 바탕에 흰 P', ['주차', 'P', '주차장 표지판', '파킹', '주차 표지판'], '차를 세우는 곳'),
      zoomQ('정지', withPhoto('정지', T.stopSign), '빨간 역삼각형 표지판', ['일시정지', '정지 표지판', 'STOP', '스톱', '멈춤'], '멈추세요'),
    ]),
  ],
};
