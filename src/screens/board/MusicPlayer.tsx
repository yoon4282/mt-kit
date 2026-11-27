import { useEffect, useRef, useState } from 'react';
import { loadYouTube, ytErrorText, type YTPlayer } from '../../audio/youtube';
import type { Media } from '../../data/quiz';

interface Props {
  media: Media | undefined;
  /** seq 가 바뀔 때마다 재생 (sec: null=끝까지, 0=정지) */
  clip: { seq: number; sec: number | null };
  /** 정답 공개 시 영상 보여주기 */
  revealed: boolean;
  /** seq 번째 재생이 끝났을 때 (정해진 초 만큼 재생 완료 · 곡 끝 · 정지 · 재생 오류) */
  onClipEnd?: (seq: number) => void;
}

/**
 * 전광판 전용 음악 플레이어.
 * 영상은 가려 두고 하이라이트 구간(startSec)부터 지정한 초만큼만 재생.
 */
export function MusicPlayer({ media, clip, revealed, onClipEnd }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const readyRef = useRef(false);
  const pendingSec = useRef<number | null | undefined>(undefined); // undefined = 대기 중인 재생 없음
  const stopTimer = useRef<number | undefined>(undefined);
  const lastSeq = useRef(clip.seq);
  const mediaRef = useRef(media);
  mediaRef.current = media;
  const queued = useRef<number | null | undefined>(undefined);
  /** 지금 재생 중인 명령 번호 (끝났다고 알릴 때 사용) */
  const playingSeq = useRef<number | null>(null);
  const onEndRef = useRef(onClipEnd);
  onEndRef.current = onClipEnd;
  const finish = () => {
    const seq = playingSeq.current;
    playingSeq.current = null;
    if (seq !== null) onEndRef.current?.(seq);
  };
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const play = (sec: number | null) => {
    const p = playerRef.current;
    const m = mediaRef.current;
    if (!p || !m) {
      finish(); // 재생할 수 없으면 바로 끝난 것으로 → 버저가 열림
      return;
    }
    window.clearTimeout(stopTimer.current);
    if (sec === 0) {
      pendingSec.current = undefined;
      p.pauseVideo();
      finish();
      return;
    }
    pendingSec.current = sec;
    p.unMute();
    p.setVolume(100);
    p.seekTo(m.startSec, true);
    p.playVideo();
  };

  // 플레이어 1회 생성
  useEffect(() => {
    let alive = true;
    loadYouTube()
      .then((YT) => {
        if (!alive || !hostRef.current) return;
        const el = document.createElement('div');
        hostRef.current.appendChild(el);
        playerRef.current = new YT.Player(el, {
          width: '100%',
          height: '100%',
          playerVars: { controls: 0, disablekb: 1, modestbranding: 1, rel: 0, playsinline: 1, fs: 0, iv_load_policy: 3 },
          events: {
            onReady: () => {
              readyRef.current = true;
              const m = mediaRef.current;
              if (m) playerRef.current?.cueVideoById({ videoId: m.youtubeId, startSeconds: m.startSec });
              if (queued.current !== undefined) {
                play(queued.current);
                queued.current = undefined;
              }
            },
            onStateChange: (e) => {
              const S = YT.PlayerState;
              setPlaying(e.data === S.PLAYING);
              // 실제 재생이 시작된 순간부터 n초 세기 (버퍼링 시간 제외)
              if (e.data === S.PLAYING && pendingSec.current !== undefined) {
                const sec = pendingSec.current;
                pendingSec.current = undefined;
                window.clearTimeout(stopTimer.current);
                if (sec !== null)
                  stopTimer.current = window.setTimeout(() => {
                    playerRef.current?.pauseVideo();
                    finish();
                  }, sec * 1000);
              }
              if (e.data === S.ENDED) finish(); // '전체' 재생이 곡 끝까지 간 경우
            },
            onError: (e) => {
              setError(ytErrorText(e.data));
              finish();
            },
          },
        });
      })
      .catch((err: Error) => {
        setError(err.message);
        readyRef.current = false;
        finish();
      });
    return () => {
      alive = false;
      window.clearTimeout(stopTimer.current);
      playerRef.current?.destroy();
      playerRef.current = null;
      readyRef.current = false;
    };
  }, []);

  // 곡이 바뀌면 미리 불러오기
  useEffect(() => {
    setError(null);
    window.clearTimeout(stopTimer.current);
    if (readyRef.current && media) playerRef.current?.cueVideoById({ videoId: media.youtubeId, startSeconds: media.startSec });
  }, [media?.youtubeId, media?.startSec]); // eslint-disable-line react-hooks/exhaustive-deps

  // 재생 명령 (플레이어 준비 전이면 준비되는 즉시 재생)
  useEffect(() => {
    if (clip.seq === lastSeq.current) return;
    lastSeq.current = clip.seq;
    playingSeq.current = clip.seq;
    if (!readyRef.current) {
      queued.current = clip.sec;
      return;
    }
    play(clip.sec);
  }, [clip.seq, clip.sec]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`music-player ${revealed ? 'revealed' : ''}`}>
      <div className="yt-host" ref={hostRef} />
      {!revealed && (
        <div className={`music-cover ${playing ? 'playing' : ''}`}>
          <div className="eq">
            {Array.from({ length: 7 }, (_, i) => (
              <span key={i} style={{ animationDelay: `${i * 0.11}s` }} />
            ))}
          </div>
          <div className="music-msg">{error ?? (playing ? '재생 중…' : media ? '🎧 잘 들어보세요!' : '재생 정보가 없는 곡이에요')}</div>
        </div>
      )}
    </div>
  );
}
