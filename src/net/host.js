// 전광판(호스트) 측 PeerJS 허브. 상태의 유일한 권위자.
import Peer from 'peerjs';
import { MC_ACTIONS } from '../core/game.js';
import { playerView } from '../core/views.js';

export const peerIdFor = (room) => `mtkit-${room}`;

export function createHost({ room, mcKey, getState, dispatch, onStatus }) {
  let peer = null;
  let destroyed = false;
  const conns = new Map(); // conn.peer(or id) -> { conn, role, pid }
  let mcConn = null;

  const status = (extra) => onStatus && onStatus({ players: playerCount(), mc: !!mcConn, ...extra });
  const playerCount = () => [...conns.values()].filter((c) => c.role === 'player').length;
  const send = (conn, msg) => {
    try { conn.open && conn.send(msg); } catch { /* ignore */ }
  };

  function pushTo(entry) {
    const s = getState();
    const now = Date.now();
    if (entry.role === 'mc') send(entry.conn, { t: 'STATE', now, state: s });
    else if (entry.role === 'player') send(entry.conn, { t: 'STATE', now, view: playerView(s, entry.pid, now) });
  }
  function broadcast() {
    conns.forEach((e) => e.role && pushTo(e));
  }

  function handle(entry, msg) {
    if (!msg || typeof msg !== 'object') return;
    switch (msg.t) {
      case 'MC_HELLO':
        if (msg.key !== mcKey) {
          send(entry.conn, { t: 'DENIED', reason: 'MC 키가 맞지 않습니다. 전광판의 MC QR을 다시 스캔하세요.' });
          return;
        }
        if (mcConn && mcConn !== entry.conn) send(mcConn, { t: 'DENIED', reason: '다른 기기가 MC로 접속했습니다.' });
        mcConn = entry.conn;
        entry.role = 'mc';
        status();
        pushTo(entry);
        break;
      case 'JOIN': {
        const id = String(msg.id || '').slice(0, 40);
        if (!id) return;
        entry.role = 'player';
        entry.pid = id;
        dispatch({ type: 'JOIN', id, name: msg.name, team: msg.team });
        status();
        send(entry.conn, { t: 'JOIN_OK', id });
        pushTo(entry);
        break;
      }
      case 'ANSWER':
        if (entry.role === 'player') dispatch({ type: 'ANSWER', pid: entry.pid, text: msg.text, now: Date.now() });
        break;
      case 'BUZZ':
        if (entry.role === 'player') dispatch({ type: 'BUZZ', pid: entry.pid, now: Date.now() });
        break;
      case 'CMD':
        if (entry.role === 'mc' && msg.action && MC_ACTIONS.has(msg.action.type)) {
          dispatch({ ...msg.action, now: Date.now() });
        }
        break;
      case 'PING':
        send(entry.conn, { t: 'PONG' });
        break;
      default:
    }
  }

  let retries = 0;
  function start(id) {
    peer = new Peer(id, { debug: 0 });
    peer.on('open', () => status({ online: true, error: null }));
    peer.on('connection', (conn) => {
      const entry = { conn, role: null, pid: null };
      conns.set(conn.connectionId, entry);
      conn.on('data', (msg) => handle(entry, msg));
      const gone = () => {
        conns.delete(conn.connectionId);
        if (mcConn === conn) mcConn = null;
        status();
      };
      conn.on('close', gone);
      conn.on('error', gone);
    });
    peer.on('disconnected', () => {
      if (!destroyed) setTimeout(() => peer && !peer.destroyed && peer.reconnect(), 1500);
      status({ online: false });
    });
    peer.on('error', (err) => {
      // 새로고침 직후엔 이전 등록이 남아 있을 수 있어 몇 번 재시도한다.
      if (err.type === 'unavailable-id' && retries < 4 && !destroyed) {
        retries += 1;
        peer.destroy();
        setTimeout(() => !destroyed && start(id), 3000);
        status({ error: 'retrying' });
        return;
      }
      status({ error: err.type === 'unavailable-id' ? 'unavailable-id' : String(err.type || err) });
    });
  }
  start(peerIdFor(room));

  return {
    broadcast,
    destroy() {
      destroyed = true;
      peer && peer.destroy();
    },
  };
}
