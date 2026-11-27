import Peer, { type DataConnection } from 'peerjs';
import { hostPeerId } from '../lib/ids';
import { load, save } from '../lib/storage';
import { isMcAction, type McAction } from '../game/reducer';
import { TEAM_IDS, type McView, type PublicView, type TeamId } from '../types';
import { STALE_AFTER_MS, type ClientMsg, type ConnMeta, type HostMsg } from './protocol';

export type HostStatus =
  | { kind: 'starting' }
  | { kind: 'ready' }
  | { kind: 'id-taken'; attempt: number }
  | { kind: 'error'; message: string };

export interface HostCallbacks {
  onStatus(s: HostStatus): void;
  onJoin(playerId: string, name: string, team: TeamId): void;
  onBuzz(playerId: string): void;
  onSubmit(playerId: string, value: string): void;
  onMcCommand(action: McAction): void;
  onPresence(playerId: string, online: boolean): void;
  onConnections(counts: { players: number; mcs: number }): void;
}

interface Tracked {
  conn: DataConnection;
  meta: ConnMeta;
  lastSeen: number;
}

/**
 * 전광판(호스트) 네트워크 계층.
 * React 와 분리된 순수 클래스 — 화면 코드는 콜백과 broadcast() 만 사용한다.
 */
export class HostNet {
  private peer: Peer | null = null;
  private players = new Map<string, Tracked>(); // clientId → 현재 연결
  private mcs = new Set<Tracked>();
  private secrets: Record<string, string>;
  private latestPublic: PublicView | null = null;
  private latestMc: McView | null = null;
  private resolve: (clientId: string) => string = (id) => id;
  private heartbeat: number | undefined;
  private retryTimer: number | undefined;
  private attempt = 0;
  private destroyed = false;

  constructor(
    private roomId: string,
    private mcKey: string,
    private cb: HostCallbacks,
  ) {
    this.secrets = load<Record<string, string>>(this.secretsKey) ?? {};
    this.open();
    this.heartbeat = window.setInterval(() => this.sweep(), 2000);
  }

  private get secretsKey() {
    return `mtkit.secrets.${this.roomId}`;
  }

  private open() {
    if (this.destroyed) return;
    this.cb.onStatus(this.attempt ? { kind: 'id-taken', attempt: this.attempt } : { kind: 'starting' });
    const peer = new Peer(hostPeerId(this.roomId), { debug: 1 });
    this.peer = peer;

    peer.on('open', () => {
      this.attempt = 0;
      this.cb.onStatus({ kind: 'ready' });
    });

    peer.on('connection', (conn) => this.accept(conn));

    peer.on('disconnected', () => {
      // 시그널링 서버와만 끊긴 상태 — 기존 P2P 연결은 유지되므로 재접속만 시도
      if (!this.destroyed && !peer.destroyed) peer.reconnect();
    });

    peer.on('error', (err) => {
      const type = (err as { type?: string }).type;
      if (type === 'unavailable-id') {
        // 새로고침 직후엔 이전 세션의 ID 가 서버에 잠시 남아 있음 → 재시도
        peer.destroy();
        this.attempt += 1;
        this.cb.onStatus({ kind: 'id-taken', attempt: this.attempt });
        this.retryTimer = window.setTimeout(() => this.open(), 3000);
        return;
      }
      if (type === 'peer-unavailable') return; // 호스트에선 무시
      if (type === 'network' || type === 'server-error' || type === 'socket-error' || type === 'socket-closed') {
        this.cb.onStatus({ kind: 'error', message: '시그널링 서버 연결 실패 — 인터넷 연결을 확인하세요. 재시도 중…' });
        peer.destroy();
        this.retryTimer = window.setTimeout(() => this.open(), 4000);
        return;
      }
      this.cb.onStatus({ kind: 'error', message: String(err.message ?? err) });
    });
  }

