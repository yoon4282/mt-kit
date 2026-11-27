import { useEffect, useRef, useState } from 'react';

interface Props {
  /** 읽어 줄 가사 — 화면에는 절대 표시하지 않고 음성으로만 재생 */
  lyrics: string | undefined;
  /** seq 가 바뀔 때마다 delayMs 뒤 rate 배속으로 낭독 */
  tts: { seq: number; rate: number; delayMs?: number };
  /** 정답 공개 후에는 낭독을 멈추고 조용히 */
  revealed: boolean;
  /** seq 번째 낭독이 끝남 (오류로 못 읽은 경우 포함) → 버저 열기 */
  onEnd?: (seq: number) => void;
}

const koVoice = () => window.speechSynthesis?.getVoices().find((v) => v.lang.toLowerCase().replace('_', '-').startsWith('ko'));

/**
 * 전광판 전용 가사 낭독기 (Web Speech API / speechSynthesis).
 * 감정 없는 기계음처럼 들리도록 억양(pitch)을 낮추고 일정한 속도로 읽고,
 * 화면에는 가사 대신 음파 애니메이션만 보여 준다.
 */
export function TtsSpeaker({ lyrics, tts, revealed, onEnd }: Props) {
  const lastSeq = useRef(tts.seq);
  const lyricsRef = useRef(lyrics);
  lyricsRef.current = lyrics;
  const timerRef = useRef<number | undefined>(undefined);
  const onEndRef = useRef(onEnd);
  onEndRef.current = onEnd;
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noKorean, setNoKorean] = useState(false);

  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const stop = () => {
    window.clearTimeout(timerRef.current);
    if (supported) window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  // 한국어 음성이 있는지 확인 (일부 브라우저는 목록이 늦게 채워짐)
  useEffect(() => {
    if (!supported) return;
    const check = () => setNoKorean(window.speechSynthesis.getVoices().length > 0 && !koVoice());
    check();
    window.speechSynthesis.addEventListener('voiceschanged', check);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', check);
  }, [supported]);

  // 낭독 명령
  useEffect(() => {
    if (tts.seq === lastSeq.current) return;
    lastSeq.current = tts.seq;
    const seq = tts.seq;
    // 낭독이 끝나거나 실패하면 버저를 열도록 알림 (진행이 멈추지 않게)
    const done = () => onEndRef.current?.(seq);
    const text = lyricsRef.current;
    if (!text) return done();
    if (!supported) {
      setError('이 브라우저는 음성 합성을 지원하지 않아요 (크롬/엣지를 사용하세요)');
      return done();
    }
    setError(null);
    window.clearTimeout(timerRef.current);
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ko-KR';
    const v = koVoice();
    if (v) u.voice = v;
    u.rate = tts.rate;
    u.pitch = 0.8; // 낮고 평평한 기계음 느낌
    u.volume = 1;
    u.onstart = () => setSpeaking(true);
    u.onend = () => {
      setSpeaking(false);
      done();
    };
    u.onerror = (e) => {
      setSpeaking(false);
      // canceled/interrupted 는 다시 듣기·문제 변경으로 끊긴 것 → 새 낭독이 이어받음
      if (e.error !== 'canceled' && e.error !== 'interrupted') {
        setError(e.error === 'not-allowed' ? '소리 켜기를 먼저 눌러 주세요 (브라우저가 자동 재생을 막았어요)' : `낭독 오류: ${e.error}`);
        done();
      }
    };
    // cancel() 직후 바로 speak() 하면 크롬에서 씹히는 경우가 있어 최소 한 틱 뒤에 실행
    // (문제 공개 직후 자동 낭독은 delayMs 만큼 기다렸다가 읽음)
    timerRef.current = window.setTimeout(() => window.speechSynthesis.speak(u), Math.max(60, tts.delayMs ?? 0));
  }, [tts.seq, tts.rate, tts.delayMs, supported]);

  // 문제가 바뀌거나 정답이 공개되면 중단
  useEffect(() => {
    stop();
    setError(null);
  }, [lyrics, revealed]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => stop, []); // eslint-disable-line react-hooks/exhaustive-deps

  const msg = error ?? (speaking ? '🤖 기계음 낭독 중…' : revealed ? '' : '🎧 가사를 잘 들어보세요!');

  return (
    <div className={`tts-wave ${speaking ? 'speaking' : ''}`}>
      <div className="wave-bars" aria-hidden>
        {Array.from({ length: 21 }, (_, i) => (
          <span key={i} style={{ animationDelay: `${(i % 7) * 0.09}s`, animationDuration: `${0.45 + (i % 5) * 0.08}s` }} />
        ))}
      </div>
      {msg && <div className="music-msg">{msg}</div>}
      {noKorean && !error && <div className="tts-warn">⚠ 이 기기에는 한국어 음성이 없어요. 윈도우 설정 → 시간 및 언어 → 음성에서 한국어를 추가해 주세요.</div>}
    </div>
  );
}
