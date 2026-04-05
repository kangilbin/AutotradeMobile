# Design: marker-sync-fix (매매 마커 차트 동기화 수정)

## 1. 문제 정의

### 현상
- 차트의 매수/매도 마커(dot)가 차트 팬/줌 시 위치가 업데이트되지 않음
- 세로 스크롤(가격축 드래그), 확대/축소 시 마커가 초기 위치에 고정

### 원인 분석
`StockChart.tsx` 내 WebView HTML에서 마커를 HTML `div.trade-dot`으로 absolute positioning하고 있음.

`updateDots()` 함수가 구독하는 이벤트:
1. `chart.timeScale().subscribeVisibleLogicalRangeChange()` - 시간축(가로) 변경만 감지
2. `chart.subscribeCrosshairMove()` - 커서 이동 시에만 감지

**누락된 케이스:**
- 가격축(세로) 드래그 → 시간축은 변경 없으므로 `subscribeVisibleLogicalRangeChange` 미발생
- 줌 후 가격 스케일 자동 조정 → crosshair 이동 없으면 Y좌표 미갱신
- lightweight-charts v4.1.0에는 `subscribePriceRangeChange` API가 없음

## 2. 해결 방안

### 방안 A: requestAnimationFrame 기반 연속 업데이트 (채택)

차트 컨테이너에 pointer 이벤트를 감지하여, 인터랙션 중에만 `requestAnimationFrame` 루프로 `updateDots()`를 호출.

**장점:**
- 모든 인터랙션(세로/가로 드래그, 핀치 줌, 스크롤) 대응
- lightweight-charts API 의존도 낮음
- 성능 양호 (인터랙션 중에만 루프 동작)

**단점:**
- 인터랙션 감지 로직 추가 필요

### 방안 B: setMarkers() 내장 API 사용

lightweight-charts의 `series.setMarkers()`를 사용하면 자동 좌표 동기화.

**장점:** 좌표 동기화 자동
**단점:** 정확한 거래 가격 위치 불가 (aboveBar/belowBar만 지원), 현재 커스텀 dot 스타일 유지 불가

### 방안 C: MutationObserver/ResizeObserver 활용

**단점:** 차트 내부 canvas 변경은 DOM 변경이 아니므로 감지 불가

## 3. 상세 설계 (방안 A)

### 수정 파일
- `components/StockChart.tsx` - WebView 내 HTML JavaScript 수정

### 수정 내용

#### 3.1 `updateDots()`를 인터랙션 기반 rAF 루프로 실행

```javascript
// 기존: 이벤트 기반 (누락 있음)
chart.timeScale().subscribeVisibleLogicalRangeChange(updateDots);
chart.subscribeCrosshairMove(function(){updateDots()});

// 변경: pointer 이벤트 + rAF 기반
var rafId = null;
var isInteracting = false;

function rafLoop() {
  if (isInteracting) {
    updateDots();
    rafId = requestAnimationFrame(rafLoop);
  } else {
    rafId = null;
  }
}

function startSync() {
  isInteracting = true;
  if (!rafId) rafId = requestAnimationFrame(rafLoop);
}

function stopSync() {
  // 약간의 딜레이 후 중지 (관성 스크롤 대응)
  setTimeout(function() {
    isInteracting = false;
    updateDots(); // 최종 위치 보정
  }, 200);
}

el.addEventListener('pointerdown', startSync);
el.addEventListener('pointermove', function(e) {
  if (e.buttons > 0) startSync();
});
document.addEventListener('pointerup', stopSync);
document.addEventListener('pointercancel', stopSync);

// 터치 줌(wheel 이벤트로도 발생) 대응
el.addEventListener('wheel', function() {
  startSync();
  clearTimeout(window._wheelTimer);
  window._wheelTimer = setTimeout(stopSync, 300);
}, { passive: true });

// 기존 subscribeVisibleLogicalRangeChange도 유지 (프로그래밍적 스크롤 대응)
chart.timeScale().subscribeVisibleLogicalRangeChange(updateDots);
```

#### 3.2 초기 구독 코드 변경 위치

`StockChart.tsx`의 `chartHTML` useMemo 내부, 기존 260~264번 줄:

```javascript
// 변경 전 (260-264)
if(window._tradeDots.length>0){
  updateDots();
  chart.timeScale().subscribeVisibleLogicalRangeChange(updateDots);
  chart.subscribeCrosshairMove(function(){updateDots()});
}

// 변경 후
updateDots();
// rAF 기반 인터랙션 동기화 설정 (위 3.1 코드)
// + subscribeVisibleLogicalRangeChange 유지
```

#### 3.3 cleanup 처리

`setupDots()` 호출 시 기존 rAF 취소:

```javascript
function setupDots(markers, cData) {
  // 기존 rAF 취소
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  isInteracting = false;
  // ... 기존 로직
}
```

## 4. 영향 범위

| 항목 | 변경 |
|------|------|
| `StockChart.tsx` | WebView HTML 내 JS 수정 |
| `HistoryTab.tsx` | 변경 없음 |
| `useTradeHistory.ts` | 변경 없음 |

## 5. 테스트 시나리오

| # | 시나리오 | 기대 결과 |
|---|---------|-----------|
| 1 | 차트 좌우 드래그 (시간축 팬) | 마커가 캔들과 함께 이동 |
| 2 | 차트 상하 드래그 (가격축 팬) | 마커 Y좌표가 가격에 맞게 변경 |
| 3 | 핀치 줌 인/아웃 | 마커 위치가 캔들 위치와 동기화 |
| 4 | 프로그래밍적 scrollToDate 호출 | 마커 위치 정상 업데이트 |
| 5 | 데이터 추가 로딩 (loadEarlierData) | 새 마커 포함 모든 마커 정상 동기화 |
| 6 | 터치 없이 정지 상태 | rAF 루프 미동작 (성능 영향 없음) |

## 6. 구현 순서

1. `StockChart.tsx`의 chartHTML 내 JS에서 rAF 기반 동기화 코드 추가
2. 기존 `subscribeCrosshairMove(function(){updateDots()})` 제거 (rAF로 대체)
3. `subscribeVisibleLogicalRangeChange(updateDots)` 유지 (프로그래밍적 스크롤 대응)
4. `setupDots()` 내 rAF cleanup 추가
5. iOS/Android 실기기 테스트
