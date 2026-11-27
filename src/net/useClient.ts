import { useEffect, useRef, useState } from 'react';
import { ClientNet, type ClientStatus } from './clientPeer';
import type { ClientMsg, HostMsg, Role } from './protocol';

/** 폰 화면용 훅: 접속 상태 + 받은 메시지 처리 + send */
export function useClient(
  roomId: string,
  role: Role,
  key: string | undefined,
  onMessage: (m: HostMsg) => void,
  identity?: { clientId: string; secret: string },
) {
  const [status, setStatus] = useState<ClientStatus>({ kind: 'connecting' });
  const netRef = useRef<ClientNet | null>(null);
  const handler = useRef(onMessage);
  handler.current = onMessage;

  useEffect(() => {
    if (!roomId) return;
    const net = ClientNet.create(roomId, role, key, setStatus, (m) => handler.current(m), identity);
    netRef.current = net;
    return () => {
      net.destroy();
      netRef.current = null;
    };
  }, [roomId, role, key, identity]);

  const send = (m: ClientMsg) => netRef.current?.send(m) ?? false;
  return { status, send };
}

export function statusText(s: ClientStatus): string {
  switch (s.kind) {
    case 'connecting':
      return '전광판에 연결 중…';
    case 'connected':
      return '연결됨';
    case 'host-not-found':
      return '방을 찾을 수 없어요. 전광판이 켜져 있는지 확인하세요. (재시도 중)';
    case 'reconnecting':
      return '연결이 끊겼어요. 다시 연결 중…';
    case 'rejected':
      return s.reason;
  }
}
