# 부캉이 트래커

부산 북항 친수공원 수로의 상어 '부캉이' 상태를 보여 주고, 미니게임 두 개(유인하기, 따라다니기)를 제공하는 비공식 팬사이트입니다.

- 프론트엔드: Vite + TypeScript (프레임워크 없음), 게임은 Canvas
- 서버: Vercel Functions (`api/`)
  - `api/stats.js`: 전국 응원 수, 플레이 수, 전국 상위 % (Upstash Redis)
  - `api/share.js`: `/s/:game/:score` 공유 링크의 미리보기 페이지
  - `api/sightings.js`: 위치 지도의 현장 목격 제보 (Upstash Redis)
- 지도: MapLibre GL + OpenFreeMap 타일 (키 없음, 상업적 이용 가능). 지도 섹션에 가까워질 때만 불러온다.

## 개발

```bash
npm install
npm run dev        # 로컬 개발 서버
npm run build      # dist/ 로 빌드
npm test           # API·날짜 계산 테스트
npm run typecheck
```

## 운영

### 부캉이 상태 바꾸기

`src/data/status.ts`만 고쳐서 배포하면 됩니다.

- `mode`: `staying`(수로 체류 중), `operation`(작전 진행 중), `released`(바다로 귀환), `extended`(버티기 연장)
- `released`로 바꿀 때는 `releasedOn`에 날짜를 넣습니다.
- 새 소식은 `TIMELINE`에 출처 링크와 함께 추가합니다. 확인된 사실만 적습니다.

### 광고, 제휴, 공유 설정

`src/config.ts`에 값을 넣으면 해당 영역이 나타납니다.

- `adfit.home`, `adfit.result`: 카카오 애드핏 광고 단위 ID
- `goods`: 쿠팡 파트너스 링크 (대가성 문구는 자동으로 표시)
- `kakaoJsKey`: 카카오 개발자 JavaScript 키 (카카오 개발자 콘솔에 사이트 도메인 등록 필요)
- `verification.naver`, `verification.google`: 네이버 서치어드바이저·구글 서치콘솔 소유 확인 코드

### 전국 통계 (선택)

Vercel 프로젝트의 Storage 탭에서 Upstash Redis를 연결하면 `KV_REST_API_URL`, `KV_REST_API_TOKEN`이 자동으로 설정되고 응원 총합(사람 수·횟수), 게임 전국 순위, 지도 목격 제보가 켜집니다. 연결하지 않아도 사이트는 정상 동작하고 이 기능들만 숨겨집니다.

### 부캉이 위치

부캉이에게는 추적 장치가 없다. 지도는 `src/data/status.ts`의 `LOCATION`(보도된 체류 장소)을 범위로 표시하고, 최근 30분 현장 제보가 3건 이상이면 제보 위치의 중앙값을 추정 위치로 보여 준다. 제보 범위는 `SIGHTING_BOUNDS`와 `api/sightings.js`의 `BOUNDS`가 같아야 한다(테스트로 확인).

### 공유 미리보기 이미지

게임 등급 이름을 바꾸면 OG 이미지를 다시 만듭니다.

```bash
CHROME=/path/to/headless_shell FONT=/path/to/Jua-Regular.ttf npm run og
```
