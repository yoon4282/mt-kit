# MT·동아리 레크 MC 키트

QR 연동형 레크리에이션 MC 키트. 백엔드/DB 없이 정적 호스팅만으로 동작합니다(PeerJS P2P).

## 화면
| 화면 | 주소 | 용도 |
|---|---|---|
| 전광판 | `/` | 프로젝터. QR, 문제, 타이머, 순위표, 하단 MC 패널 |
| MC 리모컨 | `?role=mc&room=ID&key=KEY` | MC 폰. 비밀 정답, 배점, 사운드보드 |
| 참가자 | `?room=ID` | 닉네임·팀 선택, 버저/답안 제출 |

## 개발
```
npm install
npm run dev     # http://localhost:5173
npm test
npm run build   # dist/
```

## 배포 (카드 등록 불필요)
### Vercel
1. GitHub에 push → vercel.com 에서 저장소 Import → 설정 그대로 Deploy (`vercel.json` 포함).
### GitHub Pages
1. 저장소 Settings → Pages → Source 를 **GitHub Actions** 로 설정.
2. `main` 에 push 하면 `.github/workflows/deploy.yml` 이 테스트·빌드·배포.
- `base: './'` 이므로 하위 경로(`user.github.io/repo/`)에서도 동작합니다.
- 반드시 **HTTPS** 주소로 접속하세요(휴대폰 연결/오디오 정책).

## 시연 체크리스트
1. 전광판 접속 → [🔊 소리 켜기] 클릭(필수).
2. 폰 없이: 하단 패널 [🤖 가짜 참가자 +8] → 게임 선택 → 배점.
3. 폰 연결: 참가자 QR / MC QR 스캔(같은 인터넷 필요, PeerJS 공용 시그널링 사용).
4. 노래 퀴즈는 곡마다 [1초 듣기]로 사전 확인(실패 시 오프라인 멜로디 자동 대체).
5. 전광판 하단 패널의 비밀 정답은 기본 숨김. 프로젝터에 보이게 하지 마세요.

## 문제 추가
`src/data/quizzes.js` 의 각 배열에 같은 형식으로 추가합니다.
