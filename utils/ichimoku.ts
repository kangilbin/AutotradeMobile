import type { CloudOverlay, LineOverlay } from '../components/StockChart';
import type { IchimokuFutureItem, IchimokuHistoryItem } from '../types/ichimoku';

// 일목균형표 차트 색 — 한국 시장 관례(상승 빨강·하락 파랑)에 맞춰 양운은 빨강 계열, 음운은 파랑 계열로 칠한다.
//
// 구름(선행스팬 A/B)만 그린다. 전환선·기준선·후행스팬은 의도적으로 뺐다 — 겹쳐 보여 차트가 어지럽고,
// 청산 규칙(종가가 구름 하단 아래로 마감)은 구름만으로 읽힌다. 후행스팬은 전략에서 쓰지도 않는다.
// 서버는 세 값(tenkan·kijun·chikou)을 계속 내려주므로, 다시 필요하면 toPoints 로 선을 추가하면 된다.
export const ICHIMOKU_COLORS = {
    senkouA: '#FF6B6B',   // 선행스팬 A — 구름 경계
    senkouB: '#3498DB',   // 선행스팬 B — 구름 경계
    cloudBull: 'rgba(255,107,107,0.16)',   // 양운 (A >= B)
    cloudBear: 'rgba(52,152,219,0.16)',    // 음운 (A < B)
} as const;

// 'YYYYMMDD' → 'YYYY-MM-DD' (이미 '-' 가 있으면 그대로)
const toDateStr = (s: string): string =>
    s.includes('-') ? s : `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;

type Point = { time: string; value: number };

// 값이 있는 날짜만 점으로 만든다. 계산 전 구간(null)·미래 칸이 섞여도 선이 끊기지 않고 이어진다.
const toPoints = <T extends { STCK_BSOP_DATE: string }>(
    items: T[],
    pick: (item: T) => number | null | undefined,
): Point[] => {
    const out: Point[] = [];
    for (const item of items) {
        const v = pick(item);
        if (v == null || Number.isNaN(Number(v))) continue;
        out.push({ time: toDateStr(item.STCK_BSOP_DATE), value: Number(v) });
    }
    return out;
};

/**
 * 백엔드 일목 응답 → StockChart 가 그리는 구름 경계선 2개(선행스팬 A/B) + 구름
 *
 * - 선행스팬 A/B 는 과거(history) 뒤에 미래 구름(future)을 이어 붙여 오른쪽으로 뻗게 한다
 * - 전환선·기준선·후행스팬은 그리지 않는다 (위 ICHIMOKU_COLORS 설명 참고)
 * - 구름은 A·B 가 모두 있는 날짜만 채운다
 * - 데이터가 없으면 선·구름 모두 비어 있다 (단일 EMA 스윙의 응답에는 일목 값이 없다)
 */
export const buildIchimoku = (
    history: IchimokuHistoryItem[] | undefined,
    future: IchimokuFutureItem[] | undefined,
): { lineOverlays: LineOverlay[]; cloud: CloudOverlay | null } => {
    const hist = history ?? [];
    const fut = future ?? [];
    if (hist.length === 0) return { lineOverlays: [], cloud: null };

    const lineOverlays: LineOverlay[] = [
        {
            data: [...toPoints(hist, h => h.senkou_a), ...toPoints(fut, f => f.senkou_a)],
            color: ICHIMOKU_COLORS.senkouA, lineWidth: 1, title: '선행A',
        },
        {
            data: [...toPoints(hist, h => h.senkou_b), ...toPoints(fut, f => f.senkou_b)],
            color: ICHIMOKU_COLORS.senkouB, lineWidth: 1, title: '선행B',
        },
    ].filter(o => o.data.length > 0);

    const cloudPoints: { time: string; a: number; b: number }[] = [];
    for (const h of hist) {
        if (h.senkou_a == null || h.senkou_b == null) continue;
        cloudPoints.push({ time: toDateStr(h.STCK_BSOP_DATE), a: Number(h.senkou_a), b: Number(h.senkou_b) });
    }
    for (const f of fut) {
        cloudPoints.push({ time: toDateStr(f.STCK_BSOP_DATE), a: Number(f.senkou_a), b: Number(f.senkou_b) });
    }

    return {
        lineOverlays,
        cloud: cloudPoints.length >= 2
            ? { points: cloudPoints, bullColor: ICHIMOKU_COLORS.cloudBull, bearColor: ICHIMOKU_COLORS.cloudBear }
            : null,
    };
};

// 차트 범례 — 오버레이 선들과 구름을 한 줄로 보여 준다 (단일 EMA 는 '20EMA' 한 줄, 일목은 선행A·선행B·구름)
export const getOverlayLegend = (
    lineOverlays: LineOverlay[],
    cloud: CloudOverlay | null | undefined,
): { label: string; color: string }[] => {
    const items = lineOverlays.map(o => ({ label: o.title ?? '', color: o.color })).filter(i => i.label);
    if (cloud) items.push({ label: '구름', color: ICHIMOKU_COLORS.senkouA });
    return items;
};
