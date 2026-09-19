import { MarketCode } from './market';

export type AccountStatus = {
    ACCOUNT_ID: number
    ACCOUNT_NO: string
    AUTH_ID: number
    SIMULATION_YN: string
}

export type AccountStore = {
    account: AccountStatus | null;
    setAccount: (account: AccountStatus) => void;
};

export type ChooseAccountRequest = {
    AUTH_ID: number,
    ACCOUNT_NO: string
}

// 삭제로 함께 사라지는 자동매매 1건
// HAS_POSITION 은 백엔드 has_open_exposure() 판정 결과 (SIGNAL 1·2 또는 HOLD_QTY > 0).
// 편입 대기 물량까지 포함하므로 프론트에서 따로 계산하지 않고 이 값을 그대로 믿는다.
export type SwingImpactItem = {
    SWING_ID: number
    ACCOUNT_NO: string   // 보안키 삭제는 여러 계좌에 걸치므로 항목별 귀속이 필요
    ST_CODE: string
    MRKT_CODE: MarketCode
    HOLD_QTY: number
    SIGNAL: number
    HAS_POSITION: boolean
}

// 계좌·보안키 삭제 영향도 (삭제 전 확인용)
// HAS_POSITION 이 true 면 증권사에 실제 주식이 남아 있다는 뜻.
// 삭제해도 주식은 그대로 남고 손절·익절 자동 매도만 멈추므로 단순 확인이 아닌 경고를 띄워야 한다.
export type DeleteImpactResponse = {
    ACCOUNT_NOS: string[]        // 함께 삭제되는 계좌번호
    SWINGS: SwingImpactItem[]    // 함께 삭제되는 자동매매
    HAS_POSITION: boolean        // 하나라도 실보유면 true
}