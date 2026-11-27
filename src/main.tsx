import { createRoot } from 'react-dom/client';
import { readParams } from './lib/url';
import { Board } from './screens/board/Board';
import { McRemote } from './screens/mc/McRemote';
import { PlayerRemote } from './screens/player/PlayerRemote';
import './styles.css';

/**
 * URL 로 화면 분기 (라우터 없음 → 정적 호스팅에서 404 걱정 없음)
 *   /                         → 전광판
 *   ?room=ABC123              → 참가자
 *   ?role=mc&room=ABC123&key= → MC 리모컨
 *
 * StrictMode 는 개발 중 effect 를 두 번 실행해 같은 Peer ID 를 중복 등록하므로 사용하지 않음.
 */
const { role, room, key } = readParams();
const hasRoomParam = new URLSearchParams(location.search).has('room');

document.body.dataset.screen = role === 'mc' ? 'mc' : hasRoomParam ? 'player' : 'board';

createRoot(document.getElementById('root')!).render(
  role === 'mc' ? (
    <McRemote room={room} mcKey={key} />
  ) : hasRoomParam ? (
    <PlayerRemote room={room} bot={new URLSearchParams(location.search).get('bot') === '1'} />
  ) : (
    <Board />
  ),
);
