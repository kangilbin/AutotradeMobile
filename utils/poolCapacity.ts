// 풀 설정 값으로 '실제로 몇 종목까지 들어가는지' 계산한다 (화면 안내용 — 서버 로직과 같은 한도 구조)
//
// 한 종목 금액 = 총자산 × 거래당 리스크 ÷ 손절폭, 종목당 최대 비중에서 잘린다.
// 손절폭은 가장 넓은 7%(청산선 = max(진입가 − ATR×2, 진입가 × 0.93))를 기준으로 한다 —
// 가장 작게 사는 경우라서 변동성이 낮은 종목은 더 크게 사고, 총 노출은 '이상'이다.
// 보유 종목 수는 세 한도 중 가장 먼저 걸리는 값이다: 직접 정한 종목 수 / 미청산 리스크 한도 ÷ 거래당 리스크 / 현금.

export const WIDEST_STOP_PCT = 0.07;

// 동시 보유 종목 수(사용자 설정)와 거기서 자동으로 정해지는 규칙 — 서버 domain/pool/entity.py derive_limits 와 같은 식이다.
//   종목당 최대 비중 = 95% ÷ N (내림), 거래당 리스크 = max(0.70%, 비중 × 7% 올림)
// 실수 오차로 서버와 어긋나지 않도록 정수(1e-4, 1e-5 단위)로 계산한다.
export const MIN_POSITIONS = 7;
export const MAX_POSITIONS = 30;
export const DEFAULT_POSITIONS = 10;

export function derivePoolRules(maxPositions: number): { maxPositionPct: number; riskPct: number } {
    const pct4 = Math.floor(9500 / maxPositions);             // 0.95 ÷ N, 1e-4 단위 내림
    const risk5 = Math.max(700, Math.ceil((pct4 * 7) / 10));  // 비중 × 7%, 1e-5 단위 올림, 하한 0.70%
    return { maxPositionPct: pct4 / 1e4, riskPct: risk5 / 1e5 };
}

export type PoolBinding = 'count' | 'openRisk' | 'cash';

export type PoolCapacity = {
    avgPositionPct: number;   // 종목당 평균 비중 (0.0143 = 1.43%)
    maxCount: number;         // 실제 최대 보유 종목 수
    binding: PoolBinding;     // 가장 먼저 걸리는 한도
    exposurePct: number;      // 그만큼 보유했을 때 총자산 대비 노출 (1 = 100%)
    capHit: boolean;          // 종목당 평균이 최대 비중 천장에 닿았는가 (손절폭 7% 기준)
    exceedsAssets: boolean;   // 최대 비중으로만 계산하면 총자산을 넘는가 (현금이 없으면 매수하지 않으므로 실제로는 넘지 못함)
};

export function poolCapacity(
    riskPct: number,            // 거래당 리스크 (비율)
    maxPositionPct: number,     // 종목당 최대 비중 (비율)
    maxOpenRiskPct: number,     // 미청산 리스크 한도 (비율)
    maxPositions: number | null // 직접 정한 동시 보유 종목 수 (null = 제한 없음)
): PoolCapacity | null {
    if (![riskPct, maxPositionPct, maxOpenRiskPct].every(v => Number.isFinite(v) && v > 0)) return null;
    if (maxPositions !== null && !(Number.isInteger(maxPositions) && maxPositions >= 1)) return null;

    const uncapped = riskPct / WIDEST_STOP_PCT;
    const avgPositionPct = Math.min(uncapped, maxPositionPct);
    // 부동소수 오차로 80 이 79.99999 로 내려가지 않게 아주 작은 값을 더해 내림한다
    const byCash = Math.floor(1 / avgPositionPct + 1e-9);
    // 미청산 리스크 한도는 '실제로 잃을 금액' 기준이다 — 비중이 거래당 리스크보다 먼저 한 종목을 자르면
    // 그 종목이 손절될 때 잃는 금액은 (비중 × 손절폭) 이라 명목 거래당 리스크보다 작다 (서버: sized.risk_amount)
    const actualRisk = Math.min(riskPct, avgPositionPct * WIDEST_STOP_PCT);
    const byOpenRisk = Math.floor(maxOpenRiskPct / actualRisk + 1e-9);
    const byCount = maxPositions ?? Infinity;

    const maxCount = Math.min(byCount, byOpenRisk, byCash);
    const binding: PoolBinding = maxCount === byCount ? 'count' : maxCount === byOpenRisk ? 'openRisk' : 'cash';
    return {
        avgPositionPct,
        maxCount,
        binding,
        exposurePct: Math.min(1, maxCount * avgPositionPct),
        capHit: uncapped >= maxPositionPct,
        exceedsAssets: maxCount * maxPositionPct > 1,
    };
}
