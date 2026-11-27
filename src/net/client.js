// MC 폰 / 참가자 폰 측 PeerJS 클라이언트 (끊기면 자동 재접속)
import Peer from 'peerjs';
import { peerIdFor } from './host.js';

export function createClient({ room, hello, onMessage, onStatus }) {
  let peer = null;
  let conn = null;
  let destroyed = false;
  let retryTimer = null;

  const status = (s) => onStatus && onStatus(s);

  function connect() {
    if (destroyed) return;
    if (!peer || peer.destroyed) {
      peer = new Peer({ debug: 0 });
      peer.on('open', dial);
      peer.on('error', (err) => {
        status({ connected: false, error: String(err.type || err) });
        scheduleRetry();
      });
      peer.on('disconnected', () => !destroyed && peer && !peer.destroyed && peer.reconnect());
      return;
    }
    dial();
  }

  function dial() {
    if (destroyed || !peer || peer.destroyed || !peer.open) return;
    status({ connected: false, error: null, connecting: true });
    conn = peer.connect(peerIdFor(room), { reliable: true });
    let opened = false;
    const failTimer = setTimeout(() => {
      if (!opened) {
        try { conn.close(); } catch { /* ignore */ }
        scheduleRetry();
      }
    }, 6000);
    conn.on('open', () => {
      opened = true;
      clearTimeout(failTimer);
      status({ connected: true, error: null, connecting: false });
      conn.send(hello());
    });
    conn.on('data', (m) => onMessage && onMessage(m));
    conn.on('close', () => {
      status({ connected: false, connecting: false });
      scheduleRetry();
    });
    conn.on('error', () => scheduleRetry());
  }

  function scheduleRetry() {
    if (destroyed || retryTimer) return;
    retryTimer = setTimeout(() => {
      retryTimer = null;
      connect();
    }, 2000);
  }

  connect();

  return {
    send(msg) {
      try { conn && conn.open && conn.send(msg); } catch { /* ignore */ }
    },
    destroy() {
      destroyed = true;
      clearTimeout(retryTimer);
      peer && peer.destroy();
    },
  };
}
