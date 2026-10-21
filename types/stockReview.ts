// AI 종목 분석 (Gemini) — 스윙 등록 전 판단 보조 (국내 종목)
// 분석은 1분 이상 걸려 백엔드가 백그라운드로 처리하고, 앱은 목록을 폴링해 상태를 확인한다.

export type StockReviewStatus = 'RUNNING' | 'DONE' | 'FAILED';
export type StockReviewVerdict = '적합' | '보류' | '부적합';

// 목록 항목 (GET /stock-review)
export type StockReviewItem = {
    ST_CODE: string
    ST_NM: string | null
    STATUS: StockReviewStatus
    VERDICT: StockReviewVerdict | null
    ERROR: string | null
    SEEN: boolean  // 완료 결과를 상세에서 확인했는지 — false 면 헤더에 완료 아이콘
    REQUESTED_AT: string | null
    FINISHED_AT: string | null
}

// 분석 결과 본문
export type StockReviewResult = {
    MRKT_CODE: string
    ST_CODE: string
    ST_NM: string | null
    VERDICT: StockReviewVerdict
    SUMMARY: string
    // AI가 서비스에 등록된 실전 전략 중 고른 것 (SWING_TYPE). null 이면 맞는 전략 없음
    RECOMMENDED_SWING_TYPE: string | null
    RECOMMENDED_STRATEGY_NAME: string | null
    STRATEGY_REASON: string | null  // 고른 이유 + 그 전략 기준 현재 위치
    POSITIVES: string[]
    RISKS: string[]
    KEY_NEWS: string[]
    BLOCKED_REASONS: string[]    // 관리종목 등 — 있으면 AI 판단 없이 제외된 결과
    DATA_AS_OF: string | null    // 마지막 봉 일자 (YYYYMMDD)
    INCOMPLETE_BAR: boolean      // 장중 미완성 봉 기준
    MODEL: string | null
    REVIEWED_AT: string
}

// 상세 (GET /stock-review/{st_code})
export type StockReviewDetail = StockReviewItem & {
    RESULT: StockReviewResult | null
}
