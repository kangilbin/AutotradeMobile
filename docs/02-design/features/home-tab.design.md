# Design: home-tab (v3 — 미국장 등락률 랭킹 지원)

> 기존 홈 탭 순위 UI에 미국장(NASD) 등락률 랭킹을 추가하는 설계

## 1. 핵심 설계: Normalizer 패턴

미국장 API 응답 구조가 국내장과 완전히 다르므로, **hooks 레이어에서 정규화**하여 
기존 컴포넌트(`RankingTopCards`, `RankingListItem` 등)를 최소 변경으로 재활용한다.

```
[미국장 API] → OverseasFluctuationRawItem[] → normalizeToFluctuation() → FluctuationRankItem[]
                                                    ↓
[국내장 API] ─────────────────────────────→ FluctuationRankItem[]
                                                    ↓
                                    기존 컴포넌트 (변경 최소화)
```

## 2. 데이터 매핑 상세

### 2.1 미국장 등락률 원본 타입 (신규)

```typescript
// types/ranking.ts에 추가
export interface OverseasFluctuationRawItem {
    symb: string;      // 종목코드 (PFSA)
    knam: string;      // 한글 종목명
    enam: string;      // 영문 종목명
    last: string;      // 현재가 (소수점, 달러)
    diff: string;      // 전일대비 (소수점)
    sign: string;      // 등락부호 (2:상승, 3:보합, 5:하락)
    rate: string;      // 등락률 (부호 포함 "+30.98")
    tvol: string;      // 거래량
    excd: string;      // 거래소 코드 (NAS, NYS)
    rsym: string;      // 풀 심볼 (DNASPFSA)
}
```

### 2.2 정규화 함수 (신규 파일)

```typescript
// utils/normalizeRanking.ts
import { OverseasFluctuationRawItem, FluctuationRankItem } from '../types/ranking';

export function normalizeOverseasFluctuation(
    items: OverseasFluctuationRawItem[]
): FluctuationRankItem[] {
    return items.map((item, index) => ({
        stck_shrn_iscd: item.symb,
        data_rank: String(index + 1),
        hts_kor_isnm: item.knam,
        stck_prpr: item.last,           // 소수점 그대로 유지 (포맷은 UI에서)
        prdy_vrss: item.diff,
        prdy_vrss_sign: item.sign,      // sign 코드 동일 (2/3/5)
        prdy_ctrt: item.rate.replace(/[+\s]/g, ''),  // "+30.98" → "30.98"
        acml_vol: item.tvol,
    }));
}
```

**rate 정규화 로직:**
- 국내장 `prdy_ctrt`: `"2.30"` (부호 없음, sign 필드로 판단)
- 미국장 `rate`: `"+30.98"` 또는 `"-12.96"` (부호 포함)
- 정규화: `+` 제거, `-`는 유지 → 기존 UI의 `formatRate()` 로직과 호환

## 3. 파일별 변경 사항

### 3.1 types/ranking.ts — 수정

```diff
+ // 해외 등락률 원본 타입
+ export interface OverseasFluctuationRawItem {
+     symb: string;
+     knam: string;
+     enam: string;
+     last: string;
+     diff: string;
+     sign: string;
+     rate: string;
+     tvol: string;
+     excd: string;
+     rsym: string;
+ }
```

### 3.2 utils/normalizeRanking.ts — 신규

- `normalizeOverseasFluctuation()` 함수 1개
- 배열 인덱스 → `data_rank` 변환
- `rate` 부호 제거 정규화

### 3.3 contexts/backEndApi.ts — 수정

```typescript
// 해외 등락률 순위 조회 (신규)
export const getOverseasFluctuationRank = async (): Promise<OverseasFluctuationRawItem[] | undefined> => {
    try {
        const response = await api.get('/stocks/ranking/overseas-fluctuation');
        return response.data.data;
    } catch (error: unknown) {
        return handleApiError(error, '해외 등락률 순위 조회');
    }
};
```

> 백엔드 엔드포인트는 `/stocks/ranking/overseas-fluctuation`으로 가정.
> 실제 엔드포인트가 다르면 조정 필요.

