import { isOverseasMarket } from './market';

// 풀(총자산 공유) 매수 설정 — 백엔드 PoolSettingResponse 매핑
// 계좌 × 시장(국내/미국) 단위. 켜면 종목별 배정금 대신 총자산 대비 리스크로 수량이 정해진다.
export type PoolMarket = 'KR' | 'US';

export type PoolSetting = {
    ACCOUNT_NO: string;
    MARKET: PoolMarket;
    USE_YN: 'Y' | 'N';
    MAX_POSITIONS: number;     // 동시 보유 종목 수 (사용자 설정, 7~30)
    // 아래 세 값은 서버가 종목 수에서 정한 읽기 전용 값이다
    RISK_PCT: number;          // 한 거래 손절 시 총자산 대비 손실 (0.007 = 0.7%)
    MAX_POSITION_PCT: number;  // 종목당 최대 비중 (0.095 = 9.5% = 95% ÷ 종목 수)
    MAX_OPEN_RISK_PCT: number; // 전체 미청산 리스크 한도 (0.08 = 8%, 고정)
    PARK_RESERVE_PCT: number;  // 파킹할 때 현금으로 남길 비율 (0.05 = 총자산의 5%)
};

// 파킹 ETF는 시장별로 고정이다 (서버 PARK_ETF 와 같은 값 — 표시용)
export const PARK_ETF_LABEL: Record<PoolMarket, string> = {
    KR: 'KODEX CD금리액티브(합성) · 459580',
    US: 'iShares 0-3 Month Treasury ETF · SGOV',
};

// 파킹 ETF 보유 현황 — 보유를 읽지 못하면 QTY/VALUE 는 null
export type ParkingStatus = {
    PARK_CODE: string;
    QTY: number | null;
    VALUE: number | null;
};

// 파킹 실행 결과 — STATUS 로 구분한다 (parked 외에는 MESSAGE 를 사용자에게 보여준다)
export type ParkResultStatus = 'parked' | 'nothing' | 'unconfirmed' | 'failed' | 'busy' | 'closed';
export type ParkResult = {
    STATUS: ParkResultStatus;
    QTY: number;
    AMOUNT: number;
    MESSAGE: string;
};

// 저장 요청 — 보낸 항목만 바뀐다. 사용자가 정하는 매수 규칙은 종목 수(MAX_POSITIONS) 하나뿐이다:
// 종목당 최대 비중·거래당 리스크는 종목 수에서 자동으로 정해지고 미청산 리스크 한도는 고정이라 보낼 수 없다
// (타입에서 뺀다 — 보내면 서버가 422 로 거절한다)
export type PoolSettingUpdate = {
    ACCOUNT_NO: string;
    MARKET: PoolMarket;
    USE_YN?: 'Y' | 'N';
    MAX_POSITIONS?: number;     // 동시 보유 종목 수 (7~30) — 종목당 최대 비중·거래당 리스크는 여기서 자동으로 정해진다
    PARK_RESERVE_PCT?: number;
};

// 시장 코드 → 풀 시장 구분. 앱의 글로벌 시장 전환은 미국을 'US' 로 저장하고 종목·스윙은 NYS/NAS/AMS 를 쓰므로,
// 앱 전체와 같은 기준(국내 'J' 가 아니면 해외)으로 판별한다.
// (예전에는 NYS/NAS/AMS 만 미국으로 봐서 'US' 로 전환해도 국내 설정이 보였다)
export const poolMarketOf = (mrktCode?: string): PoolMarket =>
    isOverseasMarket(mrktCode) ? 'US' : 'KR';
