# MR 가치 최적화 대시보드

현대카드 아멕스 플래티넘(한국) 보유자를 위한 MR 포인트 전환 가치 비교 대시보드입니다.

## Tech Stack

- **React** + TypeScript
- **Tailwind CSS**
- **Lucide-react** (아이콘)
- **Vite**

## 실행 방법

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:5173` 으로 접속하세요.

## 빌드

```bash
npm run build
```

`dist/` 폴더에 정적 파일이 생성됩니다. Vercel 등에 그대로 배포할 수 있습니다.

## 기능

- **보유 MR 입력**: 기본값 1,100,000 MR
- **파트너별 전환 결과**: 전환 마일리지, 예상 현금 가치, 현금화 대비 추가 이득(KRW)
- **가성비 배지**: 가성비 최고, 효율 좋음, 효율 보통, 비권장 표시
- **지역별 전략**: 아시아·유럽·미국·중동별 전략 뱃지(호버 시 상세)
- **티켓 조회 탭**: 검색 조건(출발/도착, 날짜, 편도·왕복, 캐빈, 경유) 입력 후 GrayPane·PointsYeah·AwardTool·AwardHacker·Roame 링크로 이동

## 티켓 조회 탭 · Apple 지도 (MapKit JS)

티켓 조회 탭에는 **공항 자동완성**과 **Apple 지도**로 출발/도착 노선을 시각화합니다. [GrayPane(flights-tracker)](https://github.com/punitarani/flights-tracker)의 `airport-map`·`airport-search`·`mapkit-service` 방식을 참고해 구현했습니다.

**Apple 지도를 쓰려면 MapKit JS 토큰이 필요합니다.**

1. [Apple Developer](https://developer.apple.com/account) → Certificates, Identifiers & Profiles → **Maps** → Maps identifier 생성 후 **Keys**에서 키 발급
2. 프로젝트 루트에 `.env` 파일을 만들고 다음을 추가:
   ```env
   VITE_MAPKIT_TOKEN=your_mapkit_js_token_here
   ```
3. `npm run dev`로 다시 실행하면 티켓 조회 탭에서 Apple 지도가 로드됩니다.

토큰을 넣지 않으면 지도 영역에 "지도를 불러올 수 없습니다" 메시지가 뜨고, 공항 자동완성과 기타 툴 링크는 그대로 사용할 수 있습니다.

## GrayPane

GrayPane은 티켓 조회 탭의 툴 목록에 포함되어 있으며, 위 검색 조건이 GrayPane 검색 URL에 반영된 상태로 새 탭에서 열립니다.

## 모바일 UX (iOS Safari)

공항 검색 바텀시트는 iOS Safari의 키보드/뷰포트 이슈를 고려해 최적화되어 있습니다:

- **스크롤 락**: `position: fixed` 대신 CSS 클래스 토글 방식으로 레이아웃 점프 방지
- **Dynamic Viewport**: `dvh` 단위 사용 (미지원 브라우저용 `vh` fallback)
- **Safe Area**: 하단 노치/홈 인디케이터 영역에 대한 safe-area padding 적용
- **내부 스크롤**: `overscroll-behavior: contain`으로 rubber-band 효과 억제
- **배경 차단**: `inert` 속성으로 모달 뒤 콘텐츠 터치/포커스 차단

## 배포

- **빌드**: `npm run build` → `dist/` 생성
- **환경 변수**: 배포 전 `.env`에 `VITE_MAPKIT_TOKEN` 설정 (Apple Developer에서 MapKit JS 키 발급). GitHub Pages 등 정적 호스팅 시 토큰이 클라이언트에 노출되므로, Apple Developer에서 해당 도메인만 허용하도록 제한하는 것을 권장합니다.
