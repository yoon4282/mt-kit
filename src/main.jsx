import React from 'react';
import { createRoot } from 'react-dom/client';
import Board from './screens/Board.jsx';
import Mc from './screens/Mc.jsx';
import Player from './screens/Player.jsx';
import './styles.css';

// 오류가 나도 흰 화면 대신 원인을 보여준다 (폰 디버깅용)
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { err: null };
  }
  static getDerivedStateFromError(err) {
    return { err };
  }
  render() {
    if (this.state.err) {
      return (
        <div className="err-box">
          <h2>⚠ 화면 오류</h2>
          <p>{String(this.state.err && this.state.err.message)}</p>
          <button onClick={() => { localStorage.clear(); window.location.reload(); }}>저장 데이터 지우고 새로고침</button>
        </div>
      );
    }
    return this.props.children;
  }
}

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

createRoot(document.getElementById('root')).render(<ErrorBoundary>{screen}</ErrorBoundary>);
