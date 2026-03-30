# history_tab (화면 분리 리팩토링 + 공통 컴포넌트화) Analysis Report

> **Analysis Type**: Gap Analysis (Design vs Implementation -- Enhanced Requirements)
>
> **Project**: AutotradeMobile
> **Analyst**: Claude Code (gap-detector)
> **Date**: 2026-03-16
> **Design Doc**: [history_tab.design.md](../02-design/features/history_tab.design.md)
> **Plan Doc**: [history_tab.plan.md](../01-plan/features/history_tab.plan.md)

---

## 1. Analysis Overview

### 1.1 Analysis Purpose

Verify the full scope of the history_tab refactoring against the original design document plus subsequent enhancements: separate paging API for HistoryTab, separate stats API for ChartTab, shared TradeItemData type with converter functions, shared TradeHistoryItem component used by both HistoryTab and backtesting.tsx, and tag chip style for trade reasons.

### 1.2 Analysis Scope

- **Design Document**: `docs/02-design/features/history_tab.design.md`
- **Implementation Files**:
  - `types/tradeItem.ts` (NEW)
  - `types/tradeHistory.ts`
  - `components/swing/TradeHistoryItem.tsx`
  - `components/swing/ChartTab.tsx`
  - `components/swing/HistoryTab.tsx`
  - `app/(tabs)/swing/detail.tsx`
  - `app/(tabs)/swing/backtesting.tsx`
  - `contexts/backEndApi.ts`
  - `hooks/useTradeHistory.ts` (reference)
- **Analysis Date**: 2026-03-16
- **Total Requirements**: 27 items

---

## 2. Gap Analysis: ChartTab.tsx

| # | Requirement | Status | Evidence |
|---|-------------|:------:|----------|
| 1 | Uses useTradeHistory hook with real API data (no dummy data, no "다음 봉 추가" button) | PASS | Lines 18-27: `useTradeHistory(swingData?.SWING_ID ?? 0)`. No dummy data or "다음 봉 추가" present. |
| 2 | Shows chart legend (매수/매도/20EMA) | PASS | Lines 62-77: Three legend items -- 매수 (Colors.profit), 매도 (Colors.loss), 20EMA (Colors.primary, conditional). |
| 3 | Shows StockChart with candlestick, markers, lineOverlays | PASS | Lines 82-89: `<StockChart data={priceCandles} markers={tradeMarkers} chartType="candlestick" lineOverlays={lineOverlays}>`. |
| 4 | Stats bar uses SEPARATE API (getTradeStats) for total counts instead of trades array | PASS | Lines 7,30-37: Imports `getTradeStats` from backEndApi. `useState<TradeStats>` + `useEffect` calls `getTradeStats(swingData.SWING_ID)`. Stats rendered at lines 100-117 using `stats.total_count`, `stats.buy_count`, `stats.sell_count`. Does NOT use trades array for counts. |
| 5 | Has its own ScrollView | PASS | Line 59: `<ScrollView style={styles.container} showsVerticalScrollIndicator={false}>` wraps all content. |

**ChartTab Score: 5/5 (100%)**

---

## 3. Gap Analysis: HistoryTab.tsx

| # | Requirement | Status | Evidence |
|---|-------------|:------:|----------|
| 6 | No chart, no legend, no stats bar, no chart sync logic | PASS | No StockChart, chartLegend, statsBar, webViewRef, isSyncFromChart/List, debounceTimer in file. |
| 7 | Uses separate paging API (getTradeHistoryList) instead of useTradeHistory | PASS | Line 7: `import { getTradeHistoryList } from '../../contexts/backEndApi'`. No useTradeHistory import. Manual `useState` for trades, page, hasNext, totalCount. |
| 8 | FlatList with onEndReached for infinite scroll (PAGE_SIZE=100) | PASS | Line 10: `const PAGE_SIZE = 100`. Lines 109-120: `<FlatList ... onEndReached={loadMore} onEndReachedThreshold={0.3}>`. `loadMore` at lines 44-56 fetches next page and appends. |
| 9 | Uses fromTradeHistory() to convert TradeHistory to TradeItemData | PASS | Line 5: `import { TradeItemData, fromTradeHistory } from '../../types/tradeItem'`. Line 58: `const tradeItems: TradeItemData[] = useMemo(() => trades.map(fromTradeHistory), [trades])`. FlatList data={tradeItems}. |
| 10 | Shows totalCount from API response in header | PASS | Line 22: `const [totalCount, setTotalCount] = useState(0)`. Line 34: `setTotalCount(result.total_count)`. Line 71: `<Text style={styles.sectionCount}>{totalCount}건</Text>`. Uses API-provided total, not local array length. |

