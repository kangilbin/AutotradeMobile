export type StockStatus = {
    ST_CODE: string
    SD_CODE: string
    NAME: string
    DEL_YN: string
}

export type StockResponse = {
    data: StockStatus[];
}

// 주식 오토 설정 등록 요청 타입
export type AddStockAutoRequest = {
    ST_CODE: string
    ACCOUNT_NO: string
    SWING_AMOUNT: number
    SWING_TYPE: string  // 'D' 또는 'M'
    SHORT_TERM: number    // 단기 이평선
    MEDIUM_TERM: number      // 중기 이평선
    LONG_TERM: number     // 장기 이평선
    BUY_RATIO: number   // 매수 비율
    SELL_RATIO: number  // 매도 비율
}

// 주식 오토 설정 상태 타입
export type StockAutoStatus = {
    AUTO_ID: number
    STOCK_NAME: string
    SWING_TYPE: string
    SHORT_MA: number
    MID_MA: number
    LONG_MA: number
    BUY_RATIO: number
    SELL_RATIO: number
    DEL_YN: string
    CREATED_AT: string
}

// 주식 시세 API 응답 타입
export type StockPriceResponse = {
    rt_cd: string;        // 성공 실패 여부
    msg_cd: string;       // 응답코드
    msg1: string;         // 응답메세지
    output1: StockPriceOutput1;
    output2: StockPriceOutput2;
}

export type StockPriceOutput1 = {
    aspr_acpt_hour: string;           // 호가 접수 시간
    
    // 매도호가 1~10
    askp1: string;
    askp2: string;
    askp3: string;
    askp4: string;
    askp5: string;
    askp6: string;
    askp7: string;
    askp8: string;
    askp9: string;
    askp10: string;
    
    // 매수호가 1~10
    bidp1: string;
    bidp2: string;
    bidp3: string;
    bidp4: string;
    bidp5: string;
    bidp6: string;
    bidp7: string;
    bidp8: string;
    bidp9: string;
    bidp10: string;
    
    // 매도호가 잔량 1~10
    askp_rsqn1: string;
    askp_rsqn2: string;
    askp_rsqn3: string;
    askp_rsqn4: string;
    askp_rsqn5: string;
    askp_rsqn6: string;
    askp_rsqn7: string;
    askp_rsqn8: string;
    askp_rsqn9: string;
    askp_rsqn10: string;
    
    // 매수호가 잔량 1~10
    bidp_rsqn1: string;
    bidp_rsqn2: string;
    bidp_rsqn3: string;
    bidp_rsqn4: string;
    bidp_rsqn5: string;
    bidp_rsqn6: string;
    bidp_rsqn7: string;
    bidp_rsqn8: string;
    bidp_rsqn9: string;
    bidp_rsqn10: string;
    
    // 매도호가 잔량 증감 1~10
    askp_rsqn_icdc1: string;
    askp_rsqn_icdc2: string;
    askp_rsqn_icdc3: string;
    askp_rsqn_icdc4: string;
    askp_rsqn_icdc5: string;
    askp_rsqn_icdc6: string;
    askp_rsqn_icdc7: string;
    askp_rsqn_icdc8: string;
    askp_rsqn_icdc9: string;
    askp_rsqn_icdc10: string;
    
    // 매수호가 잔량 증감 1~10
    bidp_rsqn_icdc1: string;
    bidp_rsqn_icdc2: string;
    bidp_rsqn_icdc3: string;
    bidp_rsqn_icdc4: string;
    bidp_rsqn_icdc5: string;
    bidp_rsqn_icdc6: string;
    bidp_rsqn_icdc7: string;
    bidp_rsqn_icdc8: string;
    bidp_rsqn_icdc9: string;
    bidp_rsqn_icdc10: string;
    
    // 총 잔량 및 증감
    total_askp_rsqn: string;          // 총 매도호가 잔량
    total_bidp_rsqn: string;          // 총 매수호가 잔량
    total_askp_rsqn_icdc: string;     // 총 매도호가 잔량 증감
    total_bidp_rsqn_icdc: string;     // 총 매수호가 잔량 증감
    
    // 시간외 관련
    ovtm_total_askp_icdc: string;     // 시간외 총 매도호가 증감
    ovtm_total_bidp_icdc: string;     // 시간외 총 매수호가 증감
    ovtm_total_askp_rsqn: string;     // 시간외 총 매도호가 잔량
    ovtm_total_bidp_rsqn: string;     // 시간외 총 매수호가 잔량
    
    // 기타
    ntby_aspr_rsqn: string;           // 순매수 호가 잔량
    new_mkop_cls_code: string;        // 신 장운영 구분 코드
}

// new_mkop_cls_code 설명
// '00' : 장전 예상체결가와 장마감 동시호가
// '49' : 장후 예상체결가
// (1) 첫 번째 비트
// 1 : 장개시전
// 2 : 장중
// 3 : 장종료후
// 4 : 시간외단일가
// 7 : 일반Buy-in
// 8 : 당일Buy-in
// (2) 두 번째 비트
// 0 : 보통
// 1 : 종가
// 2 : 대량
// 3 : 바스켓
// 7 : 정리매매
// 8 : Buy-in'

export type StockPriceOutput2 = {
    antc_mkop_cls_code: string;       // 예상 장운영 구분 코드
    stck_prpr: string;                // 주식 현재가
    stck_oprc: string;                // 주식 시가
    stck_hgpr: string;                // 주식 최고가
    stck_lwpr: string;                // 주식 최저가
    stck_sdpr: string;                // 주식 기준가
    antc_cnpr: string;                // 예상 체결가
    antc_cntg_vrss_sign: string;      // 예상 체결 대비 부호
    antc_cntg_vrss: string;           // 예상 체결 대비
    antc_cntg_prdy_ctrt: string;      // 예상 체결 전일 대비율
    antc_vol: string;                 // 예상 거래량
    stck_shrn_iscd: string;           // 주식 단축 종목코드
    vi_cls_code: string;              // VI적용구분코드
}


