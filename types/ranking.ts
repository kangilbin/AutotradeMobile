export type RankingTab = 'fluctuation' | 'volume' | 'volume_power';

// 등락률 필터 옵션
export type FluctuationSortCode = '0' | '1'; // 0:상승율순, 1:하락율순
export type FluctuationPriceCode = '0' | '1'; // 상승율: 0=저가대비,1=종가대비 / 하락율: 0=고가대비,1=종가대비

// 거래량 필터 옵션
export type VolumeBlngCode = '0' | '1' | '3'; // 0:평균거래량, 1:거래증가율, 3:거래금액순

// 체결강도 시장 필터
export type VolumePowerMarketCode = '0000' | '0001' | '1001' | '2001'; // 전체, 거래소, 코스닥, 코스피200

// 등락률 순위 아이템
export interface FluctuationRankItem {
    stck_shrn_iscd: string;    // 종목코드
    data_rank: string;         // 순위
    hts_kor_isnm: string;     // 종목명
    stck_prpr: string;        // 현재가
    prdy_vrss: string;        // 전일대비
    prdy_vrss_sign: string;   // 전일대비 부호 (1:상한,2:상승,3:보합,4:하한,5:하락)
    prdy_ctrt: string;        // 전일대비율
    acml_vol: string;         // 누적거래량
}

// 거래량 순위 아이템
export interface VolumeRankItem {
    hts_kor_isnm: string;     // 종목명
    mksc_shrn_iscd: string;   // 종목코드
    data_rank: string;        // 순위
    stck_prpr: string;        // 현재가
    prdy_vrss_sign: string;   // 전일대비 부호
    prdy_vrss: string;        // 전일대비
    prdy_ctrt: string;        // 전일대비율
    acml_vol: string;         // 누적거래량
    vol_inrt: string;         // 거래량증가율
    vol_tnrt: string;         // 거래량 회전율
    acml_tr_pbmn: string;     // 누적 거래대금
}

// 체결강도 순위 아이템
export interface VolumePowerRankItem {
    stck_shrn_iscd: string;   // 종목코드
    data_rank: string;        // 순위
    hts_kor_isnm: string;     // 종목명
    stck_prpr: string;        // 현재가
    prdy_vrss: string;        // 전일대비
    prdy_vrss_sign: string;   // 전일대비 부호
    prdy_ctrt: string;        // 전일대비율
    tday_rltv: string;        // 당일 체결강도
    seln_cnqn_smtn: string;   // 매도 체결량 합계
    shnu_cnqn_smtn: string;   // 매수 체결량 합계
}