**HistoryTab Score: 5/5 (100%)**

---

## 4. Gap Analysis: TradeHistoryItem.tsx

| # | Requirement | Status | Evidence |
|---|-------------|:------:|----------|
| 11 | Takes TradeItemData (not TradeHistory) as prop | PASS | Line 3: `import { TradeItemData } from '../../types/tradeItem'`. Line 8: `trade: TradeItemData`. |
| 12 | Shows accent bar, badge, 3-column stats (단가/수량/금액) | PASS | Lines 27: accent bar. Lines 30-38: badge (매수/매도) + index + date. Lines 41-56: 3-column stats with 단가/수량/금액 labels and dividers. |
| 13 | Shows PnL section for sells (realizedPnl, realizedPnlPct if available, totalFee labeled "수수료+세금") | PASS | Lines 59-86: Conditional `{!trade.isBuy && trade.realizedPnl != null && ...}` shows 실현손익, 수익률 (conditional on realizedPnlPct != null), and 수수료+세금 (conditional on totalFee != null). Label text at line 79: "수수료+세금". |
| 14 | Shows currentCapital (거래 후 잔고) when available (backtesting only) | PASS | Lines 89-96: `{trade.currentCapital != null && ...}` renders "거래 후 잔고" row. |
| 15 | Shows reasons as tag chips (not expandable/collapsible) | PASS | Lines 99-114: `reasonChips` container with `flexWrap: 'wrap'`. Each reason rendered as a chip with colored dot + text. No `useState(expanded)`, no toggle, no LayoutAnimation. Pure tag chip display. |

**TradeHistoryItem Score: 5/5 (100%)**

---

## 5. Gap Analysis: types/tradeItem.ts (NEW)

| # | Requirement | Status | Evidence |
|---|-------------|:------:|----------|
| 16 | TradeItemData common type with all fields (id, isBuy, date, price, quantity, amount, realizedPnl, realizedPnlPct, totalFee, currentCapital, reasons) | PASS | Lines 5-20: All listed fields present. `id: string`, `isBuy: boolean`, `date: string`, `price: number`, `quantity: number`, `amount: number`, `realizedPnl?: number|null`, `realizedPnlPct?: number|null`, `totalFee?: number|null`, `currentCapital?: number|null`, `reasons: string[]`. |
| 17 | fromTradeHistory() converter function | PASS | Lines 23-41: `export const fromTradeHistory = (t: TradeHistory): TradeItemData`. Parses TRADE_REASONS JSON, maps all fields. |
| 18 | fromBacktestingTrade() converter function | PASS | Lines 44-61: `export const fromBacktestingTrade = (t: BacktestingTrade, index: number): TradeItemData`. Computes totalFee = commission + tax, maps all fields including currentCapital and realized_pnl_pct. |

**types/tradeItem.ts Score: 3/3 (100%)**

---

## 6. Gap Analysis: backtesting.tsx

| # | Requirement | Status | Evidence |
|---|-------------|:------:|----------|
| 19 | No longer has its own TradeItem component (removed) | PASS | No local `TradeItem` component defined. No inline trade card rendering. Only imports `TradeHistoryItem` from shared component (line 14). |
| 20 | Uses fromBacktestingTrade() + shared TradeHistoryItem | PASS | Line 13: `import { TradeItemData, fromBacktestingTrade } from '../../../types/tradeItem'`. Line 14: `import TradeHistoryItem from '../../../components/swing/TradeHistoryItem'`. Lines 156-158: `tradeItems = result.trades.map((t, i) => fromBacktestingTrade(t, i))`. Line 162: `<TradeHistoryItem trade={item} index={index} />`. |
| 21 | Unused trade card styles removed | PASS | StyleSheet (lines 313-540) contains only: container, header, content, listFooter, strategy card, return highlight, chart section, legend, stats card, trades section, empty state. No `tradeCard`, `tradeHeader`, `tradeBadge`, `tradeStats`, `pnlSection` or similar styles that would indicate a local trade item implementation. |

**backtesting.tsx Score: 3/3 (100%)**

---

## 7. Gap Analysis: detail.tsx

