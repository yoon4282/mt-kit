// 혼동되는 글자(0/O, 1/I/L) 제외
const ROOM_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function randomFrom(alphabet: string, len: number): string {
  const buf = new Uint32Array(len);
  crypto.getRandomValues(buf);
  return Array.from(buf, (n) => alphabet[n % alphabet.length]).join('');
}

export const newRoomId = () => randomFrom(ROOM_ALPHABET, 6);
export const newMcKey = () => randomFrom('abcdefghijkmnpqrstuvwxyz23456789', 10);
export const uid = () => randomFrom('abcdefghijklmnopqrstuvwxyz0123456789', 12);

/** PeerJS 공개 시그널링 서버에서 다른 앱과 겹치지 않도록 접두어 사용 */
export const hostPeerId = (roomId: string) => `mtmckit-v1-${roomId.toLowerCase()}`;
