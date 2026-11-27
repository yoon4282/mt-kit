import { useState } from 'react';
import { useClient, statusText } from '../../net/useClient';
import { ControlPanel } from '../../components/ControlPanel';
import { Leaderboard } from '../../components/Leaderboard';
import { QuizControl } from '../../components/QuizControl';
import { SecretSheet } from '../../components/SecretSheet';
import { ShareButton } from '../../components/ShareButton';
import type { McAction } from '../../game/reducer';
import type { McView } from '../../types';

/** MC 전용 리모컨 (?role=mc&room=방ID&key=MC키) */
export function McRemote({ room, mcKey }: { room: string; mcKey?: string }) {
  const [view, setView] = useState<McView | null>(null);
  const { status, send } = useClient(room, 'mc', mcKey, (m) => {
    if (m.type === 'MC_STATE') setView(m.view);
  });

  const connected = status.kind === 'connected';
  const sendCmd = (action: McAction) => {
    if (!send({ type: 'MC_CMD', action })) navigator.vibrate?.(200);
  };

  if (!mcKey) {
    return (
      <div className="phone center">
        <div className="card">
          <h2>MC 키가 없어요</h2>
          <p>전광판의 <b>MC 리모컨 QR 코드</b>로 접속해 주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="phone mc">
      <header className="phone-head">
        <div>
          <b>📱 MC 리모컨</b> <span className="muted">방 {room}</span>
        </div>
        <span className={`conn ${status.kind}`}>
          {connected ? '● 연결됨' : status.kind === 'rejected' ? '접속 거부됨' : '연결 중…'}
        </span>
      </header>

      {/* 참가자 입장 링크를 단톡방에 바로 보내기 (MC 링크가 아니라 참가자 링크) */}
      {status.kind !== 'rejected' && (
        <div className="mc-share">
          <ShareButton
            url={`${location.origin}${location.pathname}?room=${room}`}
            title="🎤 MT 레크리에이션 입장!"
            text={`링크를 눌러 닉네임과 팀을 고르고 입장하세요 (방 코드 ${room})`}
          />
        </div>
      )}

      {status.kind === 'rejected' ? (
        <div className="card error">{status.reason}</div>
      ) : !view ? (
        <div className="card">
          <p>{statusText(status)}</p>
        </div>
      ) : (
        // 폰: 한 줄로 쌓임 / 폰 가로·태블릿: 2단 / 노트북: 3단 (CSS 에서 배치)
        <div className={`mc-grid ${connected ? '' : 'dim'}`}>
          <div className="mc-col mc-col-quiz">
            <SecretSheet view={view} />
            <QuizControl view={view} send={sendCmd} />
          </div>
          <div className="mc-col mc-col-score">
            <ControlPanel view={view} send={sendCmd} compact />
          </div>
          <div className="mc-col mc-col-rank">
            <section className="card">
              <h4>{view.mode === 'individual' ? '개인 순위' : '팀 순위'}</h4>
              <Leaderboard view={view} limit={12} size="sm" />
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
