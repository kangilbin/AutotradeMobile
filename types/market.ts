// 'J' 국내, 'US' 미국 전체(글로벌 토글), NYS/NAS/AMS 개별 거래소(홈탭 랭킹·종목 고유)
export type MarketCode = 'J' | 'US' | 'NYS' | 'NAS' | 'AMS';

export type MarketInfo = {
    code: MarketCode;
    label: string;
    currency: string;
    currencySymbol: string;
};

export const MARKETS: Record<MarketCode, MarketInfo> = {
    J: {
        code: 'J',
        label: '국내',
        currency: 'KRW',
        currencySymbol: '\u{20A9}',
    },
    US: {
        code: 'US',
        label: '미국',
        currency: 'USD',
        currencySymbol: '$',
    },
    NYS: {
        code: 'NYS',
        label: '뉴욕',
        currency: 'USD',
        currencySymbol: '$',
    },
    NAS: {
        code: 'NAS',
        label: '나스닥',
        currency: 'USD',
        currencySymbol: '$',
    },
    AMS: {
        code: 'AMS',
        label: '아멕스',
        currency: 'USD',
        currencySymbol: '$',
    },
};

// 개별 미국 거래소 코드 (홈탭 랭킹·종목 고유 코드)
export const US_EXCHANGE_CODES: MarketCode[] = ['NYS', 'NAS', 'AMS'];

/** 해외(미국) 시장 여부. 국내(J)가 아니면 모두 해외 — 'US' 그룹·개별 거래소 모두 true */
export const isOverseasMarket = (code: string | null | undefined): boolean =>
    !!code && code !== 'J';