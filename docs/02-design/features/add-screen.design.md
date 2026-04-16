# Design: 스윙 등록 화면 해외 주식 대응 (add-screen)

> Plan: `docs/01-plan/features/add-screen.plan.md`

## 변경 대상

**단일 파일**: `app/(tabs)/stock/add.tsx`  
**유틸 활용**: `utils/format.ts`, `types/market.ts` (수정 없음)

---

## D-1. 마켓 코드 파생 변수 추가

컴포넌트 상단에서 `mrktCode`로부터 파생 값을 한 번만 계산한다.

```typescript
// 기존: const { stCode, stockName, mrktCode } = useLocalSearchParams();
// 추가:
import { MarketCode, MARKETS } from '../../../types/market';
import { getCurrencySymbol } from '../../../utils/format';

const effectiveMrktCode: MarketCode = (mrktCode as MarketCode) || currentMrktCode;
const isOverseas = effectiveMrktCode === 'NASD';
const currencyUnit = isOverseas ? '$' : '원';
```

**변경 위치**: line 51~59 영역

---

## D-2. 금액 프리셋 마켓별 분기

상수 `AMOUNT_PRESETS`를 마켓별로 분리한다.

```typescript
const AMOUNT_PRESETS_KR = [
    { label: '100만', value: 1000000 },
    { label: '500만', value: 5000000 },
    { label: '1000만', value: 10000000 },
];

const AMOUNT_PRESETS_US = [
    { label: '$1,000', value: 1000 },
    { label: '$5,000', value: 5000 },
    { label: '$10,000', value: 10000 },
];
```

컴포넌트 내에서 선택:

```typescript
const amountPresets = isOverseas ? AMOUNT_PRESETS_US : AMOUNT_PRESETS_KR;
```

**변경 위치**: line 37~41 (상수 정의), 컴포넌트 내 사용부

---

## D-3. 통화 단위 텍스트 분기

### D-3-1. 금액 입력 영역 단위 (line 321)

```diff
- <Text style={styles.amountUnit}>원</Text>
+ <Text style={styles.amountUnit}>{currencyUnit}</Text>
```

### D-3-2. 달러 시 `$` 접두사 위치 조정

미국 마켓일 때는 금액 앞에 `$`를 표시하고 뒤에 단위를 붙이지 않는 패턴이 자연스럽다.  
하지만 현재 UI 구조(입력 → 단위)를 유지하되, `$`는 입력 왼쪽에 접두사로 표시한다.

```typescript
// 금액 표시 영역
<View style={styles.amountDisplay}>
    {isOverseas && <Text style={styles.amountPrefix}>$</Text>}
    <TextInput ... />
    {!isOverseas && <Text style={styles.amountUnit}>원</Text>}
</View>
```

**스타일 추가**:
```typescript
amountPrefix: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginRight: Spacing.xs,
},
```

---

## D-4. 금액 입력 포맷 분기

### D-4-1. keyboardType 분기

```typescript
keyboardType={isOverseas ? 'decimal-pad' : 'number-pad'}
```

### D-4-2. onChangeText 파싱 분기

```typescript
onChangeText={(text) => {
    if (isOverseas) {
        // 달러: 소수점 허용, $와 콤마 제거
        const cleaned = text.replace(/[$,]/g, '');
        const number = parseFloat(cleaned) || 0;
        handleChange('INIT_AMOUNT', number);
    } else {
        // 원화: 정수만, 콤마 제거
        const numericValue = text.replace(/,/g, '');
        const number = parseInt(numericValue) || 0;
        handleChange('INIT_AMOUNT', number);
    }
}}
```

### D-4-3. value 표시 포맷 분기

```typescript
value={
    form.INIT_AMOUNT
        ? isOverseas
            ? form.INIT_AMOUNT.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            : form.INIT_AMOUNT.toLocaleString()
        : ''
}
```

---

## D-5. 프리셋 버튼 렌더링 변경

`AMOUNT_PRESETS` → `amountPresets`로 교체 (3곳):

| 위치 | 변경 |
|------|------|
| line 324 `AMOUNT_PRESETS.map(...)` | `amountPresets.map(...)` |
| line 345 `AMOUNT_PRESETS.some(...)` | `amountPresets.some(...)` |
| line 352 `AMOUNT_PRESETS.some(...)` | `amountPresets.some(...)` |

---

## D-6. 스톡 헤더 마켓 표시 (P2)

```typescript
<View style={styles.stockInfo}>
    <Text style={styles.stockNameText}>
        {stockName} {isOverseas && <Text style={styles.marketBadgeText}>US</Text>}
    </Text>
    <Text style={styles.stockSubText}>스윙 매매 설정</Text>
</View>
```

**스타일 추가**:
```typescript
marketBadgeText: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: '600',
},
```

---

## 구현 순서

| 순서 | 항목 | 설계 참조 |
|------|------|-----------|
| 1 | import 추가 + 파생 변수 계산 | D-1 |
| 2 | 프리셋 상수 마켓별 분리 | D-2 |
| 3 | 통화 단위 분기 ($ 접두사 / 원 접미사) | D-3 |
| 4 | 금액 입력 포맷/파싱 분기 | D-4 |
| 5 | 프리셋 버튼 참조 변경 | D-5 |
| 6 | 스톡 헤더 마켓 표시 | D-6 |

## 회귀 방지 체크포인트

- [ ] 국내 주식 등록 시 기존과 동일하게 동작 (원화, 정수, 국내 프리셋)
- [ ] 미국 주식 등록 시 `$` 접두사, 소수점 입력, 달러 프리셋 표시
- [ ] `mrktCode` 파라미터 누락 시 `currentMrktCode` 폴백 정상 동작
- [ ] 프리셋 선택/직접입력 토글 양쪽 마켓 모두 정상
- [ ] 폼 제출(`handleSave`) 시 `INIT_AMOUNT` 값이 숫자로 정상 전달
