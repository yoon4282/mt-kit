import { useEffect, useState } from 'react';
import { describeAward } from '../game/selectors';
import type { PublicView } from '../types';

/** 점수가 부여되면 전광판에 크게 잠깐 표시 */
export function AwardToast({ view }: { view: PublicView }) {
  const [shown, setShown] = useState<string | null>(null);
  const ev = view.lastAward;

  useEffect(() => {
    if (!ev || Date.now() - ev.at > 3000) return;
    setShown(ev.id);
    const t = setTimeout(() => setShown(null), 2400);
    return () => clearTimeout(t);
  }, [ev?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ev || shown !== ev.id) return null;
  return (
    <div key={ev.id} className={`award-toast ${ev.points < 0 ? 'minus' : ''}`}>
      {describeAward(view, ev)}
    </div>
  );
}
