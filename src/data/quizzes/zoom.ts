import { category, zoomQ, type QuizType } from '../quiz';
import { ART } from '../zoomArt';

/**
 * 줌인 퀴즈 — 그림의 일부만 400%로 확대해서 보여주고, MC가 [범위 넓히기]로 200% → 100% 로 넓혀 갑니다.
 * 그림은 모두 코드로 그린 SVG (src/data/zoomArt.ts) 라 이미지 파일이 필요 없어요.
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
    category('zoom', 'logo', '로고·국기', [
      zoomQ('태극기', ART.taegeukgi, '대한민국 국기 — 태극 문양과 4괘', ['대한민국 국기', '한국 국기', '태극기'], '우리나라 국기'),
      zoomQ('영국 국기', ART.unionJack, '유니언 잭 (Union Jack)', ['유니언잭', '유니언 잭', '영국국기', '영국'], '영국'),
      zoomQ('올림픽 오륜기', ART.rings, '5개 대륙을 상징하는 다섯 개의 고리', ['오륜기', '올림픽', '올림픽 마크', '오륜'], '스포츠 대축제'),
      zoomQ('유튜브', ART.youtube, '빨간 재생 버튼 로고', ['YouTube', '유투브', 'youtube'], '동영상 플랫폼'),
      zoomQ('카카오톡', ART.kakaotalk, '노란 바탕에 갈색 말풍선', ['카톡', '카카오', 'KakaoTalk'], '국민 메신저'),
      zoomQ('네이버', ART.naver, '초록색 N 로고', ['Naver', '네이버 로고'], '국내 1위 포털'),
    ]),
    category('zoom', 'thing', '사물·동물', [
      zoomQ('피자', ART.pizza, '페퍼로니와 올리브가 올라간 피자', ['pizza', '페퍼로니 피자'], '이탈리아 음식'),
      zoomQ('고양이', ART.cat, '회색 줄무늬 고양이 얼굴', ['냥이', '고양이 얼굴', '냥냥이'], '야옹~'),
      zoomQ('수박', ART.watermelon, '여름 과일 수박 한 조각', ['수박 한 조각', '수박조각'], '여름 과일'),
      zoomQ('무당벌레', ART.ladybug, '빨간 등에 검은 점', ['칠성무당벌레', '무당 벌레'], '곤충'),
    ]),
  ],
};
