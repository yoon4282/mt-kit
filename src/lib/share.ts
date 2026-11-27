import { KAKAO_JS_KEY } from '../config';

/**
 * 링크 공유: 카카오톡 → 기기 공유창 → 링크 복사 순서로 시도.
 *  1) 카카오 JavaScript 키가 있으면 카카오톡 공유창 (노트북·폰 모두, 친구/단톡방 선택)
 *  2) 없으면 기기 공유창 (폰에서는 카카오톡이 목록에 나옴)
 *  3) 둘 다 안 되면 클립보드에 복사
 */

// 카카오 JavaScript SDK (공식 CDN, 무결성 해시로 변조 방지)
const KAKAO_SDK_URL = 'https://t1.kakaocdn.net/kakao_js_sdk/2.8.3/kakao.min.js';
const KAKAO_SDK_SRI = 'sha384-oroumrnFVE0xtgqyDZJARgERibXg2C28380uaUZz2kHDS5CR7tu20eGiOU6GkTpy';

interface KakaoSdk {
  init(key: string): void;
  isInitialized(): boolean;
  Share: {
    sendDefault(settings: {
      objectType: 'text';
      text: string;
      link: { mobileWebUrl: string; webUrl: string };
      buttonTitle?: string;
    }): void;
  };
}

declare global {
  interface Window {
    Kakao?: KakaoSdk;
  }
}

let sdkLoading: Promise<KakaoSdk> | null = null;

function loadKakao(): Promise<KakaoSdk> {
  if (window.Kakao) return Promise.resolve(window.Kakao);
  if (sdkLoading) return sdkLoading;
  sdkLoading = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = KAKAO_SDK_URL;
    s.integrity = KAKAO_SDK_SRI;
    s.crossOrigin = 'anonymous';
    s.onload = () => (window.Kakao ? resolve(window.Kakao) : reject(new Error('Kakao SDK 없음')));
    s.onerror = () => {
      sdkLoading = null;
      reject(new Error('카카오 SDK를 불러오지 못했어요'));
    };
    document.head.appendChild(s);
  });
  return sdkLoading;
}

export const kakaoEnabled = () => !!KAKAO_JS_KEY;

/** 기기 공유창 지원 여부 (주로 폰) */
export const nativeShareAvailable = () => typeof navigator !== 'undefined' && typeof navigator.share === 'function';

export type ShareResult = 'kakao' | 'native' | 'copied' | 'cancelled' | 'failed';

export async function shareLink(opts: { url: string; title: string; text: string; buttonTitle?: string }): Promise<ShareResult> {
  const { url, title, text, buttonTitle = '입장하기' } = opts;

  if (KAKAO_JS_KEY) {
    try {
      const Kakao = await loadKakao();
      if (!Kakao.isInitialized()) Kakao.init(KAKAO_JS_KEY);
      Kakao.Share.sendDefault({
        objectType: 'text',
        text: `${title}\n${text}`,
        link: { mobileWebUrl: url, webUrl: url },
        buttonTitle,
      });
      return 'kakao';
    } catch {
      /* 카카오 실패 시 아래 방법으로 */
    }
  }

  if (nativeShareAvailable()) {
    try {
      await navigator.share({ title, text, url });
      return 'native';
    } catch (e) {
      if ((e as DOMException)?.name === 'AbortError') return 'cancelled';
    }
  }

  return (await copyText(`${text}\n${url}`)) ? 'copied' : 'failed';
}

/** 클립보드 복사 — 권한이 막힌 브라우저(일부 인앱 브라우저 등)는 예전 방식으로 한 번 더 시도 */
export async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = value;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}
