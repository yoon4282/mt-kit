import type { ZoomArt } from '../data/quiz';

/** 줌인 단계 → 확대 배율: 1 = 400%, 2 = 200%, 3 = 100%(전체) */
export const ZOOM_SCALE = { 1: 4, 2: 2, 3: 1 } as const;
export type ZoomLevel = keyof typeof ZOOM_SCALE;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/**
 * SVG 그림을 (fx, fy) 구역 중심으로 확대해서 보여주는 정사각형 프레임.
 * 확대 배율이 바뀔 때 CSS transition 으로 부드럽게 "범위가 넓어지는" 연출.
 */
export function ZoomFrame({ art, level, badge = true }: { art: ZoomArt; level: ZoomLevel; badge?: boolean }) {
  const z = ZOOM_SCALE[level];
  // 확대 구역이 프레임 중앙에 오도록 이동 (그림 밖이 보이지 않게 가장자리에서 멈춤)
  const tx = clamp(50 - z * art.fx, 100 - 100 * z, 0);
  const ty = clamp(50 - z * art.fy, 100 - 100 * z, 0);
  return (
    <div className={`zoom-frame level-${level}`}>
      <div className="zoom-art" style={{ transform: `translate(${tx}%, ${ty}%) scale(${z})` }} dangerouslySetInnerHTML={{ __html: art.svg }} />
      {badge && <span className="zoom-badge">🔍 {z * 100}%</span>}
    </div>
  );
}

/** MC 비밀 정답지용 원본 그림 (항상 전체) */
export function ArtPreview({ svg }: { svg: string }) {
  return <div className="art-preview" dangerouslySetInnerHTML={{ __html: svg }} />;
}
