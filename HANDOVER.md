# HANDOVER — MT·동아리 레크 MC 키트

## 실행
- `npm install` → `npm run dev` (전광판: `http://localhost:5173/`), `npm test`, `npm run build` (정적 배포: `dist/`)
- 전광판 `/` / MC 폰 `?role=mc&room=ID&key=KEY` / 참가자 `?room=ID` (QR은 전광판이 생성)

## 구조
- `src/core/game.js` 호스트 상태 + reducer (개인 `personalScore` / 팀 `teamScore` 완전 분리, `applyAward`가 모드로 분기)
- `src/core/views.js` 참가자용 공개 상태(정답·문제 내용 제외)
- `src/net/host.js`, `client.js` PeerJS 허브(스타형, 호스트 ID `mtkit-{room}`) · MC는 `key` 일치 시만 허용
- `src/bots/bots.js` 가짜 참가자 · `src/audio/sfx.js` Web Audio 효과음/멜로디 · `src/audio/youtube.js` 숨김 재생
- `src/components/McConsole.jsx` MC 콘솔(폰·전광판 하단 패널 공용) · `src/screens/*` 3화면
- `src/data/quizzes.js` 문제 40개(노래/초성·이모지/버저/스피드 각 10)

## 알려진 사항 / 다음 단계
- song.youtubeId·notes는 최선 입력값. 시연 전 [1초 듣기] 확인, 실패 시 자동으로 오프라인 멜로디 대체.
- 정적 앱이라 정답 데이터가 번들에 포함됨(화면·네트워크 레벨에서만 비공개).
- PeerJS 공용 시그널링 서버 필요(인터넷). 오프라인 시연은 전광판 하단 패널 + 봇.
- 실기기(폰) 간 PeerJS 연결은 이 환경에서 미검증.
- 문제 확장은 `quizzes.js` 배열에 같은 스키마로 추가.
