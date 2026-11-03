import { MarketCode } from './market';

// 스윙 목록 조회 응답 타입
export type SwingListResponse = {
    list: SwingItem[];
    summary: SwingSummary;
}

// 스윙 아이템 타입
export type SwingItem = {
    SWING_ID: number
    ST_CODE: string
    ST_NM: string
    SWING_TYPE: string
    MRKT_CODE?: MarketCode  // 시장 코드 (J: 국내 / NYS·NAS·AMS: 미국) — 통화 표시 기준
    INIT_AMOUNT: number  // 원금
    EVLU_AMT: number  // 평가금액
    EVLU_PFLS_AMT: number  // 평가손익금액
    EVLU_PFLS_RT: number  // 평가손익율
    REALIZED_PFLS_AMT?: number  // 확정 손익 누적 — 풀 모드 행(INIT_AMOUNT=0)에만 내려온다
    HLDG_QTY: number  // 보유수량
    ENTRY_PRICE: number | null  // 매입평균가 (매수 전 null)
    PRPR: number | null  // 현재가 (매수 전 null)
    USE_YN: string  // 스윙 활성화 여부 ('Y' | 'N')
    FULL_ENTRY_YN?: FullEntryYn  // 매수 방식 ('Y' 전량 / 'N' 신호 강도 비례)
}

// 매수 방식 (SWING_TRADE.FULL_ENTRY_YN) — 앱에서는 더 이상 고르지 않는다 (풀 모드의 매수 수량은 풀 설정의 고정 규칙으로 정해진다).
// 서버가 내려주는 값이라 타입만 남긴다.
export type FullEntryYn = 'Y' | 'N';

// 가용 자본 조회 응답 타입
// 모의투자는 현금/주문가능 소스가 없어 한도 추적이 불가능하다.
// 이 경우 total_capital / available_capital 은 null 로 내려오고 capital_tracking 이 false 가 된다.
export type AvailableCapitalResponse = {
    total_capital: number | null       // 예수금 (현금) — 모의: null
    allocated: number                  // 기존 할당 합계
    available_capital: number | null   // 가용 자본 — 모의: null
    capital_tracking: boolean          // 한도 추적 가능 여부 (실전: true / 모의: false)
}

// 스윙 요약 정보 타입
export type SwingSummary = {
    TOTAL_INVESTMENT_AMOUNT: number  // 총 자본금 (예수금 + 보유주식 평가금액)
    // 보유 기준 (지금 들고 있는 주식)
    TOTAL_PURCHASE_AMOUNT: number  // 매입금액 (보유주식 매입금액 합계)
    UNREALIZED_PROFIT: number  // 평가손익
    UNREALIZED_PROFIT_RATE: number  // 평가손익 ÷ 매입금액
    // 누적 기준 (목록 스윙 합계 — 매도 완료분 손익 포함)
    TOTAL_PRINCIPAL: number  // 원금 — 풀 모드(POOL_MODE): 총평가 − 누적 손익(추정, 입출금 미반영) / 그 외: 스윙 기준 합계
    TOTAL_VALUE: number  // 누적 평가금액 — 풀 모드: 현재 총자산 / 그 외: 원금 + 종합 수익
    TOTAL_PROFIT: number  // 종합 수익 (목록 손익 합계, 손절 포함)
    TOTAL_PROFIT_RATE: number  // 종합 수익 ÷ 원금
    CASH_ASSET: number | null  // 현금 자산 — 예수금 산출 불가 시 null (미지원)
    POOL_MODE?: boolean  // true: 풀 모드 요약 — TOTAL_PRINCIPAL 은 원금(추정, 총평가−누적 손익), 수익률은 그 원금 대비
    PARKING?: SwingParking | null  // 파킹 ETF 보유 — 스윙이 아니라 목록에 없고 요약에만 나온다. 파킹을 안 쓰거나 보유가 없으면 null
}

// 요약의 파킹 ETF 보유 (이자를 받는 현금성 자산) — 평가금은 총 자본금에 이미 포함돼 있다
export type SwingParking = {
    PARK_CODE: string
    PARK_NM: string
    QTY: number
    VALUE: number   // 평가금액
    PROFIT: number  // 현재 보유분의 평가손익 (팔면서 확정된 분은 기록하지 않는다)
}
