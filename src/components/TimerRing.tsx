import type { TimerView } from '../types';
import { useCountdown } from './useCountdown';

/** 원형 타이머. size 로 전광판(대형)/폰(소형) 겸용 */
export function TimerRing({ timer, size = 160, showPaused = true }: { timer: TimerView; size?: number; showPaused?: boolean }) {
  const left = useCountdown(timer);
  const ratio = timer.durationMs ? left / timer.durationMs : 0;
  const sec = Math.ceil(left / 1000);
  const r = 44;
  const c = 2 * Math.PI * r;
  const urgent = timer.running && sec <= 5;
  return (
    <div className={`timer-ring ${urgent ? 'urgent' : ''} ${timer.running ? 'running' : 'paused'}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <circle cx="50" cy="50" r={r} className="track" />
        <circle
          cx="50"
          cy="50"
          r={r}
          className="bar"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.max(0, Math.min(1, ratio)))}
          transform="rotate(-90 50 50)"
        />
      </svg>
      <span className="sec" style={{ fontSize: size * 0.32 }}>
        {sec}
      </span>
      {showPaused && !timer.running && left > 0 && <span className="paused-tag">일시정지</span>}
    </div>
  );
}
