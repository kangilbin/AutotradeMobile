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
    HLDG_QTY: number  // 보유수량
    ENTRY_PRICE: number | null  // 매입평균가 (매수 전 null)
    PRPR: number | null  // 현재가 (매수 전 null)
    USE_YN: string  // 스윙 활성화 여부 ('Y' | 'N')
    FULL_ENTRY_YN?: FullEntryYn  // 매수 방식 ('Y' 전량 / 'N' 신호 강도 비례)
}

// 매수 방식 (SWING_TRADE.FULL_ENTRY_YN)
// 'Y': 매수 신호 시 배정금 전량 투입 (호가 차이 버퍼로 99%)
// 'N': 신호 강도(conviction)에 비례해 배정금의 32~80% 투입 — 기본값
export type FullEntryYn = 'Y' | 'N';

export const FULL_ENTRY_OPTIONS: { value: FullEntryYn; label: string; description: string }[] = [
    { value: 'N', label: '신호 강도 비례', description: '신호 강도에 따라 배정금의 32~80%를 매수합니다' },
    { value: 'Y', label: '전량 매수', description: '매수 신호가 나면 배정금 전량을 매수합니다' },
];

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
    TOTAL_INVESTMENT_AMOUNT: number  // 내 투자 금액 (모의: 현금 제외 보유평가만)
    TOTAL_PRINCIPAL: number  // 원금
    TOTAL_PROFIT: number  // 총 수익
    TOTAL_PROFIT_RATE: number  // 총 수익률
    CASH_ASSET: number | null  // 현금 자산 — 모의: null (미지원)
}