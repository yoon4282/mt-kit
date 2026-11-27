import { useEffect, useState } from 'react';
import type { ZoomArt, ZoomPhoto } from '../data/quiz';

/** 줌인 단계 → 확대 배율: 1 = 400%, 2 = 200%, 3 = 100%(전체) */
export const ZOOM_SCALE = { 1: 4, 2: 2, 3: 1 } as const;
export type ZoomLevel = keyof typeof ZOOM_SCALE;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** 사진을 불러오지 못하면 true (오프라인·링크 삭제 등) → 직접 그린 SVG 로 대신 보여줌 */
function usePhoto(photo: ZoomPhoto | undefined) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [photo?.src]);
  return { show: !!photo && !failed, onError: () => setFailed(true) };
}

/**
 * 그림/사진을 (fx, fy) 구역 중심으로 확대해서 보여주는 정사각형 프레임.
 * 확대 배율이 바뀔 때 CSS transition 으로 부드럽게 "범위가 넓어지는" 연출.
 */
export function ZoomFrame({ art, level, badge = true }: { art: ZoomArt; level: ZoomLevel; badge?: boolean }) {
  const z = ZOOM_SCALE[level];
  const { show, onError } = usePhoto(art.photo);
  // 확대 구역이 프레임 중앙에 오도록 이동 (그림 밖이 보이지 않게 가장자리에서 멈춤)
  const tx = clamp(50 - z * art.fx, 100 - 100 * z, 0);
  const ty = clamp(50 - z * art.fy, 100 - 100 * z, 0);
  return (
    <div className={`zoom-frame level-${level} ${show ? 'photo' : ''}`}>
      <div className="zoom-art" style={{ transform: `translate(${tx}%, ${ty}%) scale(${z})` }}>
        {show && art.photo ? (
          <img src={art.photo.src} alt="" draggable={false} referrerPolicy="no-referrer" onError={onError} style={{ objectFit: art.photo.fit }} />
        ) : (
          <div className="zoom-svg" dangerouslySetInnerHTML={{ __html: art.svg }} />
        )}
      </div>
      {badge && <span className="zoom-badge">🔍 {z * 100}%</span>}
      {show && art.photo && level === 3 && <span className="zoom-credit">📷 {art.photo.credit}</span>}
    </div>
  );
}

/** MC 비밀 정답지용 원본 (항상 전체). 사진이 있으면 사진, 없으면 SVG */
export function ArtPreview({ svg, photo }: { svg: string; photo?: ZoomPhoto }) {
  const { show, onError } = usePhoto(photo);
  if (show && photo) {
    return (
      <div className="art-preview photo">
        <img src={photo.src} alt="" draggable={false} referrerPolicy="no-referrer" onError={onError} style={{ objectFit: photo.fit }} />
      </div>
    );
  }
  return <div className="art-preview" dangerouslySetInnerHTML={{ __html: svg }} />;
}
