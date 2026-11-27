import React from 'react';
import { createRoot } from 'react-dom/client';
import Board from './screens/Board.jsx';
import Mc from './screens/Mc.jsx';
import Player from './screens/Player.jsx';
import './styles.css';

// 라우터 없이 쿼리로 화면 분기
//   (없음)                   → 전광판
//   ?role=mc&room=ID&key=KEY → MC 폰 리모컨
//   ?room=ID                 → 참가자 폰
const q = new URLSearchParams(window.location.search);
const room = q.get('room');
let screen;
if (q.get('role') === 'mc' && room) screen = <Mc room={room} initialKey={q.get('key')} />;
else if (room) screen = <Player room={room} />;
else screen = <Board />;

createRoot(document.getElementById('root')).render(screen);
