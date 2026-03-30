# Design: history_tab (화면 분리 리팩토링)

> Plan: `docs/01-plan/features/history_tab.plan.md`

## 1. 변경 개요

| # | 작업 | 파일 | 변경 유형 |
|---|------|------|----------|
| 1 | ChartTab 전면 리작성 | `components/swing/ChartTab.tsx` | 전면 재작성 |
| 2 | HistoryTab 간소화 | `components/swing/HistoryTab.tsx` | 대폭 수정 |
| 3 | TradeHistoryItem reason UI | `components/swing/TradeHistoryItem.tsx` | 수정 |
| 4 | detail.tsx ChartTab 렌더링 | `app/(tabs)/swing/detail.tsx` | 소폭 수정 |

## 2. ChartTab.tsx 전면 리작성

### 2.1 현재 상태
- 더미 데이터 5개 캔들 + "다음 봉 추가" 버튼
- 실질적 기능 없음

### 2.2 변경 후 구조

```typescript
interface ChartTabProps {
    swingData: SwingItem | null;
}

export default function ChartTab({ swingData }: ChartTabProps) {
    // useTradeHistory 훅 사용
    const {
        loading, loadingMore, trades,
        priceCandles, tradeMarkers, lineOverlays,
        loadEarlierData, setVisibleDateRange, hasEarlierData,
    } = useTradeHistory(swingData?.SWING_ID ?? 0);

    // 통계: trades 전체 기준 (기간 필터 없음)
    const stats = useMemo(() => ({
        total: trades.length,
        buyCount: trades.filter(t => t.TRADE_TYPE === 'B').length,
        sellCount: trades.filter(t => t.TRADE_TYPE === 'S').length,
    }), [trades]);

    // 차트 visible range 변경 핸들러
    const handleVisibleRangeChange = useCallback(...);

    return (
        <View>
            {/* 범례 */}
            <ChartLegend lineOverlays={lineOverlays} />

            {/* 차트 */}
            <StockChart ... />
            {loadingMore && <LoadingMoreOverlay />}

            {/* 거래 통계 (전체 건수) */}
            <StatsBar stats={stats} />
        </View>
    );
}
```

### 2.3 HistoryTab에서 이동할 요소

| 요소 | HistoryTab 위치 | ChartTab으로 이동 |
|------|----------------|------------------|
| 범례 (chartLegend) | ListHeader 내 105-120행 | Yes |
| StockChart 컴포넌트 | ListHeader 내 123-140행 | Yes |
| 통계 바 (statsBar) | ListHeader 내 143-158행 | Yes (전체 건수로 변경) |
| webViewRef | 16행 | Yes |
| useTradeHistory 훅 | 22-33행 | Yes |
| handleVisibleRangeChange | 50-65행 | Yes |
| loadEarlierData 연동 | 59-60행 | Yes |

### 2.4 detail.tsx 수정

현재 ChartTab은 ScrollView 내에서 렌더링됨. 차트가 추가되므로 HistoryTab처럼 flex 컨테이너에서 렌더링하도록 변경.

```typescript
// 변경 전 (detail.tsx 278-286)
{activeTab === 2 ? (
    <View style={{ flex: 1 }}>
        <HistoryTab swingData={swingData} />
    </View>
) : (
    <ScrollView ...>{renderTabContent()}</ScrollView>
)}

// 변경 후: ChartTab도 자체 스크롤 처리
{activeTab === 0 ? (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <SettingsTab swingData={swingData} onStatusChange={handleStatusChange} />
    </ScrollView>
) : activeTab === 1 ? (
    <View style={{ flex: 1 }}>
        <ChartTab swingData={swingData} />
    </View>
) : (
    <View style={{ flex: 1 }}>
        <HistoryTab swingData={swingData} />
    </View>
)}
```

## 3. HistoryTab.tsx 간소화

### 3.1 제거할 요소

| 요소 | 사유 |
|------|------|
| `webViewRef` | 차트 연동 제거 |
| `isSyncFromChart`, `isSyncFromList`, `debounceTimer` | 차트↔리스트 동기화 제거 |
| `filteredTrades` 사용 | 전체 trades 사용으로 변경 |
| `handleVisibleRangeChange` | ChartTab으로 이동 |
| `handleViewableItemsChanged` | 차트 동기화 제거 |
| `viewabilityConfig` | 차트 동기화 제거 |
| ListHeader 내 범례/차트/통계 | ChartTab으로 이동 |
| `useEffect` (filteredTrades 동기화) | 불필요 |

### 3.2 변경 후 구조

