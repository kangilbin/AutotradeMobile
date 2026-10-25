// AI 종목 분석 (Gemini) — 스윙 등록 전 판단 보조 (국내 종목)
// 분석은 1분 이상 걸려 백엔드가 백그라운드로 처리하고, 앱은 목록을 폴링해 상태를 확인한다.

export type StockReviewStatus = 'RUNNING' | 'DONE' | 'FAILED';

export const QUOTA_EXHAUSTED = 'QUOTA_EXHAUSTED';

/** 사용량 소진으로 실패했고 아직 초기화 전인지 — 이 동안은 다시 분석해도 실패하므로 재시도를 막는다 */
export const isQuotaBlocked = (item: { ERROR_CODE?: string | null; RETRY_AT?: string | null }): boolean =>
    item.ERROR_CODE === QUOTA_EXHAUSTED && !!item.RETRY_AT && new Date(item.RETRY_AT).getTime() > Date.now();

export type StockReviewVerdict = '적합' | '보류' | '부적합';

// 목록 항목 (GET /stock-review)
export type StockReviewItem = {
    ST_CODE: string
    ST_NM: string | null
    STATUS: StockReviewStatus
    VERDICT: StockReviewVerdict | null
    ERROR: string | null
    // 'QUOTA_EXHAUSTED' = AI 무료 사용량 소진 — RETRY_AT(ISO) 전까지는 다시 요청해도 실패한다
    ERROR_CODE?: string | null
    RETRY_AT?: string | null
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
    // 투자 판단 근거 — 네 관점 (관리종목 차단 결과나 이전 형식 캐시면 없을 수 있다)
    NEWS_VIEW?: string | null       // 뉴스·시황
    VALUATION_VIEW?: string | null  // 주가 수준 (PER·PBR·EPS 기준 비싼가 싼가)
    FINANCIAL_VIEW?: string | null  // 재무
    TREND_VIEW?: string | null      // 주가 흐름·수급
    // 판단과 별개로 AI가 등록된 실전 전략 중 고른 것 (SWING_TYPE). 차단 결과면 null
    RECOMMENDED_SWING_TYPE: string | null
    RECOMMENDED_STRATEGY_NAME: string | null
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