### 3.4 hooks/useRanking.ts — 수정

`useFluctuationRank` 훅에서 `mrktCode`에 따라 분기:

```typescript
export const useFluctuationRank = (): UseFluctuationReturn => {
    const [data, setData] = useState<FluctuationRankItem[]>([]);
    const [loading, setLoading] = useState(false);

    const fetch = useCallback(async (
        rankSort: FluctuationSortCode,
        prcCls: FluctuationPriceCode,
        mrktCode: string = 'J'
    ) => {
        setLoading(true);
        try {
            if (mrktCode === 'NASD') {
                // 미국장: 별도 API → normalizer
                const raw = await getOverseasFluctuationRank();
                setData(raw ? normalizeOverseasFluctuation(raw) : []);
            } else {
                // 국내장: 기존 로직
                const result = await getFluctuationRank(rankSort, prcCls, mrktCode);
                setData(result ?? []);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    return { data, loading, fetch };
};
```

### 3.5 components/ranking/RankingTopCards.tsx — 수정

**변경 포인트: 가격 포맷 + 통화 단위**

```diff
- import 내부 formatPrice (parseInt 기반)
+ import { formatPrice } from '../../utils/format';
+ import { useMarketStore } from '../../utils/useMarketStore';

  function RankingTopCards({ items, activeTab, onItemPress }: RankingTopCardsProps) {
+     const mrktCode = useMarketStore((s) => s.mrktCode);
      // ...
-     <Text>{formatPrice(first.stck_prpr)}원</Text>
+     <Text>{formatPrice(first.stck_prpr, mrktCode)}{mrktCode === 'J' ? '원' : ''}</Text>
  }
```

> `formatPrice(price, 'NASD')` → `"$0.76"` (이미 `$` 포함)
> `formatPrice(price, 'J')` → `"75,000"` + `"원"` 별도 추가

### 3.6 components/ranking/RankingListItem.tsx — 수정

동일한 가격 포맷 변경:

```diff
+ // props에 mrktCode 추가
  interface RankingListItemProps {
      // ... 기존 props
+     mrktCode?: string;
  }

- const formatPrice = (price: string) => {
-     const num = parseInt(price, 10);
-     if (isNaN(num)) return price;
-     return num.toLocaleString('ko-KR');
- };

+ import { formatPrice as formatPriceUtil } from '../../utils/format';

  // 사용부
- <Text>{formatPrice(price)}원</Text>
+ <Text>{formatPriceUtil(price, mrktCode as MarketCode)}{mrktCode === 'J' ? '원' : ''}</Text>

  // changeAmount도 동일 처리
- {signPrefix}{formatPrice(changeAmount.replace('-', ''))}
+ {signPrefix}{formatPriceUtil(changeAmount.replace('-', ''), mrktCode as MarketCode)}
```

### 3.7 components/ranking/RankingFilterChips.tsx — 수정

미국장일 때 등락률 필터를 단순화:

```diff
+ interface RankingFilterChipsProps {
+     // ... 기존 props
+     isOverseas?: boolean;
+ }

  {activeTab === 'fluctuation' && (
-     <>
-         {FLUCTUATION_SORT_OPTIONS.map(...)}
-         <View style={styles.separator} />
-         {priceOptions.map(...)}
-     </>
+     isOverseas ? null : (
+         <>
+             {FLUCTUATION_SORT_OPTIONS.map(...)}
+             <View style={styles.separator} />
+             {priceOptions.map(...)}
+         </>
+     )
  )}
```

> 미국장 등락률은 필터 옵션 없음 (API가 필터 미지원)

### 3.8 components/ranking/RankingTabSelector.tsx — 수정

미국장일 때 거래량/체결강도 탭 비활성화:

```diff
  interface RankingTabSelectorProps {
      activeTab: RankingTab;
      onTabChange: (tab: RankingTab) => void;
+     disabledTabs?: RankingTab[];
  }

  // 탭 렌더링 시
  const isDisabled = disabledTabs?.includes(tab.key);
  // disabled면: opacity: 0.3, onPress 무시
```

### 3.9 app/(tabs)/home.tsx — 수정