| # | Requirement | Status | Evidence |
|---|-------------|:------:|----------|
| 22 | ChartTab rendered in flex View (not ScrollView); HistoryTab in flex View | PASS | Lines 274-286: `activeTab === 0` -> ScrollView (SettingsTab), `activeTab === 1` -> `<View style={{ flex: 1 }}><ChartTab>`, else -> `<View style={{ flex: 1 }}><HistoryTab>`. |

**detail.tsx Score: 1/1 (100%)**

---

## 8. Gap Analysis: API Layer (contexts/backEndApi.ts)

| # | Requirement | Status | Evidence |
|---|-------------|:------:|----------|
| 24 | getTradeStats API function exists (GET /trade-history/{swingId}/stats) | PASS | Lines 462-471: `export const getTradeStats = async (swingId: number): Promise<TradeStats|undefined>`. Calls `api.get(\`/trade-history/${swingId}/stats\`)`. |
| 25 | getTradeHistoryList API function exists (GET /trade-history/{swingId}/list with page/size params) | PASS | Lines 474-487: `export const getTradeHistoryList = async (swingId, page=1, size=100)`. Calls `api.get(\`/trade-history/${swingId}/list\`, { params: { page, size } })`. |
| 26 | TradeHistory type has TOTAL_FEE and REALIZED_PNL fields | PASS | types/tradeHistory.ts lines 10-11: `TOTAL_FEE: number | null` and `REALIZED_PNL: number | null`. |
| 27 | TradeStats and TradeHistoryPageResponse types exist | PASS | types/tradeHistory.ts lines 32-37: `TradeStats` with total_count, buy_count, sell_count. Lines 40-46: `TradeHistoryPageResponse` with trades, total_count, page, size, has_next. Both imported in backEndApi.ts line 18. |

**API Layer Score: 4/4 (100%)**

---

## 9. Differences Found

### 9.1 Missing Features (Design O, Implementation X)

None.

### 9.2 Added Features (Design X, Implementation O)

| # | Item | Implementation Location | Description | Impact |
|---|------|------------------------|-------------|--------|
| 1 | ListEmptyComponent | HistoryTab.tsx:76-83 | Empty state message when no trades | Positive -- better UX |
| 2 | ListFooterComponent | HistoryTab.tsx:85-95 | Loading more indicator + bottom spacer | Positive -- necessary for pagination UX |
| 3 | Loading states | ChartTab.tsx:49-56, HistoryTab.tsx:99-106 | Full-screen loading indicators | Positive -- necessary UX |
| 4 | Backtesting chart+legend+stats | backtesting.tsx:216-269 | Chart section with legend and stats grid in backtesting, reusing same visual patterns | Positive -- consistent with ChartTab |

### 9.3 Changed Features (Design != Implementation)

