import type { McAction } from '../game/reducer';
import type { McView, PublicView, TeamId } from '../types';

/**
 * PeerJS 통신 프로토콜 (단일 출처)
 *
 * 구조: 전광판(호스트)을 중심으로 한 스타형.
 *   참가자 폰 ─┐
 *   참가자 폰 ─┼─▶ 전광판(호스트, peerId = mtmckit-v1-{room}) ◀── MC 폰
 *   참가자 폰 ─┘
 *
 * 게임 상태는 전광판만 가진다. 폰은 명령/입력만 보내고, 스냅샷을 받아 화면에 그린다.
 */

export type Role = 'player' | 'mc';

/** connect() 시 metadata 로 전달 */
export interface ConnMeta {
  role: Role;
  /** 공개 ID (순위표 등에 노출) */
  clientId: string;
  /** 비밀 토큰 — 다른 사람이 같은 clientId 로 접속해 사칭하는 것을 막음 */
  secret: string;
  /** MC 전용 키 (MC QR 에만 포함) */
  key?: string;
}

export type ClientMsg =
  | { type: 'JOIN'; name: string; team: TeamId }
  | { type: 'BUZZ' }
  /** O/X: 'O'|'X', 4지선다: '0'~'3' */
  | { type: 'SUBMIT'; value: string }
  | { type: 'MC_CMD'; action: McAction }
  | { type: 'PING' };

export type HostMsg =
  | { type: 'WELCOME'; role: Role }
  | { type: 'REJECT'; reason: string }
  /** you: 이 폰이 조종하는 참가자 ID (재입장으로 다른 참가자를 이어받았을 수 있음) */
  | { type: 'STATE'; view: PublicView; you?: string }
  | { type: 'MC_STATE'; view: McView }
  | { type: 'PONG' };

export const PING_INTERVAL_MS = 3000;
/** 이 시간 동안 PING/PONG 이 없으면 끊긴 것으로 판단 */
export const STALE_AFTER_MS = 10000;