  private accept(conn: DataConnection) {
    const raw = conn.metadata as Partial<ConnMeta> | undefined;
    if (!raw || (raw.role !== 'player' && raw.role !== 'mc') || typeof raw.clientId !== 'string' || typeof raw.secret !== 'string') {
      conn.on('open', () => conn.close());
      return;
    }
    const meta = raw as ConnMeta;
    const tracked: Tracked = { conn, meta, lastSeen: Date.now() };

    conn.on('open', () => {
      if (meta.role === 'mc') {
        if (meta.key !== this.mcKey) {
          this.send(conn, { type: 'REJECT', reason: 'MC 키가 올바르지 않습니다. 전광판의 MC QR 코드로 다시 접속하세요.' });
          setTimeout(() => conn.close(), 500);
          return;
        }
        this.mcs.add(tracked);
        this.send(conn, { type: 'WELCOME', role: 'mc' });
        if (this.latestMc) this.send(conn, { type: 'MC_STATE', view: this.latestMc });
      } else {
        const known = this.secrets[meta.clientId];
        if (known && known !== meta.secret) {
          this.send(conn, { type: 'REJECT', reason: '이미 사용 중인 참가자 ID 입니다. 페이지를 새로고침 해주세요.' });
          setTimeout(() => conn.close(), 500);
          return;
        }
        if (!known) {
          this.secrets[meta.clientId] = meta.secret;
          save(this.secretsKey, this.secrets);
        }
        // 같은 참가자의 이전 연결(다른 탭/재접속)은 정리
        const prev = this.players.get(meta.clientId);
        if (prev && prev.conn !== conn) prev.conn.close();
        this.players.set(meta.clientId, tracked);
        this.send(conn, { type: 'WELCOME', role: 'player' });
        if (this.latestPublic) this.send(conn, { type: 'STATE', view: this.latestPublic, you: this.resolve(meta.clientId) });
        this.cb.onPresence(meta.clientId, true);
      }
      this.emitCounts();
    });

    conn.on('data', (raw) => {
      tracked.lastSeen = Date.now();
      this.handle(tracked, raw as ClientMsg);
    });

    const cleanup = () => {
      if (meta.role === 'mc') {
        this.mcs.delete(tracked);
      } else if (this.players.get(meta.clientId) === tracked) {
        this.players.delete(meta.clientId);
        this.cb.onPresence(meta.clientId, false);
      }
      this.emitCounts();
    };
    conn.on('close', cleanup);
    conn.on('error', cleanup);
  }

  private handle(t: Tracked, msg: ClientMsg) {
    if (!msg || typeof msg !== 'object') return;
    const { role, clientId } = t.meta;
    switch (msg.type) {
      case 'PING':
        this.send(t.conn, { type: 'PONG' });
        return;
      case 'JOIN':
        if (role !== 'player') return;
        if (typeof msg.name !== 'string' || !TEAM_IDS.includes(msg.team)) return;
        this.cb.onJoin(clientId, msg.name, msg.team);
        return;
      case 'BUZZ':
        if (role === 'player') this.cb.onBuzz(clientId);
        return;
      case 'SUBMIT':
        if (role === 'player' && typeof msg.value === 'string' && msg.value.length <= 2) this.cb.onSubmit(clientId, msg.value);
        return;
      case 'MC_CMD':
        if (role === 'mc' && this.mcs.has(t) && isMcAction(msg.action)) this.cb.onMcCommand(msg.action);
        return;
    }
  }

  /** 오래 응답이 없는 연결 정리 (WebRTC close 이벤트가 늦게 오는 경우 대비) */
  private sweep() {
    const now = Date.now();
    const all = [...this.players.values(), ...this.mcs];
    for (const t of all) if (now - t.lastSeen > STALE_AFTER_MS) t.conn.close();
  }

  private send(conn: DataConnection, msg: HostMsg) {
    try {
      if (conn.open) void conn.send(msg);
    } catch {
      /* 연결 종료 직전 전송 실패는 무시 */
    }
  }

  private emitCounts() {
    this.cb.onConnections({ players: this.players.size, mcs: this.mcs.size });
  }

  /** 상태가 바뀔 때마다 호출: 참가자에겐 공개 정보, MC 에겐 비밀 정보 포함 */
  /**
   * 지금 실제로 쓰고 있는 기기인지 (재입장 판단용).
   * 연결이 열려 있어도 최근 5초간 PING 이 없으면(앱 전환·화면 꺼짐으로 백그라운드) 쓰지 않는 것으로 봄
   */
  isActive(clientId: string): boolean {
    const t = this.players.get(clientId);
    return !!t && t.conn.open && Date.now() - t.lastSeen < 5000;
  }

  isConnected(clientId: string): boolean {
    return !!this.players.get(clientId)?.conn.open;
  }

  /**
   * 상태가 바뀔 때마다 호출: 참가자에겐 공개 정보, MC 에겐 비밀 정보 포함.
   * resolve: 기기 ID → 참가자 ID (재입장으로 이어받은 경우 각 폰에 자기 참가자 ID 를 알려줌)
   */
  broadcast(pub: PublicView, mc: McView, resolve: (clientId: string) => string = (id) => id) {
    this.latestPublic = pub;
    this.latestMc = mc;
    this.resolve = resolve;
    for (const [clientId, t] of this.players) this.send(t.conn, { type: 'STATE', view: pub, you: resolve(clientId) });
    for (const t of this.mcs) this.send(t.conn, { type: 'MC_STATE', view: mc });
  }

  destroy() {
    this.destroyed = true;
    window.clearInterval(this.heartbeat);
    window.clearTimeout(this.retryTimer);
    this.peer?.destroy();
  }
}
