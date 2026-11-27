import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { ShareButton } from './ShareButton';

interface Props {
  title: string;
  subtitle?: string;
  url: string;
  accent?: string;
  size?: number;
  /** 있으면 카카오톡/공유 버튼 표시 (참가자 링크 전용 — MC 링크는 공유하면 안 됨) */
  share?: { title: string; text: string };
}

/** 브라우저 안에서 QR 생성 (외부 API 호출 없음) */
export function QRCard({ title, subtitle, url, accent = '#8b7bff', size = 220, share }: Props) {
  const [src, setSrc] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(url, { margin: 1, width: size * 2, errorCorrectionLevel: 'M' })
      .then((d) => alive && setSrc(d))
      .catch(() => alive && setSrc(''));
    return () => {
      alive = false;
    };
  }, [url, size]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* 클립보드 권한 없음 */
    }
  };

  return (
    <div className="qr-card" style={{ ['--accent' as string]: accent }}>
      <div className="qr-title">{title}</div>
      {subtitle && <div className="qr-sub">{subtitle}</div>}
      <a href={url} target="_blank" rel="noreferrer" title="새 탭에서 열기 (테스트용)">
        {src ? <img src={src} width={size} height={size} alt={`${title} QR 코드`} /> : <div className="qr-ph" style={{ width: size, height: size }} />}
      </a>
      {share && <ShareButton url={url} title={share.title} text={share.text} />}
      <div className="qr-actions">
        <a href={url} target="_blank" rel="noreferrer">새 탭 열기</a>
        <button type="button" className="link-btn" onClick={copy}>{copied ? '복사됨!' : '링크 복사'}</button>
      </div>
    </div>
  );
}
