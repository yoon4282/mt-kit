import { useEffect, useState } from 'react';

export const genRoom = () => {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let r = '';
  for (let i = 0; i < 5; i++) r += chars[Math.floor(Math.random() * chars.length)];
  return r;
};
export const genId = (p = 'p') => `${p}-${Math.random().toString(36).slice(2, 9)}`;

export const TEAM_COLORS = { 1: '#ef4444', 2: '#3b82f6', 3: '#22c55e', 4: '#f59e0b' };

// 현재 시각(ms) 훅. offset: 호스트시계 - 내시계
export function useNow(interval = 200, offset = 0) {
  const [now, setNow] = useState(() => Date.now() + offset);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now() + offset), interval);
    return () => clearInterval(id);
  }, [interval, offset]);
  return now;
}

export const fmtSec = (ms) => Math.max(0, Math.ceil(ms / 1000));

export function appUrl(params) {
  const u = new URL(window.location.href);
  u.search = '';
  u.hash = '';
  Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v));
  return u.toString();
}