| # | Item | Design (original) | Implementation | Impact |
|---|------|--------------------|----------------|--------|
| 1 | Reason UI | Expandable/collapsible with LayoutAnimation (Design Section 4) | Tag chips, always visible, no toggle | Low -- Subsequent requirement (#15) explicitly changed this. Implementation follows the updated spec. |
| 2 | HistoryTab data source | `useTradeHistory` hook (Design Section 3.2) | Separate paging API `getTradeHistoryList` | Low -- Subsequent requirement (#7) explicitly changed this. Better for large datasets. |
| 3 | ChartTab stats source | `trades.length` from useTradeHistory (Design Section 2.2) | Separate API `getTradeStats` | Low -- Subsequent requirement (#4) explicitly changed this. Avoids full trade list fetch for counts. |

All "changed" items reflect intentional enhancements made after the original design. The implementation follows the updated requirements correctly.

---

## 10. Architecture Compliance

| Layer | Component | Expected Location | Actual Location | Status |
|-------|-----------|-------------------|-----------------|--------|
| Domain (Types) | TradeItemData | `types/` | `types/tradeItem.ts` | PASS |
| Domain (Types) | TradeHistory, TradeStats, TradeHistoryPageResponse | `types/` | `types/tradeHistory.ts` | PASS |
| Presentation (UI) | ChartTab | `components/swing/` | `components/swing/ChartTab.tsx` | PASS |
| Presentation (UI) | HistoryTab | `components/swing/` | `components/swing/HistoryTab.tsx` | PASS |
| Presentation (UI) | TradeHistoryItem | `components/swing/` | `components/swing/TradeHistoryItem.tsx` | PASS |
| Presentation (Page) | detail.tsx | `app/(tabs)/swing/` | `app/(tabs)/swing/detail.tsx` | PASS |
| Presentation (Page) | backtesting.tsx | `app/(tabs)/swing/` | `app/(tabs)/swing/backtesting.tsx` | PASS |
| Application (Hook) | useTradeHistory | `hooks/` | `hooks/useTradeHistory.ts` | PASS |
| Infrastructure (API) | getTradeStats, getTradeHistoryList | `contexts/` | `contexts/backEndApi.ts` | PASS |

Dependency direction: Presentation -> Application (hook) / Domain (types) -> Infrastructure (API). No violations.

**Architecture Score: 100%**

---

## 11. Convention Compliance

| Category | Convention | Compliance | Violations |
|----------|-----------|:----------:|------------|
| Components | PascalCase | 100% | None |
| Functions/Hooks | camelCase | 100% | `fromTradeHistory`, `fromBacktestingTrade`, `getTradeStats`, etc. |
| Constants | UPPER_SNAKE_CASE | 100% | `PAGE_SIZE` |
| Files (component) | PascalCase.tsx | 100% | ChartTab.tsx, HistoryTab.tsx, TradeHistoryItem.tsx |
| Files (type) | camelCase.ts | 100% | tradeItem.ts, tradeHistory.ts |
| React.memo usage | FlatList items memoized | 100% | TradeHistoryItem uses React.memo |
| FlatList for lists | Used instead of ScrollView+map | 100% | HistoryTab and backtesting.tsx both use FlatList |
| TypeScript types | All props and returns typed | 100% | TradeItemData, TradeHistoryItemProps, ChartTabProps, etc. |
| useCallback/useMemo | Performance patterns applied | 100% | renderTradeItem, keyExtractor, ListHeader, tradeItems all memoized |

**Convention Score: 100%**

---

## 12. Overall Scores

| Category | Score | Status |
|----------|:-----:|:------:|
| Design Match (27 items) | 100% | PASS |
| Architecture Compliance | 100% | PASS |
| Convention Compliance | 100% | PASS |
| **Overall** | **100%** | **PASS** |

```
+----------------------------------------------+
|  Overall Design Match Rate: 100%             |
+----------------------------------------------+
|  PASS:            27/27 requirements         |
|  Added (positive):  4 items                  |
|  Changed (intentional): 3 items              |
|  Missing:            0 items                 |
|  Not implemented:    0 items                 |
+----------------------------------------------+
```

---

## 13. Recommended Actions

### 13.1 Design Document Update (Recommended)

The original design document (`history_tab.design.md`) should be updated to reflect the subsequent enhancements:

| # | Section | Update Needed |
|---|---------|---------------|
| 1 | Section 3.2 | HistoryTab now uses `getTradeHistoryList` paging API instead of `useTradeHistory` hook |
| 2 | Section 2.2 | ChartTab stats now use separate `getTradeStats` API, not `trades.length` |
| 3 | Section 4 | TradeHistoryItem reason UI changed from expandable/collapsible to tag chips |
| 4 | New section | Add `types/tradeItem.ts` (TradeItemData, fromTradeHistory, fromBacktestingTrade) |
| 5 | New section | Add backtesting.tsx shared component integration |

### 13.2 No Code Changes Required

All 27 requirements are fully implemented. The implementation quality is high with proper memoization, pagination, type safety, and component reuse.

---

## 14. Key Design Decisions Validated

1. **Separate APIs for stats vs list**: ChartTab calls `getTradeStats` (lightweight) while HistoryTab calls `getTradeHistoryList` (paginated). This avoids fetching all trades just for counts, and enables efficient pagination for large trade histories.

2. **Shared TradeItemData type**: The adapter pattern (`fromTradeHistory`, `fromBacktestingTrade`) cleanly normalizes different backend response shapes into a single UI-friendly type. TradeHistoryItem only knows about `TradeItemData`, not backend specifics.

3. **Tag chips over expandable reasons**: Simpler interaction model, all reasons visible at a glance, no state management needed in TradeHistoryItem (stateless component with React.memo).

4. **HistoryTab does NOT use useTradeHistory**: Separate concern -- useTradeHistory is for chart data (candles, markers, EMA overlays) while HistoryTab only needs the trade list with pagination.

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-03-14 | Initial gap analysis (pre-refactoring) | Claude Code |
| 2.0 | 2026-03-15 | Re-analysis for screen separation refactoring (22 items) | Claude Code |
| 3.0 | 2026-03-16 | Full analysis with enhanced requirements (27 items): paging API, stats API, TradeItemData, shared component, tag chips | Claude Code |