```diff
+ const isOverseas = useMarketStore((s) => s.isOverseas);

  // 미국장일 때 등락률 탭으로 강제 전환
+ useEffect(() => {
+     if (isOverseas && activeTab !== 'fluctuation') {
+         setActiveTab('fluctuation');
+     }
+ }, [isOverseas]);

  // RankingTabSelector에 비활성 탭 전달
  <RankingTabSelector
      activeTab={activeTab}
      onTabChange={setActiveTab}
+     disabledTabs={isOverseas ? ['volume', 'volume_power'] : []}
  />

  // FilterChips에 해외 여부 전달
  <RankingFilterChips
      {...filterChipsProps}
+     isOverseas={isOverseas}
  />

  // RankingListItem에 mrktCode 전달
  <RankingListItem
      {...itemProps}
+     mrktCode={mrktCode}
  />
```

## 4. 화면 구조 (미국장)

```
┌─────────────────────────────────┐
│  등락률    거래량    체결강도      │  ← 거래량/체결강도 비활성 (opacity 0.3)
│  ═══════                        │
├─────────────────────────────────┤
│  (필터 칩 없음)                  │  ← 미국장은 필터 미지원
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ 🥇 프로퓨사          $0.76  │ │  ← 달러 포맷
│ │    PFSA          +30.98%   │ │
│ └─────────────────────────────┘ │
│ ┌──────────┐ ┌──────────────┐  │
│ │🥈 취훠    │ │🥉 비보스     │  │
│ │ $0.09    │ │  $1.32       │  │
│ │ -12.96%  │ │  +1.54%      │  │
│ └──────────┘ └──────────────┘  │
├─────────────────────────────────┤
│ ┌───────────────────────────┐   │
│ │ ④  샤오아이(ADR)    $0.13 │   │
│ │    AIXI       +33.10%    │   │
│ └───────────────────────────┘   │
│         (FlatList 스크롤)       │
└─────────────────────────────────┘
```

## 5. 구현 순서

| 순서 | 작업 | 파일 | 유형 |
|------|------|------|------|
| 1 | `OverseasFluctuationRawItem` 타입 추가 | `types/ranking.ts` | 수정 |
| 2 | `normalizeOverseasFluctuation()` 함수 | `utils/normalizeRanking.ts` | 신규 |
| 3 | 해외 등락률 API 함수 추가 | `contexts/backEndApi.ts` | 수정 |
| 4 | `useFluctuationRank` 훅 분기 로직 | `hooks/useRanking.ts` | 수정 |
| 5 | `RankingTopCards` 가격 포맷 변경 | `components/ranking/RankingTopCards.tsx` | 수정 |
| 6 | `RankingListItem` 가격 포맷 + mrktCode prop | `components/ranking/RankingListItem.tsx` | 수정 |
| 7 | `RankingFilterChips` 해외 필터 숨김 | `components/ranking/RankingFilterChips.tsx` | 수정 |
| 8 | `RankingTabSelector` 비활성 탭 지원 | `components/ranking/RankingTabSelector.tsx` | 수정 |
| 9 | `home.tsx` 해외 분기 + prop 전달 | `app/(tabs)/home.tsx` | 수정 |

## 6. 성능 고려사항

- Normalizer는 순수 함수 → `useMemo`로 캐싱 불필요 (hooks 내부에서 1회 실행)
- 미국장 데이터 크기: ~100개 아이템 → 정규화 비용 무시 가능
- 기존 `React.memo`, `useCallback` 패턴 유지

## 7. 엣지 케이스

| 케이스 | 처리 |
|--------|------|
| 미국장에서 거래량 탭 클릭 | 비활성화로 터치 무시 |
| 마켓 전환 시 거래량 탭 선택 중 | `useEffect`로 등락률 탭 강제 전환 |
| 미국장 API 빈 배열 | 기존 빈 상태 UI 재활용 (`순위 데이터가 없습니다`) |
| `rate` 값에 공백 포함 (`" 0.00"`) | `replace(/[+\s]/g, '')` 로 정규화 |
| `sign` 코드 `'3'` (보합) | 기존 국내장 로직과 동일 처리 |
