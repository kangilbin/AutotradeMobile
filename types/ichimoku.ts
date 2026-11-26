// 일목균형표(SWING_TYPE 'I') 차트 데이터 — 백엔드 GET /trade-history/{id} · POST /backtesting 응답
//
// 날짜별 값은 모두 "그 날짜에 그려지는 위치" 기준이다. 그래서 날짜만 맞춰 선을 이으면 되고, 앱에서 시프트를 다시 계산하지 않는다.
//  - senkou_a / senkou_b(선행스팬): 표준대로 26봉 앞에 그려지는 값이라 그 날짜 칸에는 26봉 전에 계산한 값이 들어 있다.
//    두 선 사이가 구름이고 senkou_a >= senkou_b 면 양운이다.
//  - chikou(후행스팬): 26봉 뒤 종가를 그 날짜에 둔 값이라 마지막 26봉은 null 이다.
//  - 계산할 수 없는 앞쪽(워밍업) 구간은 null 이다.
export type IchimokuHistoryItem = {
    STCK_BSOP_DATE: string;       // 'YYYYMMDD' 또는 'YYYY-MM-DD'
    tenkan: number | null;        // 전환선
    kijun: number | null;         // 기준선
    senkou_a: number | null;      // 선행스팬 A
    senkou_b: number | null;      // 선행스팬 B
    cloud_top: number | null;     // 구름 상단 (= max(a, b))
    cloud_bot: number | null;     // 구름 하단 (= min(a, b))
    chikou: number | null;        // 후행스팬
};

// 마지막 봉 뒤 26봉의 구름 (차트 오른쪽으로 뻗는 구름).
// 날짜는 영업일로 추정한 값이라 휴장일이 있으면 실제 거래일과 어긋날 수 있다 (estimated: true).
// 과거 구간만 조회하면 빈 목록이다.
export type IchimokuFutureItem = {
    STCK_BSOP_DATE: string;
    senkou_a: number;
    senkou_b: number;
    cloud_top: number;
    cloud_bot: number;
    estimated: boolean;
};
