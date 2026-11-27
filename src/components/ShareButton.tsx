import { useState } from 'react';
import { kakaoEnabled, nativeShareAvailable, shareLink } from '../lib/share';

interface Props {
  url: string;
  title: string;
  text: string;
  className?: string;
}

/** 참가 링크 공유 버튼 — 카카오톡(키 설정 시) → 기기 공유창 → 링크 복사 */
export function ShareButton({ url, title, text, className = 'btn kakao' }: Props) {
  const [msg, setMsg] = useState<string | null>(null);
  const label = kakaoEnabled() ? '카카오톡 공유' : nativeShareAvailable() ? '카톡·공유하기' : '링크 복사 (카톡 붙여넣기)';

  const onClick = async () => {
    const r = await shareLink({ url, title, text });
    const text2 =
      r === 'copied' ? '복사됨! 카톡 대화방에 붙여넣으세요' : r === 'failed' ? '공유에 실패했어요. 링크를 직접 복사해 주세요' : null;
    if (text2) {
      setMsg(text2);
      setTimeout(() => setMsg(null), 2500);
    }
  };

  return (
    <span className="share-wrap">
      <button type="button" className={className} onClick={onClick}>
        <span className="kakao-icon" aria-hidden>
          💬
        </span>
        {label}
      </button>
      {msg && <span className="share-msg">{msg}</span>}
    </span>
  );
}
