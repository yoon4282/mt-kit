// MC 폰 리모컨 (?role=mc&room=ID&key=...) : 호스트에 접속해 상태를 받고 명령을 보낸다.
import { useEffect, useRef, useState } from 'react';
import { createClient } from '../net/client.js';
import McConsole from '../components/McConsole.jsx';

export default function Mc({ room, initialKey }) {
  const [key, setKey] = useState(initialKey || localStorage.getItem(`mt-mc-key-${room}`) || '');
  const [typed, setTyped] = useState('');
  const [state, setState] = useState(null);
  const [offset, setOffset] = useState(0);
  const [conn, setConn] = useState({ connected: false });
  const [denied, setDenied] = useState('');
  const clientRef = useRef(null);

  useEffect(() => {
    if (!key) return undefined;
    localStorage.setItem(`mt-mc-key-${room}`, key);
    const c = createClient({
      room,
      hello: () => ({ t: 'MC_HELLO', key }),
      onStatus: setConn,
      onMessage: (m) => {
        if (m.t === 'STATE') {
          setState(m.state);
          setOffset(m.now - Date.now());
          setDenied('');
        } else if (m.t === 'DENIED') setDenied(m.reason);
      },
    });
    clientRef.current = c;
    return () => c.destroy();
  }, [room, key]);

  if (!key) {
    return (
      <div className="phone center">
        <h2>🎤 MC 리모컨</h2>
        <p>전광판의 MC 코드를 입력하세요.</p>
        <input value={typed} onChange={(e) => setTyped(e.target.value.trim())} placeholder="MC 코드" />
        <button className="big good" disabled={!typed} onClick={() => setKey(typed)}>연결</button>
      </div>
    );
  }
  if (denied) {
    return (
      <div className="phone center">
        <h2>⛔ 접속 거부</h2>
        <p>{denied}</p>
        <button onClick={() => { localStorage.removeItem(`mt-mc-key-${room}`); setKey(''); }}>코드 다시 입력</button>
      </div>
    );
  }
  return (
    <div className="phone mc">
      <div className={`conn-bar ${conn.connected ? 'ok' : ''}`}>
        🎤 MC 리모컨 · 방 {room} · {conn.connected ? '전광판 연결됨' : '연결 중… (전광판이 켜져 있는지 확인)'}
      </div>
      {state
        ? <McConsole state={state} send={(action) => clientRef.current && clientRef.current.send({ t: 'CMD', action })} offset={offset} secretDefault />
        : <p className="center muted">상태를 기다리는 중…</p>}
    </div>
  );
}