```typescript
export default function HistoryTab({ swingData }: HistoryTabProps) {
    const { loading, trades } = useTradeHistory(swingData?.SWING_ID ?? 0);

    // trades 전체를 표시 (필터 없음)

    return (
        <FlatList
            data={trades}
            renderItem={renderTradeItem}
            keyExtractor={keyExtractor}
            ListHeaderComponent={
                <View style={styles.sectionHeader}>
                    <Text>매매 내역</Text>
                    <Text>{trades.length}건</Text>
                </View>
            }
            ListEmptyComponent={...}
        />
    );
}
```

### 3.3 useTradeHistory 사용 필드

| 필드 | ChartTab | HistoryTab |
|------|----------|------------|
| loading | O | O |
| loadingMore | O | X |
| trades | O (통계용) | O (리스트 표시) |
| priceCandles | O | X |
| tradeMarkers | O | X |
| lineOverlays | O | X |
| filteredTrades | X | X |
| loadEarlierData | O | X |
| setVisibleDateRange | O | X |
| hasEarlierData | O | X |

## 4. TradeHistoryItem.tsx reason UI 개선

### 4.1 변경 사항

- `useState`로 `expanded` 상태 추가
- reasons가 있을 때 "매매사유 N건" + 토글 아이콘 표시
- 터치 시 `LayoutAnimation`으로 부드러운 펼치기/접기
- 펼친 상태: 각 사유를 개별 불릿 항목으로 표시

### 4.2 코드 변경

```typescript
import { useState } from 'react';
import { LayoutAnimation, Platform, UIManager, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Android LayoutAnimation 활성화
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const TradeHistoryItem = React.memo(({ trade, index }: TradeHistoryItemProps) => {
    const [expanded, setExpanded] = useState(false);

    const toggleExpand = useCallback(() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(prev => !prev);
    }, []);

    // ... 기존 헤더 + 거래 상세 ...

    {/* 매매 사유 - 토글 */}
    {reasons.length > 0 && (
        <>
            <TouchableOpacity style={styles.reasonToggle} onPress={toggleExpand}>
                <Text style={styles.reasonToggleText}>
                    매매사유 {reasons.length}건
                </Text>
                <Ionicons
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={Colors.textSecondary}
                />
            </TouchableOpacity>

            {expanded && (
                <View style={styles.reasonList}>
                    {reasons.map((reason, idx) => (
                        <View key={idx} style={styles.reasonItem}>
                            <View style={styles.reasonBullet} />
                            <Text style={styles.reasonItemText}>{reason}</Text>
                        </View>
                    ))}
                </View>
            )}
        </>
    )}
});
```

### 4.3 추가 스타일

```typescript
// 토글 버튼
reasonToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
},
reasonToggleText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
},

// 펼친 사유 리스트
reasonList: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginTop: Spacing.xs,
    gap: Spacing.sm,
},
reasonItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
},
reasonBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginTop: 5,  // 텍스트 첫 줄 중앙 정렬
},
reasonItemText: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
    lineHeight: 20,
},
```

## 5. 구현 순서

1. **TradeHistoryItem.tsx** - reason 펼치기/접기 (독립적, 먼저 구현)
2. **ChartTab.tsx** - 전면 리작성 (차트+범례+통계)
3. **HistoryTab.tsx** - 차트/통계/동기화 제거, 리스트만 유지
4. **detail.tsx** - ChartTab 렌더링 방식 변경 (ScrollView → flex)

## 6. 테스트 시나리오

| # | 시나리오 | 기대 결과 |
|---|---------|-----------|
| 1 | 차트 탭 진입 | 캔들차트 + 범례 + 통계(전체 건수) 표시 |
| 2 | 차트 좌우/상하 드래그 | 마커 동기화 정상 (marker-sync-fix) |
| 3 | 차트 시작점 근접 스크롤 | 이전 6개월 데이터 추가 로딩 |
| 4 | 거래내역 탭 진입 | 거래 리스트만 표시 (차트 없음) |
| 5 | 거래 항목 - 사유 접힌 상태 | "매매사유 N건 [▼]" 표시 |
| 6 | 거래 항목 - 사유 펼치기 | 각 사유 불릿 리스트 + 애니메이션 |
| 7 | 거래 항목 - 사유 접기 | 부드러운 접기 애니메이션 |
| 8 | 사유 없는 거래 항목 | 사유 토글 영역 미표시 |
| 9 | 설정 탭 → 차트 탭 전환 | 각 탭 정상 렌더링, 메모리 이슈 없음 |