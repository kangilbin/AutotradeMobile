# Design: chart-clip-fix

> 차트 좌우 잘림 현상 수정

## 1. 문제 분석

### 현상
- ChartTab의 StockChart가 좌측/우측 모두 잘려서 표시됨

### 근본 원인
| 파일 | 라인 | 문제 |
|------|------|------|
| `app/(tabs)/swing/detail.tsx` | L327 | `content` ScrollView에 `padding: 20` 적용 → 차트 좌우 20px씩 잘림 |
| `components/StockChart.tsx` | L319 | container `width`를 `Dimensions.get('window')`로 고정 → 부모 padding 무시하고 화면 전체 너비 사용 시도 → overflow: hidden으로 오른쪽 잘림 |

### 잘림 구조
```
[detail.tsx ScrollView padding:20]
  [ChartTab]
    [StockChart container width=screenWidth]  ← 부모보다 40px 넓음
      [WebView]
        [LightweightCharts]
```

## 2. 해결 방안

### 방안 A: StockChart width를 유연하게 변경 (권장)
- `StockChart.tsx`의 container에서 고정 `width`를 제거하고 `alignSelf: 'stretch'`로 부모 크기에 맞춤
- WebView 내부 JS에서도 `el.clientWidth`를 사용하므로 자동 대응

### 방안 B: ChartTab에서 negative margin 적용
- ChartTab에 `marginHorizontal: -20` 적용하여 부모 padding 상쇄
- 단점: 부모 padding 값에 의존하는 하드코딩

### 선택: 방안 A

## 3. 변경 사항

### 3.1 `components/StockChart.tsx`

**변경 전:**
```typescript
container: {
    width,  // Dimensions.get('window').width
    height: Math.max(300, height * 0.45),
    ...
}
```

**변경 후:**
```typescript
container: {
    alignSelf: 'stretch',  // 부모 너비에 맞춤
    height: Math.max(300, height * 0.45),
    ...
}
```

### 3.2 `components/swing/ChartTab.tsx`

**변경 전:**
```typescript
container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
}
```

**변경 후:**
```typescript
container: {
    flex: 1,
}
```
- `alignItems: 'center'`가 자식의 stretch를 방해하므로 제거

## 4. 영향 범위

StockChart를 사용하는 다른 곳도 확인 필요:

| 사용처 | 영향 |
|--------|------|
| `components/swing/ChartTab.tsx` | 직접 수정 대상 |
| 기타 StockChart 사용처 | `alignSelf: 'stretch'`이므로 부모 크기에 맞춤 → 동일하게 동작 |

## 5. 구현 순서

1. `StockChart.tsx` — container style에서 `width` → `alignSelf: 'stretch'`
2. `ChartTab.tsx` — container에서 `alignItems`, `justifyContent` 제거
3. 실기기/시뮬레이터에서 좌우 잘림 해소 확인
