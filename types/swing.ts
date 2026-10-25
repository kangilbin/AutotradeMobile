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
// 'N': 신호 강도(conviction)에 비례해 배정금의 32~80% 투입 — 기본값 (단일 이평선)
//      오더블럭은 손절폭 기준 (손절 시 배정금 2% 손실, 상한 80%) — fullEntryOptionsFor 참고
export type FullEntryYn = 'Y' | 'N';

export type FullEntryOption = { value: FullEntryYn; label: string; description: string };

export const FULL_ENTRY_OPTIONS: FullEntryOption[] = [
    { value: 'N', label: '신호 강도 비례', description: '신호 강도에 따라 배정금의 32~80%를 매수합니다' },
    { value: 'Y', label: '전량 매수', description: '매수 신호가 나면 배정금 전량을 매수합니다' },
];

// 오더블럭('O')은 수량을 손절폭으로 정한다 (백엔드 BaseOrderBlockStrategy.entry_qty — RISK_PER_TRADE 2%, 상한 80%)
const ORDER_BLOCK_FULL_ENTRY_OPTIONS: FullEntryOption[] = [
    { value: 'N', label: '손절폭 기준', description: '손절되면 배정금의 2%만 잃도록 수량을 정합니다 (최대 배정금의 80%)' },
    FULL_ENTRY_OPTIONS[1],
];

/** 전략별 매수 방식 선택지 — 같은 'N'이라도 전략마다 수량을 정하는 방식이 다르다 */
export const fullEntryOptionsFor = (swingType?: string): FullEntryOption[] =>
    swingType === 'O' ? ORDER_BLOCK_FULL_ENTRY_OPTIONS : FULL_ENTRY_OPTIONS;

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
    TOTAL_PRINCIPAL: number  // 배정금 (스윙 금액 합계 — 실제 매수액이 아니라 가용자본에서 묶인 돈, 손절해도 줄지 않음)
    TOTAL_VALUE: number  // 누적 평가금액 (배정금 + 종합 수익 = 스윙별 잔여 현금 + 보유 평가금액 합)
    TOTAL_PROFIT: number  // 종합 수익 (목록 손익 합계, 손절 포함)
    TOTAL_PROFIT_RATE: number  // 종합 수익 ÷ 배정금
    CASH_ASSET: number | null  // 현금 자산 — 예수금 산출 불가 시 null (미지원)
}