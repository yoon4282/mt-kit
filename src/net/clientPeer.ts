import Peer, { type DataConnection } from 'peerjs';
import { hostPeerId, uid } from '../lib/ids';
import { load, save } from '../lib/storage';
import { PING_INTERVAL_MS, STALE_AFTER_MS, type ClientMsg, type ConnMeta, type HostMsg, type Role } from './protocol';

export type ClientStatus =
  | { kind: 'connecting' }
  | { kind: 'connected' }
  | { kind: 'host-not-found' }
  | { kind: 'reconnecting' }
  | { kind: 'rejected'; reason: string };

/** 이 기기의 참가자 신원 — localStorage 에 저장해 새로고침/재접속 시 같은 참가자로 복원 */
export function getIdentity(): { clientId: string; secret: string } {
  const saved = load<{ clientId: string; secret: string }>('mtkit.identity');
  if (saved?.clientId && saved.secret) return saved;
  const id = { clientId: `p-${uid()}`, secret: uid() + uid() };
  save('mtkit.identity', id);
  return id;
}

/**
 * 폰(참가자 / MC) 네트워크 계층.
 * 끊기면 자동으로 재접속하고, PING/PONG 으로 호스트 생존을 확인한다.
 */
export class ClientNet {
  private peer: Peer | null = null;
  private conn: DataConnection | null = null;
  private pingTimer: number | undefined;
  private retryTimer: number | undefined;
  private lastPong = 0;
  private destroyed = false;
  private rejected = false;

  constructor(
    private roomId: string,
    private meta: ConnMeta,
    private onStatus: (s: ClientStatus) => void,
    private onMessage: (m: HostMsg) => void,
  ) {
    this.start();
    // 탭을 닫거나 다른 페이지로 갈 때 바로 연결을 끊어 전광판이 '나감'을 빨리 알도록
    window.addEventListener('pagehide', this.onPageHide);
  }

  private onPageHide = () => {
    this.conn?.close();
  };

  static create(
    roomId: string,
    role: Role,
    key: string | undefined,
    onStatus: ClientNet['onStatus'],
    onMessage: ClientNet['onMessage'],
    identity: { clientId: string; secret: string } = getIdentity(),
  ) {
    const { clientId, secret } = identity;
    // MC 는 참가자와 다른 ID 를 써서, 같은 폰으로 참가자 겸 MC 를 해도 충돌하지 않게 함
    const meta: ConnMeta = role === 'mc' ? { role, clientId: `mc-${clientId}`, secret, key } : { role, clientId, secret };
    return new ClientNet(roomId, meta, onStatus, onMessage);
  }

  get clientId() {
    return this.meta.clientId;
  }

  private start() {
    if (this.destroyed) return;
    this.onStatus({ kind: 'connecting' });
    const peer = new Peer({ debug: 1 });
    this.peer = peer;
    peer.on('open', () => this.connect());
    peer.on('disconnected', () => {
      if (!this.destroyed && !peer.destroyed) peer.reconnect();
    });
    peer.on('error', (err) => {
      const type = (err as { type?: string }).type;
      if (type === 'peer-unavailable') {
        this.onStatus({ kind: 'host-not-found' });
        this.scheduleRetry(3000, false);
        return;
      }
      this.onStatus({ kind: 'reconnecting' });
      this.scheduleRetry(3000, true);
    });
  }

  private connect() {
    if (this.destroyed || !this.peer || this.peer.destroyed) return;
    this.conn?.close();
    const conn = this.peer.connect(hostPeerId(this.roomId), { reliable: true, metadata: this.meta });
    this.conn = conn;

    conn.on('open', () => {
      this.lastPong = Date.now();
      this.onStatus({ kind: 'connected' });
      window.clearInterval(this.pingTimer);
      this.pingTimer = window.setInterval(() => {
        if (Date.now() - this.lastPong > STALE_AFTER_MS) {
          conn.close(); // 응답 없음 → 재접속
          return;
        }
        this.send({ type: 'PING' });
      }, PING_INTERVAL_MS);
    });

    conn.on('data', (raw) => {
      const msg = raw as HostMsg;
      this.lastPong = Date.now();
      if (msg.type === 'REJECT') {
        this.rejected = true;
        this.onStatus({ kind: 'rejected', reason: msg.reason });
        return;
      }
      if (msg.type !== 'PONG') this.onMessage(msg);
    });

    conn.on('close', () => {
      if (this.conn !== conn) return;
      window.clearInterval(this.pingTimer);
      if (this.destroyed || this.rejected) return;
      this.onStatus({ kind: 'reconnecting' });
      this.scheduleRetry(1500, false);
    });
  }

  /** fullRestart: Peer 자체를 새로 만듦 (시그널링 오류 시) */
  private scheduleRetry(ms: number, fullRestart: boolean) {
    if (this.destroyed || this.rejected) return;
    window.clearTimeout(this.retryTimer);
    this.retryTimer = window.setTimeout(() => {
      if (fullRestart || !this.peer || this.peer.destroyed || this.peer.disconnected) {
        this.peer?.destroy();
        this.start();
      } else {
        this.connect();
      }
    }, ms);
  }

  send(msg: ClientMsg): boolean {
    if (!this.conn?.open) return false;
    try {
      void this.conn.send(msg);
      return true;
    } catch {
      return false;
    }
  }

  destroy() {
    this.destroyed = true;
    window.removeEventListener('pagehide', this.onPageHide);
    window.clearInterval(this.pingTimer);
    window.clearTimeout(this.retryTimer);
    this.conn?.close();
    this.peer?.destroy();
  }
}
