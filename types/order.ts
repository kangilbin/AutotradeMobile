// 전량 매도 요청 타입
export type SellAllRequest = {
    ST_CODE: string;    // 종목코드
    MRKT_CODE: string;  // 시장구분코드 (J, NX, UN, NYS, NAS, AMS)
    QTY: number;        // 매도 수량
};