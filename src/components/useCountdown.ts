import { useEffect, useMemo, useState } from 'react';
import type { TimerView } from '../types';

/**
 * 남은 시간 표시용 훅.
 * timer 스냅샷을 받은 시점을 기준으로 내 기기 시계로 카운트다운 (기기 간 시계 차이 무관).
 */
export function useCountdown(timer: TimerView): number {
  // 새 스냅샷(객체)이 올 때마다 기준 시각 갱신
  const receivedAt = useMemo(() => Date.now(), [timer]);
  const [, tick] = useState(0);

  useEffect(() => {
    if (!timer.running) return;
    const id = window.setInterval(() => tick((n) => n + 1), 100);
    return () => window.clearInterval(id);
  }, [timer]);

  if (!timer.running) return timer.remainingMs;
  return Math.max(0, timer.remainingMs - (Date.now() - receivedAt));
}
