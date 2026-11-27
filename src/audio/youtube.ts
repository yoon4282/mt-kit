/**
 * 유튜브 IFrame Player API 로더 (공식 임베드 — 음원을 앱에 포함하지 않음)
 * https://developers.google.com/youtube/iframe_api_reference
 */

export interface YTPlayer {
  cueVideoById(opts: { videoId: string; startSeconds?: number }): void;
  loadVideoById(opts: { videoId: string; startSeconds?: number }): void;
  playVideo(): void;
  pauseVideo(): void;
  seekTo(sec: number, allowSeekAhead: boolean): void;
  unMute(): void;
  setVolume(v: number): void;
  getPlayerState(): number;
  destroy(): void;
}

interface YTNamespace {
  Player: new (
    el: HTMLElement,
    opts: {
      width?: number | string;
      height?: number | string;
      videoId?: string;
      playerVars?: Record<string, number | string>;
      events?: {
        onReady?: (e: { target: YTPlayer }) => void;
        onStateChange?: (e: { data: number; target: YTPlayer }) => void;
        onError?: (e: { data: number }) => void;
      };
    },
  ) => YTPlayer;
  PlayerState: { PLAYING: number; PAUSED: number; ENDED: number; BUFFERING: number; CUED: number };
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let loading: Promise<YTNamespace> | null = null;

export function loadYouTube(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve(window.YT!);
    };
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    s.async = true;
    s.onerror = () => {
      loading = null;
      reject(new Error('유튜브 플레이어를 불러오지 못했어요 (인터넷 연결 확인)'));
    };
    document.head.appendChild(s);
  });
  return loading;
}

/** 유튜브 오류 코드 → 안내 문구 */
export function ytErrorText(code: number): string {
  if (code === 101 || code === 150) return '이 영상은 외부 사이트 재생이 막혀 있어요';
  if (code === 100) return '영상을 찾을 수 없어요 (삭제/비공개)';
  if (code === 2) return '영상 ID가 올바르지 않아요';
  return `재생 오류 (${code})`;
}
